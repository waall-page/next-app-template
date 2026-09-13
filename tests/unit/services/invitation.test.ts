import { describe, it, expect, beforeEach, vi } from "vitest";
import prisma from "@/lib/prisma";
import { inviteUser, resendInvitation, cancelInvitation } from "@/lib/services/invitation";
import { sendEmail } from "@/lib/email";

// メール送信ユーティリティをモック化（実コンテナへのTCP通信を遮断）
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ messageId: "mock-invitation-email-id" }),
}));

describe("User Invitation Service", () => {
  const testEmail = "test-invitee@example.com";

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.APP_URL = "http://test.local";

    // DBクリーンアップ
    await prisma.userInvitation.deleteMany({ where: { email: testEmail } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  describe("inviteUser", () => {
    describe("正常系", () => {
      it("新規メールアドレスに対して招待を作成し、メールを送信できること", async () => {
        const result = await inviteUser(testEmail);

        expect(result.success).toBe(true);
        expect(result.invitation).toBeDefined();
        expect(result.invitation?.email).toBe(testEmail);
        expect(result.invitation?.token).toBeDefined();

        // sendEmail が正しい宛先と内容で呼び出されたことを検証
        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: testEmail,
            subject: "【Template】アカウント招待のご案内",
            text: expect.stringContaining(`http://test.local/invite/setup?token=${result.invitation!.token}`),
            html: expect.stringContaining(`http://test.local/invite/setup?token=${result.invitation!.token}`),
          })
        );

        // DB状態の確認
        const invitation = await prisma.userInvitation.findUnique({
          where: { token: result.invitation!.token },
        });
        expect(invitation).not.toBeNull();
        expect(invitation?.status).toBe("PENDING");
      });
    });

    describe("異常系", () => {
      it("無効なメールアドレスの場合はエラーを返すこと", async () => {
        const result = await inviteUser("invalid-email");

        expect(result.success).toBe(false);
        expect(result.message).toContain("有効なメールアドレス");
        expect(sendEmail).not.toHaveBeenCalled();
      });

      it("既に登録済みのユーザーメールアドレスの場合はエラーを返すこと", async () => {
        await prisma.user.create({
          data: {
            email: testEmail,
            passwordHash: "hashedpassword",
            status: "ACTIVE",
          },
        });

        const result = await inviteUser(testEmail);

        expect(result.success).toBe(false);
        expect(result.message).toBe("指定されたメールアドレスは既に登録されています。");
        expect(sendEmail).not.toHaveBeenCalled();
      });

      it("既に有効な招待が存在する場合はエラーを返すこと", async () => {
        await inviteUser(testEmail);
        vi.mocked(sendEmail).mockClear();

        const result = await inviteUser(testEmail);

        expect(result.success).toBe(false);
        expect(result.message).toBe("指定されたメールアドレス宛に既に有効な招待が送信されています。");
        expect(sendEmail).not.toHaveBeenCalled();
      });
    });
  });

  describe("resendInvitation", () => {
    describe("正常系", () => {
      it("PENDING状態の招待の有効期限を更新して再送信できること", async () => {
        const initial = await inviteUser(testEmail);
        const invitationId = initial.invitation!.id;
        vi.mocked(sendEmail).mockClear();

        // 1秒待つ代わりに、既存招待データの expiresAt を1秒前に設定
        const updatedInitial = await prisma.userInvitation.update({
          where: { id: invitationId },
          data: { expiresAt: new Date(Date.now() - 1000) },
        });

        const resendResult = await resendInvitation(invitationId);

        expect(resendResult.success).toBe(true);
        expect(resendResult.invitation?.expiresAt.getTime()).toBeGreaterThan(
          updatedInitial.expiresAt.getTime()
        );

        // 再送信メールが送信されたことを検証
        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: testEmail,
            subject: "【再送】【Template】アカウント招待のご案内",
            text: expect.stringContaining(`http://test.local/invite/setup?token=${initial.invitation!.token}`),
            html: expect.stringContaining(`http://test.local/invite/setup?token=${initial.invitation!.token}`),
          })
        );
      });
    });
  });

  describe("cancelInvitation", () => {
    describe("正常系", () => {
      it("招待を取り消すことができること (status: CANCELED)", async () => {
        const initial = await inviteUser(testEmail);
        const invitationId = initial.invitation!.id;
        vi.mocked(sendEmail).mockClear();

        const cancelResult = await cancelInvitation(invitationId);

        expect(cancelResult.success).toBe(true);

        const updated = await prisma.userInvitation.findUnique({
          where: { id: invitationId },
        });
        expect(updated?.status).toBe("CANCELED");
        // キャンセル処理ではメール送信されないこと
        expect(sendEmail).not.toHaveBeenCalled();
      });
    });
  });
});
