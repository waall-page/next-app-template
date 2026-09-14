import prisma from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/hash";

export type GetUserProfileResult =
  | {
      success: true;
      user: {
        id: string;
        email: string;
        name: string | null;
      };
    }
  | {
      success: false;
      error: string;
    };

export type UpdateUserProfileResult =
  | {
      success: true;
      message: string;
      user: {
        id: string;
        name: string | null;
      };
    }
  | {
      success: false;
      error: string;
    };

export type UpdateUserPasswordResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export type DeleteUserAccountResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

/**
 * ユーザーの基本プロフィール（メール・表示名）を取得するサービス関数
 */
export async function getUserProfile(userId: string): Promise<GetUserProfileResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return { success: false, error: "ユーザーが見つかりません。" };
  }

  return {
    success: true,
    user,
  };
}

/**
 * ユーザーの表示名を更新するサービス関数
 */
export async function updateUserProfile(
  userId: string,
  name: string | null
): Promise<UpdateUserProfileResult> {
  const trimmedName = typeof name === "string" ? name.trim() : "";

  if (trimmedName.length > 50) {
    return { success: false, error: "表示名は50文字以内で入力してください。" };
  }

  const normalizedName = trimmedName.length > 0 ? trimmedName : null;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name: normalizedName },
    select: { id: true, name: true },
  });

  return {
    success: true,
    message: "プロフィールを更新しました。",
    user: updatedUser,
  };
}

/**
 * ユーザーのパスワードを変更するサービス関数
 */
export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<UpdateUserPasswordResult> {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "新しいパスワードは8文字以上で入力してください。" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return { success: false, error: "ユーザーが見つかりません。" };
  }

  const isValidCurrent = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValidCurrent) {
    return { success: false, error: "現在のパスワードが正しくありません。" };
  }

  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return {
    success: true,
    message: "パスワードを変更しました。",
  };
}

/**
 * ユーザーアカウントを退会（削除）するサービス関数
 */
export async function deleteUserAccount(
  userId: string,
  password: string
): Promise<DeleteUserAccountResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return { success: false, error: "ユーザーが見つかりません。" };
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return { success: false, error: "パスワードが正しくありません。" };
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return {
    success: true,
    message: "退会手続きが完了しました。",
  };
}
