---
name: nextjs-unit-testing
description: Next.js (Server Actions / API) や Vitest を使用した単体テスト（Unit Test / *.test.ts）を作成・修正・レビュー・リファクタリングする際に【必ず】ロードして全ルールを適用すること。
---

# Next.js & Vitest 単体テスト作成ルール

Next.js の Server Actions やバックエンド処理の単体テスト（Unit Test）を作成・修正・レビューする際は、以下の原則を厳格に遵守すること。

## 1. ファイル配置と命名規則
- **単体テスト (Vitest)**: `tests/unit/**/*.test.ts`
- **E2Eテスト (Playwright)**: `tests/e2e/**/*.spec.ts`

## 2. テストの構造化（グループ化）
- 番号（連番）によるナンバリングは避け、`describe('正常系', ...)` と `describe('異常系', ...)` のネストされた `describe` ブロックで階層化・可読性を担保すること。

```typescript
describe('MyServerAction Server Action', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('正常系', () => {
        it('〜であること', async () => { ... });
    });

    describe('異常系', () => {
        it('〜の場合はエラーになること', async () => { ... });
    });
});
```

## 3. モック（Mock）と型アサーション
- **`as any` の使用禁止**: ESLint の `@typescript-eslint/no-explicit-any` ルール違反となるため、`as unknown as TargetType`（二重アサーション）を使用すること。
- **NextAuth `auth` のモック**: オーバーロード解消のため `vi.mocked(auth as () => Promise<Session | null>)` と明確に型を指定すること。
- **テストの独立性**: 各テスト間の相互干渉を防ぐため、必ず `beforeEach(() => { vi.clearAllMocks(); });` を実行すること。

## 4. アサーション（検証）ルール
- **プリミティブ型の比較**: `boolean` や `string` の比較には `.toEqual()` ではなく **`.toBe()`** を使用すること。
- **成功レスポンスの検証**: `expect(result.success).toBe(true)`
- **失敗レスポンスの検証**:
  - `expect(result.success).toBe(false)`
  - `expect(result.error).toBe('エラーメッセージ')`
- **副作用の否定検証（セキュリティ）**:
  - 異常系テストでは、不正な DB 操作が実行されていないこと（`expect(prisma.$transaction).not.toHaveBeenCalled()` など）を必要に応じて検証すること。

## 5. テスト用URL・ドメインの指定ルール
- **テスト専用ドメインの利用**: 単体テスト内でダミーのURL（NextRequestのURLやメール本文内のリンク等）を定義する場合は、稼働中の開発サーバーへの誤アクセスや副作用を防ぐため、`localhost:3000` ではなく `http://test.local/...` や `https://example.com/...` などのテスト専用ドメインを使用すること。

## 6. 重複テストの防止と責務分離 (Test Deduplication & Separation of Concerns)
- **重複検査の必須化**: テストコードの作成・修正時は、既存の単体テスト（`tests/unit/**/*.test.ts`）およびE2Eテスト（`tests/e2e/**/*.spec.ts`）と重複した検証が存在しないか機械的に検査すること。
- **テストピラミッドの役割分担**:
  - **単体テスト (Vitest)**: ロジックの入出力、エラー種別マッピング、例外再スロー、境界値、型ガードなど内部ロジックをミリ秒単位で徹底網羅する。
  - **E2Eテスト (Playwright)**: 実際のブラウザでページを開き、Cookie・セッションが正しく発行され、ユーザー操作に従って画面遷移とDOM描画が行われる結合フローを検証する。
- **重複のアンチパターン**:
  - ❌ **禁止**: 単体テスト内でE2Eと全く同じ画面遷移やブラウザ挙動をモックで長大に再現すること。
  - ❌ **禁止**: 既に別のアクションテストやサービス単体テストで検証済みの共通ロジックを、呼び出し元テストで全く同じように二重にテストすること。

## 7. リファクタリング耐性（実装詳細への結合禁止）
- **内部実装モックの最小化**:
  - ❌ **禁止**: Action の単体テスト内で `prisma.user.findUnique` や内部ヘルパー関数の呼び出し順序・引数を過剰にモック・監視すること。内部実装をリファクタリングするたびにテストが壊れる原因（脆いテスト）となる。
- **振る舞い（Behavior）の検証**:
  - 単体テストは「入力（引数・FormData）」に対する「最終的な出力（戻り値・型・エラーメッセージ）」および「外部副作用（Service委譲・DB状態）」を検証し、内部のコード構造の変更に耐えられるように設計すること。
  - 詳細なリファクタリング手順は `.agents/rules/refactoring-guide.md` および `.agents/skills/safe-refactoring/SKILL.md` を参照すること。



