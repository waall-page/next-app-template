---
name: code-design-audit
description: コード設計品質、過剰な権限チェックやエラー握りつぶしの排除、レイヤリング責務を体系的に監査・レビュー・リファクタリングするためのスキル。
---

# コード設計品質 & 過剰コード排除 監査スキル (Code Design Audit)

本スキルは、Next.js 15 / TypeScript / Server Actions のコードベースにおいて、**「過剰なコードの排除」**および**「堅牢でシンプルな設計品質」**を体系的に監査・レビュー・リファクタリングするための手順書です。
特にAI駆動開発において発生しやすい「過剰な防御的コード」「エラーの隠蔽」を機械的・客観的に検出します。

---

## 1. 監査チェックリスト (Audit Checklist)

コード作成時・PRレビュー時・リファクタリング時は、以下の各問に対して「Yes」であることを確認する。

### ① 多重・重複チェックの排除 (No Redundant Checks)
- [ ] **Q1-1**: 同じ認証・認可チェックが、Page/Layout と Server Action の両方で重複して書かれていないか？
- [ ] **Q1-2**: UIコンポーネントが、Server Action の返却値（`result.error`）で十分な箇所に独自の権限ガードを無駄に重ねていないか？
- [ ] **Q1-3**: 権限の責任境界（ルーティング保護 vs データ操作の所有権保護）が1箇所に局所化されているか？

### ② Fail-Fast とエラー握りつぶしの排除 (Fail-Fast & No Swallowing)
- [ ] **Q2-1**: `catch (err) { return []; }` や `catch { return null; }` のように、エラー原因をログにも残さず正常系として装う「サイレントフェイル」が存在しないか？
- [ ] **Q2-2**: 必須パラメータや想定外の空値に対して、`value || ''` や `?? 0` で勝手にデフォルト値を補填してバグを潜在化させていないか？
- [ ] **Q2-3**: 想定されるバリデーションエラーと、予期せぬシステム例外が適切に区別されているか？

### ③ KISS & YAGNI 原則（過剰な抽象化の排除） (Keep It Simple)
- [ ] **Q3-1**: 1箇所でしか呼ばれない不要なラッパー関数や中間ヘルパー関数を作っていないか？
- [ ] **Q3-2**: 将来の拡張を理由にした「今使わない過剰なオプション引数や設定オブジェクト」が存在しないか？
- [ ] **Q3-3**: コードが誰にとっても直感的で、過度なデザインパターンを避けているか？

### ④ レイヤリングと単一責任 (Separation of Concerns)
- [ ] **Q4-1**: `lib/*` には、DB接続やフレームワークに依存しない純粋関数（単体テスト容易なロジック）が集約されているか？
- [ ] **Q4-2**: `app/actions/*` は、トランザクション、入力検証、認可チェック、データ取得・更新のオーケストレーションに専念しているか？
- [ ] **Q4-3**: `components/*` は、UIの描画とユーザーイベントの受け付けに専念し、ビジネスロジックを抱え込んでいないか？
- [ ] **Q4-4**: UIコンポーネント（`*.tsx`）内に `?.` や `??` が散乱していないか？（サーバー/ViewModel側で確定させ、UIは確定値を受け取るPresenterに徹しているか？）

### ⑤ セキュリティと型安全 (Security & Type Safety)
- [ ] **Q5-1**: `any` 型が一切使用されていないか？（`unknown` + 型ガードの活用）
- [ ] **Q5-2**: 他人のデータに対する不正操作（IDOR脆弱性）が `userId: session.user.id` の絞り込みによって確実に排除されているか？
- [ ] **Q5-3**: Server Action の戻り値は Discriminated Union（`{ success: true, ... } | { success: false, error: string }`）として定義されているか？
- [ ] **Q5-4**: `useActionState` に `undefined` ではなく適切な初期状態オブジェクト（`{ success: false }` 等）が渡されているか？

### ⑥ テスト品質と重複排除 (Test Quality & Deduplication)
- [ ] **Q6-1**: 新規作成・修正した単体テストが、既存の単体テストやE2Eテストと無駄に重複していないか？（`.agents/skills/unit-testing/SKILL.md` 準拠）
- [ ] **Q6-2**: 単体テスト（ロジック・境界値・例外の高速網羅）と E2Eテスト（画面結合フロー）のテストピラミッド責務が明確に分離されているか？
- [ ] **Q6-3**: 偽陽性（実装が壊れてもテストが通る）や Flaky リスクが排除され、決定論的に検証できているか？

---


## 2. Good / Bad 実装対比カタログ (Anti-Patterns vs Best Practices)

### パターン 1: 過剰な多重権限チェック

#### ❌ Bad (過剰コード):
```typescript
// app/(app)/dashboard/page.tsx
export default async function Page() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'user') redirect('/login'); // 重複！

  // Server Action 側でも全く同じチェックをしている
  const data = await getDashboardData(); 
  ...
}

// app/actions/dashboard.ts
export async function getDashboardData() {
  const session = await auth();
  if (!session || session.user.role !== 'user') { // 二重チェック！
    return { success: false, error: 'Unauthorized' };
  }
  ...
}
```

#### ⭕ Good (責務の局所化):
```typescript
// app/(app)/dashboard/page.tsx (画面保護は Layout または requireAuth に任せる)
export default async function Page() {
  await requireAuth(); // 未ログインならリダイレクト（責務: 画面保護）
  const data = await getDashboardData();
  ...
}

// app/actions/dashboard.ts (Action はデータ所有権に専念)
export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  // ユーザー所有のデータのみ取得（IDOR防止）
  const articles = await prisma.article.findMany({
    where: { userId: session.user.id },
  });
  return { success: true, data: articles };
}
```

---

### パターン 2: エラーの握りつぶし・勝手なデフォルト補完

#### ❌ Bad (サイレントフェイル & ゾンビデータ):
```typescript
export async function calculateStats(input: any) {
  try {
    // 必須値がないのに勝手に 0 や空文字で補填して処理を強行
    const count = input.count ?? 0;
    const text = input.text || '';
    return doComplexMath(count, text);
  } catch (err) {
    // 例外を完全に握りつぶして空配列を返す（バグの原因が究明不能に！）
    return [];
  }
}
```

#### ⭕ Good (Fail-Fast & 明示的なエラーハンドリング):
```typescript
export function calculateStats(input: StatsInput): StatsResult {
  // 必須チェック（不正な値は早期に明確に失敗させる）
  if (typeof input.count !== 'number' || input.count < 0) {
    throw new Error(`Invalid count value: ${input.count}`);
  }
  if (!input.text) {
    throw new Error('text is required for calculating stats');
  }

  return doComplexMath(input.count, input.text);
}
```

### パターン 4: Server Action の戻り値と useActionState の初期値

#### ❌ Bad (非Union型 ＆ 初期値undefinedによるオプショナル地獄):
```typescript
// app/actions/article.ts
export interface ActionResponse {
  success: boolean;
  articleId?: string;
  error?: string;
}

// components/editor/Editor.tsx
const res = await publishArticle(text);
if (res?.error) { // ❌ ?. が散乱し、どちらの型かわからない
  setError(res.error);
}

// components/settings/Form.tsx
const [state, formAction] = useActionState(updateProfile, undefined); // ❌ undefined
{state?.error && <div>{state.error}</div>} // ❌ state?. を強要される
```

#### ✅ Good (Discriminated Union ＆ 初期オブジェクト):
```typescript
// app/actions/article.ts
export type PublishResult =
  | { success: true; articleId: string }
  | { success: false; error: string };

// components/editor/Editor.tsx
const res = await publishArticle(text);
if (!res.success) { // ✅ 型が確定し、?. は不要
  setError(res.error);
} else {
  navigate(res.articleId);
}

// components/settings/Form.tsx
const [state, formAction] = useActionState(updateProfile, { success: false }); // ✅ 初期値確定
{state.error && <div>{state.error}</div>} // ✅ state. で直接安全にアクセス
```

---

## 3. 監査実行フロー (Audit Execution Flow)

AIエージェントまたは開発者は、実装完了時に以下の手順で監査を実施すること：

1. **静的検証の実行**:
   ```bash
   npm run lint        # ESLint ルール検証 (UIでの?.や??の警告、any型の混入等)
   npm run type-check   # TypeScript 型チェック
   npm run audit:ui     # UIコンポーネントのフォールバック・オプショナル密度監査
   npm run test:unit    # 単体テスト全件通過の確認
   ```
2. **チェックリスト照合**:
   本スキルのチェックリスト（Q1-1 〜 Q5-2）を1項目ずつ確認し、過剰コードやエラー握りつぶしがないかを検証する。
3. **リファクタリング実施**:
   検出された過剰コード（多重チェック、安易なtry-catch、勝手なデフォルト値補填、UIでのオプショナル乱立）を削除・修正し、テストが引き続き通過することを確認する。
