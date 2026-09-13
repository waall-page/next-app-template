/**
 * アプリケーションのベースURLを取得します。
 *
 * 解決優先順位:
 * 1. process.env.APP_URL (明示的な設定: 例 "https://template.vercel.app" または "http://localhost:3000")
 * 2. process.env.VERCEL_URL (Vercel デプロイドメイン: 例 "xxx.vercel.app" -> "https://xxx.vercel.app")
 *
 * いずれも未設定の場合はエラーをスローします。
 */
export function getBaseUrl(): string {
  let url = process.env.APP_URL;

  if (!url || url.trim() === "") {
    if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim() !== "") {
      const vercelUrl = process.env.VERCEL_URL.trim();
      url = vercelUrl.startsWith("http://") || vercelUrl.startsWith("https://")
        ? vercelUrl
        : `https://${vercelUrl}`;
    }
  }

  if (!url || url.trim() === "") {
    throw new Error(
      "[Env Error] APP_URL (または VERCEL_URL) が設定されていません。.env ファイルまたはホスティング環境の設定を確認してください。"
    );
  }

  return url.trim().replace(/\/+$/, "");
}
