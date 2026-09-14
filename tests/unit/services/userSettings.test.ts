import { describe, it, expect, beforeEach } from "vitest";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/hash";
import {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  deleteUserAccount,
} from "@/lib/services/userSettings";

describe("User Settings Service", () => {
  const testEmail = "usersettings-test@example.com";
  const initialPassword = "InitialPassword123!";
  let testUserId: string;

  beforeEach(async () => {
    // クリーンアップ
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // テストユーザーの作成
    const passwordHash = await hashPassword(initialPassword);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        name: "初期ユーザー名",
        status: "ACTIVE",
        termsAgreedVersion: "1.0",
        termsAgreedAt: new Date(),
      },
    });
    testUserId = user.id;
  });

  describe("getUserProfile", () => {
    describe("正常系", () => {
      it("存在するユーザーIDでメールアドレスと表示名を正常に取得できること", async () => {
        const result = await getUserProfile(testUserId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.user.id).toBe(testUserId);
          expect(result.user.email).toBe(testEmail);
          expect(result.user.name).toBe("初期ユーザー名");
        }
      });

      it("表示名が未設定（null）のユーザーの場合、name: null で返ること", async () => {
        await prisma.user.update({
          where: { id: testUserId },
          data: { name: null },
        });

        const result = await getUserProfile(testUserId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.user.email).toBe(testEmail);
          expect(result.user.name).toBeNull();
        }
      });
    });

    describe("異常系", () => {
      it("存在しないユーザーIDを指定した場合はエラーを返すこと", async () => {
        const result = await getUserProfile("non-existent-user-id");

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("ユーザーが見つかりません。");
        }
      });
    });
  });

  describe("updateUserProfile", () => {
    describe("正常系", () => {
      it("有効な表示名を入力してDB上の名前を更新できること", async () => {
        const newName = "新しい表示名";
        const result = await updateUserProfile(testUserId, newName);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.message).toBe("プロフィールを更新しました。");
          expect(result.user.name).toBe(newName);
        }

        const updated = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(updated?.name).toBe(newName);
      });

      it("表示名が境界値（50文字ジャスト）の場合に正常に更新できること", async () => {
        const exact50Name = "あ".repeat(50);
        const result = await updateUserProfile(testUserId, exact50Name);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.user.name).toBe(exact50Name);
        }

        const updated = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(updated?.name).toBe(exact50Name);
      });

      it("絵文字や特殊文字を含む表示名が正常に更新できること", async () => {
        const emojiName = "夏目 漱石 🐱 ✨";
        const result = await updateUserProfile(testUserId, emojiName);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.user.name).toBe(emojiName);
        }

        const updated = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(updated?.name).toBe(emojiName);
      });

      it("表示名に空文字や空白のみを指定した場合、nullとして未設定化できること", async () => {
        const result = await updateUserProfile(testUserId, "   ");

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.user.name).toBeNull();
        }

        const updated = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(updated?.name).toBeNull();
      });
    });

    describe("異常系", () => {
      it("表示名が50文字を超えている場合（51文字・境界値）はエラーを返し、DBを更新しないこと", async () => {
        const over50Name = "あ".repeat(51);
        const result = await updateUserProfile(testUserId, over50Name);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("表示名は50文字以内で入力してください。");
        }

        // DBが更新されていないことを検証
        const user = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(user?.name).toBe("初期ユーザー名");
      });
    });
  });

  describe("updateUserPassword", () => {
    describe("正常系", () => {
      it("正しい現在パスワードと有効な新パスワードでパスワードハッシュが更新されること", async () => {
        const newPassword = "NewSecurePassword456!";
        const result = await updateUserPassword(testUserId, initialPassword, newPassword);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.message).toBe("パスワードを変更しました。");
        }

        // DB上のハッシュが更新され、新パスワードで検証できること
        const updated = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(updated).not.toBeNull();
        const matchesNew = await verifyPassword(newPassword, updated!.passwordHash);
        expect(matchesNew).toBe(true);

        // 旧パスワードでは検証できなくなっていること
        const matchesOld = await verifyPassword(initialPassword, updated!.passwordHash);
        expect(matchesOld).toBe(false);
      });

      it("新パスワードが境界値（8文字ジャスト）の場合に正常に更新できること", async () => {
        const exact8Password = "12345678";
        const result = await updateUserPassword(testUserId, initialPassword, exact8Password);

        expect(result.success).toBe(true);

        const updated = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(await verifyPassword(exact8Password, updated!.passwordHash)).toBe(true);
      });
    });

    describe("異常系", () => {
      it("現在のパスワードが間違っている場合はエラーを返し、ハッシュを更新しないこと", async () => {
        const result = await updateUserPassword(testUserId, "WrongPassword!", "NewPassword123!");

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("現在のパスワードが正しくありません。");
        }

        // 旧パスワードのままであること
        const user = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(await verifyPassword(initialPassword, user!.passwordHash)).toBe(true);
      });

      it("新しいパスワードが8文字未満（7文字・境界値）の場合はエラーを返すこと", async () => {
        const result = await updateUserPassword(testUserId, initialPassword, "1234567");

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("新しいパスワードは8文字以上で入力してください。");
        }

        const user = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(await verifyPassword(initialPassword, user!.passwordHash)).toBe(true);
      });

      it("存在しないユーザーIDの場合はエラーを返すこと", async () => {
        const result = await updateUserPassword("non-existent-user-id", initialPassword, "NewPassword123!");

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("ユーザーが見つかりません。");
        }
      });
    });
  });

  describe("deleteUserAccount", () => {
    describe("正常系", () => {
      it("正しい本人確認パスワードを入力した場合にユーザーがDBから完全に削除されること", async () => {
        const result = await deleteUserAccount(testUserId, initialPassword);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.message).toBe("退会手続きが完了しました。");
        }

        // DB上にユーザーが存在しないこと
        const user = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(user).toBeNull();
      });
    });

    describe("異常系", () => {
      it("本人確認パスワードが一致しない場合はエラーを返し、ユーザーを削除しないこと", async () => {
        const result = await deleteUserAccount(testUserId, "WrongPassword!");

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("パスワードが正しくありません。");
        }

        // ユーザーが削除されていないこと
        const user = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(user).not.toBeNull();
      });

      it("存在しないユーザーIDの場合はエラーを返すこと", async () => {
        const result = await deleteUserAccount("non-existent-user-id", initialPassword);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("ユーザーが見つかりません。");
        }
      });
    });
  });
});
