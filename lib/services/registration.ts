import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { getLatestTermsVersion } from "@/lib/legal";

export interface VerifyTokenResult {
  valid: boolean;
  message?: string;
  invitation?: {
    id: string;
    email: string;
    token: string;
    expiresAt: Date;
    status: string;
  };
}

export interface RegisterUserParams {
  token: string;
  password: string;
  agreedToTerms: boolean;
}

export interface RegisterUserResult {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    status: string;
  };
}

/**
 * 招待トークンの有効性を検証するサービス関数
 */
export async function verifyInvitationToken(token: string): Promise<VerifyTokenResult> {
  if (!token) {
    return { valid: false, message: "招待リンクが無効または存在しません。" };
  }

  const invitation = await prisma.userInvitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return { valid: false, message: "招待リンクが無効または存在しません。" };
  }

  if (invitation.status === "CANCELED") {
    return { valid: false, message: "この招待は取り消されています。" };
  }

  if (invitation.status === "ACCEPTED") {
    return { valid: false, message: "この招待リンクは既に登録手続きに使用されています。" };
  }

  if (invitation.expiresAt < new Date()) {
    return { valid: false, message: "招待リンクの有効期限が切れています。" };
  }

  return {
    valid: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      status: invitation.status,
    },
  };
}

/**
 * 招待トークン経由でのユーザー登録処理を行うサービス関数
 */
export async function registerUserViaInvitation({
  token,
  password,
  agreedToTerms,
}: RegisterUserParams): Promise<RegisterUserResult> {
  // 1. トークンの検証
  const verifyResult = await verifyInvitationToken(token);
  if (!verifyResult.valid || !verifyResult.invitation) {
    return {
      success: false,
      message: verifyResult.message || "無効な招待リンクです。",
    };
  }

  // 2. 利用規約・プライバシーポリシー同意の検証
  if (!agreedToTerms) {
    return {
      success: false,
      message: "利用規約およびプライバシーポリシーへの同意が必要です。",
    };
  }

  // 3. パスワードの入力値バリデーション (8文字以上)
  if (!password || password.length < 8) {
    return {
      success: false,
      message: "パスワードは8文字以上で入力してください。",
    };
  }

  const email = verifyResult.invitation.email;

  // 4. 重複ユーザーチェック
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      success: false,
      message: "このメールアドレスは既に登録されています。",
    };
  }

  // 5. トランザクション処理 (Userの作成 & 招待ステータスの更新)
  const passwordHash = await hashPassword(password);
  const termsAgreedVersion = await getLatestTermsVersion();
  const termsAgreedAt = new Date();

  const [newUser] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email,
        passwordHash,
        status: "ACTIVE",
        termsAgreedVersion,
        termsAgreedAt,
      },
    }),
    prisma.userInvitation.update({
      where: { id: verifyResult.invitation.id },
      data: { status: "ACCEPTED" },
    }),
  ]);

  return {
    success: true,
    message: "アカウントの登録が完了しました。",
    user: {
      id: newUser.id,
      email: newUser.email,
      status: newUser.status,
    },
  };
}
