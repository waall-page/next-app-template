/**
 * 必須の環境変数を取得します。
 * 環境変数が定義されていない（または空文字列の）場合、デフォルト補完は行わず明示的なエラーを発生させます。
 *
 * @param key 環境変数名
 * @returns 環境変数の値
 * @throws Error 環境変数が未設定の場合
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[Env Error] 必須の環境変数 "${key}" が設定されていません。.env ファイルまたは環境変数を確認してください。`
    );
  }
  return value;
}
