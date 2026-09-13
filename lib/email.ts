import nodemailer from "nodemailer";
import { requireEnv } from "@/lib/env";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * メール送信ユーティリティ
 * 必須環境変数が設定されていない場合はデフォルト補完を行わずエラーをスローします。
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
}: SendEmailOptions) {
  const host = requireEnv("SMTP_HOST");
  const portStr = requireEnv("SMTP_PORT");
  const defaultFrom = requireEnv("SMTP_FROM");

  const port = parseInt(portStr, 10);
  if (isNaN(port)) {
    throw new Error(
      `[Env Error] SMTP_PORT ("${portStr}") が有効な数値ではありません。`
    );
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secureEnv = process.env.SMTP_SECURE;

  // SMTP_SECURE が指定されている場合はそのブール値、未指定かつポート465の場合は自動でtrue
  const isSecure = secureEnv !== undefined ? secureEnv === "true" : port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });

  return await transporter.sendMail({
    from: from || defaultFrom,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ""), // テキストが省略された場合はHTMLから簡易抽出
  });
}
