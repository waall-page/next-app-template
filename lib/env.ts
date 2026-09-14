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

export type RegistrationMode = "public" | "invitation" | "disabled";

/**
 * システムのユーザー登録モードを取得します（排他2者択一設定）。
 * - "public": 自由登録制（確認メール先行型、デフォルト）
 * - "invitation": 招待制（管理者招待のみ）
 * - "disabled": 新規受付停止
 */
export function getRegistrationMode(): RegistrationMode {
  const mode = process.env.REGISTRATION_MODE || process.env.AUTH_REGISTRATION_MODE;
  if (mode === "invitation") return "invitation";
  if (mode === "disabled") return "disabled";
  if (mode === "public") return "public";

  // 後方互換性チェック
  if (process.env.ENABLE_INVITATION === "true" && process.env.ENABLE_PUBLIC_REGISTRATION === "false") {
    return "invitation";
  }

  return "public";
}

/**
 * 自由登録（一般ユーザー登録）が有効かどうかを取得します。
 */
export function isPublicRegistrationEnabled(): boolean {
  return getRegistrationMode() === "public";
}

/**
 * 招待制機能が有効かどうかを取得します。
 */
export function isInvitationEnabled(): boolean {
  return getRegistrationMode() === "invitation";
}


