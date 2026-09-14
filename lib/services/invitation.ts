import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/url";

export type InviteUserResult =
  | {
      success: true;
      message: string;
      invitation: {
        id: string;
        email: string;
        token: string;
        expiresAt: Date;
      };
    }
  | {
      success: false;
      error: string;
    };

export type CancelInvitationResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

/**
 * ユーザー招待の有効期限 (24時間)
 */
const INVITATION_EXPIRY_HOURS = 24;

/**
 * 新規ユーザーを招待するサービス関数
 */
export async function inviteUser(email: string): Promise<InviteUserResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { success: false, error: "有効なメールアドレスを入力してください。" };
  }

  // 1. 既存ユーザーチェック
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return { success: false, error: "指定されたメールアドレスは既に登録されています。" };
  }

  // 2. 既に有効なPENDING状態の招待が存在するかチェック
  const existingPendingInvitation = await prisma.userInvitation.findFirst({
    where: {
      email: normalizedEmail,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });

  if (existingPendingInvitation) {
    return {
      success: false,
      error: "指定されたメールアドレス宛に既に有効な招待が送信されています。",
    };
  }

  // 3. トークン生成および有効期限設定 (24時間)
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + INVITATION_EXPIRY_HOURS);

  // 4. UserInvitation DBレコード作成
  const invitation = await prisma.userInvitation.create({
    data: {
      email: normalizedEmail,
      token,
      expiresAt,
      status: "PENDING",
    },
  });

  // 5. 招待メールの送信
  const baseUrl = getBaseUrl();
  const inviteUrl = `${baseUrl}/register?token=${token}`;

  await sendEmail({
    to: normalizedEmail,
    subject: "【Template】アカウント招待のご案内",
    text: `
アカウント招待のお知らせ

Template への招待が届いています。
以下のURLにアクセスして、アカウントの初期パスワード設定を行ってください。

登録用URL: ${inviteUrl}

※このリンクの有効期限は24時間（${expiresAt.toLocaleString("ja-JP")} まで）です。
※お心当たりのない場合は、このメールを破棄してください。
`.trim(),
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2>アカウント招待のお知らせ</h2>
        <p>Template への招待が届いています。</p>
        <p>以下のリンクをクリックして、アカウントの初期パスワード設定を行ってください。</p>
        <p style="margin: 24px 0;">
          <a href="${inviteUrl}" style="background-color: #4a90e2; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">アカウント登録へ進む</a>
        </p>
        <p style="font-size: 12px; color: #666;">
          ※このリンクの有効期限は24時間（${expiresAt.toLocaleString("ja-JP")} まで）です。<br/>
          ※お心当たりのない場合は、このメールを破棄してください。
        </p>
      </div>
    `,
  });

  return {
    success: true,
    message: "招待メールを正常に送信しました。",
    invitation: {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
    },
  };
}

/**
 * 招待の再送信
 */
export async function resendInvitation(invitationId: string): Promise<InviteUserResult> {
  const invitation = await prisma.userInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation || invitation.status !== "PENDING") {
    return { success: false, error: "再送信可能な招待が見つかりません。" };
  }

  // 有効期限を現在から24時間後に更新
  const newExpiresAt = new Date();
  newExpiresAt.setHours(newExpiresAt.getHours() + INVITATION_EXPIRY_HOURS);

  const updatedInvitation = await prisma.userInvitation.update({
    where: { id: invitationId },
    data: { expiresAt: newExpiresAt },
  });

  const baseUrl = getBaseUrl();
  const inviteUrl = `${baseUrl}/register?token=${updatedInvitation.token}`;

  await sendEmail({
    to: updatedInvitation.email,
    subject: "【再送】【Template】アカウント招待のご案内",
    text: `
アカウント招待のお知らせ（再送）

Template への招待の案内を再送いたします。
以下のURLにアクセスして、アカウントの初期パスワード設定を行ってください。

登録用URL: ${inviteUrl}

※このリンクの有効期限は24時間（${newExpiresAt.toLocaleString("ja-JP")} まで）です。
`.trim(),
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2>アカウント招待のお知らせ（再送）</h2>
        <p>Template への招待の案内を再送いたします。</p>
        <p>以下のリンクをクリックして、アカウントの初期パスワード設定を行ってください。</p>
        <p style="margin: 24px 0;">
          <a href="${inviteUrl}" style="background-color: #4a90e2; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">アカウント登録へ進む</a>
        </p>
        <p style="font-size: 12px; color: #666;">
          ※このリンクの有効期限は24時間（${newExpiresAt.toLocaleString("ja-JP")} まで）です。
        </p>
      </div>
    `,
  });

  return {
    success: true,
    message: "招待メールを再送信しました。",
    invitation: {
      id: updatedInvitation.id,
      email: updatedInvitation.email,
      token: updatedInvitation.token,
      expiresAt: updatedInvitation.expiresAt,
    },
  };
}

/**
 * 招待の取り消し
 */
export async function cancelInvitation(invitationId: string): Promise<CancelInvitationResult> {
  const invitation = await prisma.userInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    return { success: false, error: "対象の招待が見つかりません。" };
  }

  await prisma.userInvitation.update({
    where: { id: invitationId },
    data: { status: "CANCELED" },
  });

  return { success: true, message: "招待を取り消しました。" };
}
