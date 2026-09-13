---
trigger: always_on
---

<!-- コード設計・アーキテクチャ品質ガイドライン -->

# コード設計・アーキテクチャ品質ルール (Code Architecture Rule)

Next.js (App Router), TypeScript, Prisma, Server Actions のコードを作成・修正・レビューする際は、以下の原則を厳格に遵守すること。
特に、**「過剰なコード（多重チェック、不要な抽象化）」の排除**と**「エラーの握りつぶし（サイレントフェイル）の禁止」**を徹底する。

---

## 1. 責務の局所化と多重チェックの禁止 (Single Responsibility & No Redundant Logic)

各レイヤー（Route / Server Action / ユーティリティ / UI）に明確な責務を1つだけ持たせ、同一の検証を重複して記述しない。

* **権限チェックの一元化**:
  * **画面アクセス制御 (Page / Layout)**: 認証状態の確認とログイン画面へのリダイレクトのみを担当。
  * **データ操作・取得 (Server Action / API)**: 自身のセキュリティ境界（IDOR防止、`where: { userId: session.user.id }`）を自己完結して検証。
  * ❌ **禁止**: Server Action 内で検証しているにもかかわらず、呼び出し元の `page.tsx` やコンポーネント側で二重三重に同じ権限チェックを繰り返すこと。
* **Server Action の戻り値は Discriminated Union（タグ付きUnion型）を強制**:
  * 戻り値は必ず `{ success: true, ... } | { success: false, error: string }` の形式で型定義すること。
  * ❌ **禁止**: `{ success: boolean; data?: T; error?: string }` のように全プロパティをオプショナルにした曖昧な型定義。
  * 呼び出し側（UIコンポーネント）は必ず `if (!res.success)` で分岐し、`res?.error` や `res?.articleId` のようなオプショナルチェイニング（`?.`）を完全排除すること。
* **`useActionState` の初期値（デフォルト値）必須化**:
  * ❌ **禁止**: `useActionState(action, undefined)` のように第2引数に `undefined` や `null` を渡すこと。
  * 必ず `const initialState: ActionResponse = { success: false };` 等の初期状態オブジェクトを渡し、JSX内で `state?.error` や `state?.success` と書く必要を物理的に無くすこと（`state.error` でアクセスする）。
* **UIコンポーネントの責務純化 (Presenter化)**:
  * コンポーネント側でバックエンドの権限ロジックを再実装しない。Server Action の返却結果（`result.success`）に基づいて状態を表示することに専念する。
  * ❌ **禁止: UI内でのオプショナル・フォールバック乱立 (`?.` / `??` / `||`)**:
    * UI側で `viewModel?.stats.addCount ?? 0` や `authorName?.trim() || '筆者不明'` のように存在しないケースを無駄に想定・再計算しない。
    * データの確定（Null Object化、デフォルト補填、文字列整形）はサーバー側（RSC）または ViewModel / アダプター側で完了させ、UIコンポーネントには確定済みの完全なオブジェクトを渡すこと。


---

## 2. Fail-Fast 原則とエラー握りつぶしの禁止 (No Error Swallowing / Fail-Fast)

異常やバグをサイレントに隠蔽せず、不正な状態は早期に明確に失敗（Fail-Fast）させる。

* ❌ **禁止: 安易な `try-catch` による隠蔽**:
  * エラーをキャッチして何もしなかったり、空配列 `[]` や `null` を返して「何事もなかったかのように正常終了を装う」コードを禁止する。
  * 予期せぬ例外が発生した場合は、必ずログ（`console.error`）を残し、原因究明を妨げないこと。
* ❌ **禁止: 勝手なデフォルト値補填（ゾンビデータ化）**:
  * 必須パラメータの欠落や型異常に対して、`value || ''` や `value ?? 0` などのフォールバックを無自覚に乱用し、不完全なデータをシステム内に流し続けることを禁止する。
  * 必須データが存在しない場合は、即座にバリデーションエラーまたは例外として処理を中断する。
* **想定エラーと予期せぬ例外の明確な分離**:
  * **想定内（バリデーション等）**: `{ success: false, error: '具体的なユーザー向けメッセージ' }` を返す。
  * **想定外（DB障害・通信断等）**: 内部の生スタックトレースを露出させず、汎用的な安全メッセージを返しつつ、サーバーログに詳細を出力する。

---

## 3. KISS & YAGNI 原則 (Keep It Simple / You Aren't Gonna Need It)

* **過剰な抽象化の禁止**:
  * 1箇所でしか使われないヘルパー関数、不要なラッパー関数、使われない設定オプションを作らない。
  * 複雑なデザインパターンよりも、誰が読んでも意図が明白な愚直でシンプルな実装を優先する。

---

## 4. 型安全とセキュリティ (Type Safety & IDOR Protection)

* **`any` の全面禁止**:
  * 型が不確実な場合は `unknown` と型ガードを使用するか、Prisma の生成型・定義済みインターフェースを活用する。
* **IDOR（Insecure Direct Object Reference）の防止**:
  * ユーザー所有のデータを更新・削除・取得する際は、必ず `where: { id: targetId, userId: session.user.id }` を指定し、他人のリソースに対する操作を確実に遮断する。

---

## 5. 監査・レビュー
コード設計の品質検証やセルフレビューを行う際は、**`.agents/skills/code-design-audit/SKILL.md`** のチェックリストに従うこと。