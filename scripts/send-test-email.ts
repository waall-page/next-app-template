import "dotenv/config";
import { sendEmail } from "@/lib/email";
import { requireEnv } from "@/lib/env";

async function main() {
  // 環境変数が正しく設定されているかを厳格に検証
  const host = requireEnv("SMTP_HOST");
  const port = requireEnv("SMTP_PORT");
  const from = requireEnv("SMTP_FROM");
  const user = process.env.SMTP_USER;
  const secure = process.env.SMTP_SECURE;

  // 引数で宛先メールアドレスが指定された場合はそれを使用、なければデフォルト
  const targetEmail = process.argv[2] || "test-user@example.com";
  const now = new Date().toLocaleString("ja-JP");
  const targetUrl = "https://github.com";

  console.log("========================================");
  console.log("📧 メール送信テスト");
  console.log("========================================");
  console.log(`- SMTP ホスト: ${host}:${port}`);
  console.log(`- 暗号化 (Secure): ${secure !== undefined ? secure : (port === "465" ? "true (auto)" : "false (auto)")}`);
  console.log(`- 認証ユーザー: ${user ? user : "(認証なし)"}`);
  console.log(`- 送信元 (From): ${from}`);
  console.log(`- 宛先 (To): ${targetEmail}`);
  console.log("送信処理を実行中...");

  const info = await sendEmail({
    to: targetEmail,
    subject: `【テストメール】メール送信テスト (${now})`,
    text: `テストメール (${now})
----------------------------------------
このメールは npm run mail:send-test コマンドにより送信されたテストメールです。

以下のリンクから GitHub を開くことができます:
${targetUrl}
`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">
        <h2>テストメール</h2>
        <p>このメールは <code>npm run mail:send-test</code> コマンドにより送信されたテストメールです。</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p>以下のボタンをクリックして GitHub を開くことができます：</p>
        <p>
          <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #24292e; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            GitHub を開く
          </a>
        </p>
        <p style="font-size: 12px; color: #888;">URL: ${targetUrl}</p>
      </div>
    `,
  });

  console.log("----------------------------------------");
  console.log("✅ 送信成功!");
  console.log(`- Message ID: ${info.messageId}`);
  if (host === "localhost" || host === "127.0.0.1") {
    console.log("- Mailpit Web UI で確認: http://localhost:8025");
  } else {
    console.log(`- ${targetEmail} の受信ボックスを確認してください。`);
  }
  console.log("========================================");
}

main().catch((err) => {
  console.error("----------------------------------------");
  console.error("❌ 送信失敗:", err);
  console.error("========================================");
  process.exit(1);
});
