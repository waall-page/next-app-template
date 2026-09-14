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

/**
 * 自由登録（一般ユーザー登録）が有効かどうかを取得します。
 * デフォルト: true（ENABLE_PUBLIC_REGISTRATION="false" の場合のみ無効）
 */
export function isPublicRegistrationEnabled(): boolean {
  return process.env.ENABLE_PUBLIC_REGISTRATION !== "false";
}

/**
 * 招待制機能が有効かどうかを取得します。
 * デフォルト: false（ENABLE_INVITATION="true" の場合のみ有効）
 */
export function isInvitationEnabled(): boolean {
  return process.env.ENABLE_INVITATION === "true";
}

