import { describe, it, expect, beforeEach, vi } from "vitest";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { hashPassword } from "@/lib/hash";
import { sendEmail } from "@/lib/email";
import {
  verifyInvitationToken,
  registerUserViaInvitation,
  requestPublicRegistration,
} from "@/lib/services/registration";
import { getLatestTermsVersion } from "@/lib/legal";

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
}));

describe("User Registration Service", () => {
  const testEmail = "invitee-registration@example.com";
  const validPassword = "SecurePassword123!";

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.APP_URL = "http://test.local";

    // テストデータのクリーンアップ
    await prisma.userInvitation.deleteMany({ where: { email: testEmail } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  describe("verifyInvitationToken", () => {
    describe("正常系", () => {
      it("有効なPENDING状態の招待トークンの場合は招待情報を返すこと", async () => {
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const invitation = await prisma.userInvitation.create({
          data: {
            email: testEmail,
            token,
            expiresAt,
            status: "PENDING",
          },
        });

        const result = await verifyInvitationToken(token);

        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.invitation.email).toBe(testEmail);
          expect(result.invitation.id).toBe(invitation.id);
        }
      });
    });

    describe("異常系", () => {
      it("存在しないトークンの場合は valid: false と適切なエラーメッセージを返すこと", async () => {
        const result = await verifyInvitationToken("non-existent-token");

        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.error).toBe("招待リンクが無効または存在しません。");
        }
      });

      it("有効期限切れ（expiresAtが過去）のトークンの場合はエラーを返すこと", async () => {
        const token = crypto.randomUUID();
        const expiredDate = new Date();
        expiredDate.setHours(expiredDate.getHours() - 1); // 1時間前に期限切れ

        await prisma.userInvitation.create({
          data: {
            email: testEmail,
            token,
            expiresAt: expiredDate,
            status: "PENDING",
          },
        });

        const result = await verifyInvitationToken(token);

        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.error).toBe("招待リンクの有効期限が切れています。");
        }
      });

      it("取り消し済み (CANCELED) のトークンの場合はエラーを返すこと", async () => {
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await prisma.userInvitation.create({
          data: {
            email: testEmail,
            token,
            expiresAt,
            status: "CANCELED",
          },
        });

        const result = await verifyInvitationToken(token);

        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.error).toBe("この招待は取り消されています。");
        }
      });

      it("使用済み (ACCEPTED) のトークンの場合はエラーを返すこと", async () => {
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await prisma.userInvitation.create({
          data: {
            email: testEmail,
            token,
            expiresAt,
            status: "ACCEPTED",
          },
        });

        const result = await verifyInvitationToken(token);

        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.error).toBe("この招待リンクは既に登録手続きに使用されています。");
        }
      });
    });
  });

  describe("registerUserViaInvitation", () => {
    describe("正常系", () => {
      it("有効なトークン、パスワード、規約同意でアカウントが新規作成され、招待ステータスがACCEPTEDに更新されること", async () => {
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await prisma.userInvitation.create({
          data: {
            email: testEmail,
            token,
            expiresAt,
            status: "PENDING",
          },
        });

        const result = await registerUserViaInvitation({
          token,
          password: validPassword,
          agreedToTerms: true,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.user.email).toBe(testEmail);
          expect(result.user.status).toBe("ACTIVE");
        }

        // 1. DB上にUserが作成されているか検証
        const createdUser = await prisma.user.findUnique({
          where: { email: testEmail },
        });
        expect(createdUser).not.toBeNull();
        expect(createdUser?.status).toBe("ACTIVE");

        // 2. パスワードが平文ではなくハッシュ化されて保存されているか検証
        expect(createdUser?.passwordHash).not.toBe(validPassword);
        expect(createdUser?.passwordHash.length).toBeGreaterThan(20);

        // 3. 利用規約同意バージョンと日時が記録されているか検証
        const expectedTermsVersion = await getLatestTermsVersion();
        expect(createdUser?.termsAgreedVersion).toBe(expectedTermsVersion);
        expect(createdUser?.termsAgreedAt).toBeInstanceOf(Date);

        // 4. UserInvitation のステータスが ACCEPTED に更新されているか検証
        const updatedInvitation = await prisma.userInvitation.findUnique({
          where: { token },
        });
        expect(updatedInvitation?.status).toBe("ACCEPTED");
      });
    });

    describe("異常系", () => {
      it("利用規約およびプライバシーポリシーに同意していない場合はエラーを返し、Userを作成しないこと", async () => {
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await prisma.userInvitation.create({
          data: {
            email: testEmail,
            token,
            expiresAt,
            status: "PENDING",
          },
        });

        const result = await registerUserViaInvitation({
          token,
          password: validPassword,
          agreedToTerms: false,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("利用規約およびプライバシーポリシーへの同意が必要です。");
        }

        // Userが作成されていないことを検証 (セキュリティアサーション)
        const userCount = await prisma.user.count({ where: { email: testEmail } });
        expect(userCount).toBe(0);
      });

      it("パスワードが短すぎる（8文字未満）場合はエラーを返すこと", async () => {
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await prisma.userInvitation.create({
          data: {
            email: testEmail,
            token,
            expiresAt,
            status: "PENDING",
          },
        });

        const result = await registerUserViaInvitation({
          token,
          password: "short",
          agreedToTerms: true,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("パスワードは8文字以上");
        }

        // Userが作成されていないことを検証 (セキュリティアサーション)
        const userCount = await prisma.user.count({ where: { email: testEmail } });
        expect(userCount).toBe(0);
      });

      it("無効・期限切れのトークンで登録を試みた場合はエラーを返し、Userを作成しないこと", async () => {
        const token = crypto.randomUUID();
        const expiredDate = new Date();
        expiredDate.setHours(expiredDate.getHours() - 1);

        await prisma.userInvitation.create({
          data: {
            email: testEmail,
            token,
            expiresAt: expiredDate,
            status: "PENDING",
          },
        });

        const result = await registerUserViaInvitation({
          token,
          password: validPassword,
          agreedToTerms: true,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("招待リンクの有効期限が切れています。");
        }

        // DBにユーザーが作成されていないこと
        const createdUser = await prisma.user.findUnique({
          where: { email: testEmail },
        });
        expect(createdUser).toBeNull();
      });

      it("既に同メールアドレスのユーザーが存在する場合（重複登録）はエラーを返すこと", async () => {
        // 先に同一メールでUserを作成
        await prisma.user.create({
          data: {
            email: testEmail,
            passwordHash: await hashPassword(validPassword),
            status: "ACTIVE",
          },
        });

        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await prisma.userInvitation.create({
          data: {
            email: testEmail,
            token,
            expiresAt,
            status: "PENDING",
          },
        });

        const result = await registerUserViaInvitation({
          token,
          password: validPassword,
          agreedToTerms: true,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("このメールアドレスは既に登録されています。");
        }
      });
    });
  });

  describe("requestPublicRegistration", () => {
    describe("正常系", () => {
      it("有効な未登録メールアドレスの場合、トークンを発行してDBにPENDING保存し確認メールを送信すること", async () => {
        const result = await requestPublicRegistration(testEmail);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.message).toContain("確認メールを送信しました");
        }

        // 1. DBにPENDING状態のUserInvitationが作成されているか検証
        const invitation = await prisma.userInvitation.findFirst({
          where: { email: testEmail, status: "PENDING" },
        });
        expect(invitation).not.toBeNull();
        expect(invitation?.token).toBeDefined();
        expect(invitation?.expiresAt.getTime()).toBeGreaterThan(Date.now());

        // 2. メール送信サービスが正しいリンクURLを含んで呼ばれたか検証
        expect(sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: testEmail,
            subject: "【Template】アカウント登録のご案内",
            text: expect.stringContaining(`/register?token=${invitation?.token}`),
            html: expect.stringContaining(`/register?token=${invitation?.token}`),
          })
        );
      });

      it("既にPENDING状態の招待レコードが存在する場合、新しいトークンと有効期限で更新してメールを再送すること", async () => {
        const oldToken = crypto.randomUUID();
        const oldExpiresAt = new Date();
        oldExpiresAt.setHours(oldExpiresAt.getHours() + 1);

        await prisma.userInvitation.create({
          data: {
            email: testEmail,
            token: oldToken,
            expiresAt: oldExpiresAt,
            status: "PENDING",
          },
        });

        const result = await requestPublicRegistration(testEmail);

        expect(result.success).toBe(true);

        const invitations = await prisma.userInvitation.findMany({
          where: { email: testEmail },
        });
        expect(invitations.length).toBe(1);
        expect(invitations[0].token).not.toBe(oldToken);
        expect(invitations[0].expiresAt.getTime()).toBeGreaterThan(oldExpiresAt.getTime());

        expect(sendEmail).toHaveBeenCalledTimes(1);
      });

      it("既に登録済みのユーザーが存在する場合、列挙防止のためメール送信を行わずに成功メッセージを返すこと", async () => {
        await prisma.user.create({
          data: {
            email: testEmail,
            passwordHash: await hashPassword(validPassword),
            status: "ACTIVE",
          },
        });

        const result = await requestPublicRegistration(testEmail);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.message).toContain("確認メールを送信しました");
        }

        // メール送信もトークン作成も行われないこと
        expect(sendEmail).not.toHaveBeenCalled();
        const invitationCount = await prisma.userInvitation.count({
          where: { email: testEmail },
        });
        expect(invitationCount).toBe(0);
      });
    });

    describe("異常系", () => {
      it("メールアドレスが無効（空文字または@なし）の場合はエラーを返し、処理を中断すること", async () => {
        const resultEmpty = await requestPublicRegistration("");
        expect(resultEmpty.success).toBe(false);
        if (!resultEmpty.success) {
          expect(resultEmpty.error).toBe("有効なメールアドレスを入力してください。");
        }

        const resultNoAt = await requestPublicRegistration("invalid-email");
        expect(resultNoAt.success).toBe(false);
        if (!resultNoAt.success) {
          expect(resultNoAt.error).toBe("有効なメールアドレスを入力してください。");
        }

        expect(sendEmail).not.toHaveBeenCalled();
      });
    });
  });
});

