import crypto from "crypto";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { getLatestTermsVersion } from "@/lib/legal";
import { sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/url";

export type RequestPublicRegistrationResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export type VerifyTokenResult =
  | {
      valid: true;
      invitation: {
        id: string;
        email: string;
        token: string;
        expiresAt: Date;
        status: string;
      };
    }
  | {
      valid: false;
      error: string;
    };

export interface RegisterUserParams {
  token: string;
  password: string;
  agreedToTerms: boolean;
}

export type RegisterUserResult =
  | {
      success: true;
      message: string;
      user: {
        id: string;
        email: string;
        status: string;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * 招待トークンの有効性を検証するサービス関数
 */
export async function verifyInvitationToken(token: string): Promise<VerifyTokenResult> {
  if (!token) {
    return { valid: false, error: "招待リンクが無効または存在しません。" };
  }

  const invitation = await prisma.userInvitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return { valid: false, error: "招待リンクが無効または存在しません。" };
  }

  if (invitation.status === "CANCELED") {
    return { valid: false, error: "この招待は取り消されています。" };
  }

  if (invitation.status === "ACCEPTED") {
    return { valid: false, error: "この招待リンクは既に登録手続きに使用されています。" };
  }

  if (invitation.expiresAt < new Date()) {
    return { valid: false, error: "招待リンクの有効期限が切れています。" };
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
  if (!verifyResult.valid) {
    return {
      success: false,
      error: verifyResult.error,
    };
  }

  // 2. 利用規約・プライバシーポリシー同意の検証
  if (!agreedToTerms) {
    return {
      success: false,
      error: "利用規約およびプライバシーポリシーへの同意が必要です。",
    };
  }

  // 3. パスワードの入力値バリデーション (8文字以上)
  if (!password || password.length < 8) {
    return {
      success: false,
      error: "パスワードは8文字以上で入力してください。",
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
      error: "このメールアドレスは既に登録されています。",
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

/**
 * 自由登録の確認メール送信サービス関数
 */
export async function requestPublicRegistration(
  email: string
): Promise<RequestPublicRegistrationResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return {
      success: false,
      error: "有効なメールアドレスを入力してください。",
    };
  }

  // 1. 既存アカウント確認 (アカウント列挙防止: 成功メッセージを返すがメールは送らない)
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return {
      success: true,
      message: "確認メールを送信しました。メールに記載されたリンクから登録を完了してください。",
    };
  }

  // 2. トークン生成および有効期限設定 (24時間)
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // 既存のPENDINGな招待/トークンがあれば更新、なければ新規作成
  const existingInvitation = await prisma.userInvitation.findFirst({
    where: { email: normalizedEmail, status: "PENDING" },
  });

  if (existingInvitation) {
    await prisma.userInvitation.update({
      where: { id: existingInvitation.id },
      data: { token, expiresAt },
    });
  } else {
    await prisma.userInvitation.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
        status: "PENDING",
      },
    });
  }

  // 3. メール送信
  const baseUrl = getBaseUrl();
  const registrationUrl = `${baseUrl}/register?token=${token}`;

  await sendEmail({
    to: normalizedEmail,
    subject: "【Template】アカウント登録のご案内",
    text: `サービスへの登録ありがとうございます。\n\n以下のリンクをクリックして、パスワードの設定および利用規約への同意を行ってアカウント登録を完了してください。\n\n${registrationUrl}\n\n※このリンクの有効期限は24時間です。`,
    html: `<p>サービスへの登録ありがとうございます。</p><p>以下のリンクをクリックして、パスワードの設定および利用規約への同意を行ってアカウント登録を完了してください。</p><p><a href="${registrationUrl}">${registrationUrl}</a></p><p><small>※このリンクの有効期限は24時間です。</small></p>`,
  });

  return {
    success: true,
    message: "確認メールを送信しました。メールに記載されたリンクから登録を完了してください。",
  };
}

