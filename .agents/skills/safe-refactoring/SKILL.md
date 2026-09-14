---
name: safe-refactoring
description: 安全なリファクタリングを実践するための手順書。テストと実装の同時変更を防止し、4段階プロセス（安全網確認→実装リファクタ→デグレゼロ検証→テスト整理）およびリファクタリング耐性のあるテスト設計を監査・ガイドする。
---

# 安全なリファクタリング実行ガイドライン & 監査スキル (Safe Refactoring)

本スキルは、コードベースのリファクタリング（責務分離、過剰コード排除、共通化、アーキテクチャ改善）を**「絶対にデグレを起こさず、客観的な安全性を証明しながら進める」**ための手順書および監査チェックリストです。

特に、AIコーディングにおいて最も陥りやすい**「壊れた実装に合わせてテストを改竄してしまうセルフテストの罠（False Positive）」**を物理的に遮断します。

---

## 1. リファクタリング前チェックリスト (Pre-Refactoring Checklist)

リファクタリングコードを書く前に、必ず以下のチェックを実施する。

- [ ] **CH-1: 振る舞いの定義**: 今回の変更は「外部から観測可能な振る舞い（入出力・DB永続化・メール送信）」を変えない純粋な内部リファクタリングか？（APIのシグネチャ変更や仕様変更と混ざっていないか？）
- [ ] **CH-2: 安全網（テスト）の存在**: リファクタリング対象の振る舞いをカバーする単体テストまたは結合テストが存在するか？
- [ ] **CH-3: 事前 All Green**: リファクタリング前にテストを実行し、100% パスしているか？
- [ ] **CH-4: テストの非接触誓約**: リファクタリング中、既存のテストコードに1行も手を触れない制約を守れる状態にあるか？

> [!CAUTION]
> もし既存テストが存在しない、あるいは内部モックに過剰結合していて振る舞いを担保できていない場合は、**リファクタリングに着手する前に「振る舞いを固定するテスト（Pinning Test）」を新規作成し、コミットすること。**

---

## 2. 4段階の安全実行プロセス (The 4-Step Execution Flow)

### 📌 Step 1: 安全網の確認（Baseline Verification）
1. 対象コードに関連するテストスイートを実行する。
   ```bash
   npx vitest run <target-test-path>
   ```
2. 全件パスすることを確認し、ベースライン（現在の正常動作）を確立する。

### 📌 Step 2: プロダクションコードのリファクタリング（Production-Only Refactor）
1. **テストファイル（`*.test.ts`, `*.spec.ts`）を一切編集しない。**
2. プロダクションコード（実装ファイル）のみを修正する：
   - ActionからServiceへのロジック抽出
   - 多重チェック・不要な防御コードの排除
   - 命名の改善、関数の純粋化、重複コードの排除
   - 責務の明確化（Presenter化、レイヤリング遵守）

### 📌 Step 3: デグレゼロの検証（Zero-Regression Proof）
1. **1行も手を加えていない Step 1 のテストをそのまま再実行する。**
   ```bash
   npx vitest run <target-test-path>
   ```
2. **修正なしで全件パス（All Green）することを確認する。**
   - ❌ **失敗した場合**: テスト側を書き換えてはならない。プロダクションコード側に振る舞いの変化（バグや未考慮のエッジケース）が生じているため、プロダクションコードを修正してテストをパスさせる。
3. この時点で、**「外部から見た振る舞いは一切壊れていない」** ことが客観的に証明される。

### 📌 Step 4: テストの追従・構造整理（Test Refactoring as Separate Step）
1. レイヤーを分離したこと（例: ActionからServiceへDB操作を委譲したこと）により、テストピラミッドの責務を適正化したい場合は、**Step 3 が完了した後に独立したステップ**としてテストコードを整理する。
   - 例: Action単体テストからはDBモックを排除し、新設したService単体テストで実DB・副作用をテストする。
2. コミットも可能な限り分離する：
   - Commit A: `refactor: extract registration service logic from auth action` (プロダクション変更＋既存テストパス)
   - Commit B: `test: decouple auth action unit tests and add dedicated service tests` (テスト構造の適正化)

---

## 3. アンチパターンと改善カタログ (Anti-Patterns vs Best Practices)

### パターン 1: リファクタとテストを同時に修正するセルフテストの罠

#### ❌ Anti-Pattern (危険な同時編集):
```typescript
// 1. プロダクションコードを変更（戻り値プロパティを message から error に変更）
// 2. 「テストが落ちたから」と、テストコード側も同時に書き換える
- expect(result.message).toBe("エラー");
+ expect(result.error).toBe("エラー");
```
* **問題点**:
  * 実装がバグって本来成功すべきケースでエラーを返していても、テスト側も一緒に「エラーを期待する」ように書き換えてしまうリスクがある。
  * 「実装が合っているからテストが通った」のではなく、「テストを実装の都合に合わせて捻じ曲げた」状態になる。

#### ⭕ Best Practice (インターフェース変更とリファクタの分離):
1. 破壊的なインターフェース変更（プロパティ名変更等）を行う場合は、まず**「後方互換性を保ちながら新しいプロパティを追加する」**か、**「UI・呼び出し元との契約変更として明示的な移行計画を立てる」**。
2. 内部構造の変更（リファクタリング）中は、外部インターフェース（戻り値プロパティや型）を維持し、既存テストを変更せずに通す。

---

### パターン 2: 実装詳細への過剰モック結合（リファクタ耐性ゼロ）

#### ❌ Anti-Pattern (ホワイトボックスモックの乱立):
```typescript
// Action のテストなのに、Action が内部でどの Prisma メソッドを呼んだかを監視
it('新規登録できること', async () => {
  vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
  vi.mocked(prisma.userInvitation.create).mockResolvedValue({ id: '1' });
  vi.mocked(sendEmail).mockResolvedValue();

  await requestRegistrationEmailAction(null, formData);

  // 内部実装の1行1行と結合している
  expect(prisma.user.findUnique).toHaveBeenCalled();
  expect(prisma.userInvitation.create).toHaveBeenCalled();
});
```
* **問題点**:
  * Action 内の処理を別関数や別サービスに切り出した瞬間に、Prisma の呼び出し元が変わってテストが全滅する。
  * 「リファクタリングするたびにテストを書き直す」ことになり、テストがセーフティネットの役割を果たさない。

#### ⭕ Best Practice (振る舞い駆動テスト / 結合テスト):
```typescript
// 1. Action の単体テスト: 境界（入力検証・サービス委譲）のみを検証
it('有効な入力の場合、サービス層に処理を委譲すること', async () => {
  vi.mocked(requestPublicRegistration).mockResolvedValue({ success: true, message: '送信完了' });

  const result = await requestRegistrationEmailAction(null, formData);

  expect(result.success).toBe(true);
  expect(requestPublicRegistration).toHaveBeenCalledWith('user@example.com');
});

// 2. Service の統合テスト: 実DB・副作用を検証
it('未登録メールの場合、DBにPENDINGレコードを作成してメールを送信すること', async () => {
  const result = await requestPublicRegistration('user@example.com');

  expect(result.success).toBe(true);
  // DBの最終状態を検証（内部の呼び出し手順には依存しない）
  const invitation = await prisma.userInvitation.findFirst({ where: { email: 'user@example.com' } });
  expect(invitation?.status).toBe('PENDING');
  expect(sendEmail).toHaveBeenCalled();
});
```
* **メリット**:
  * Action の内部実装を変えても Service のテストは壊れない。
  * Service の内部 SQL やロジックを最適化しても、DBの最終状態とメール送信が同じならテストは壊れない。

---

## 4. レビュー時チェックリスト (Reviewer Checklist)

プルリクエストやコミットのレビュー時、レビュアー（テックリード・QA）は以下を検査する。

- [ ] **REV-1**: 「リファクタリング」と銘打たれた変更において、テストファイルの変更が混在していないか？
- [ ] **REV-2**: テストファイルの変更がある場合、それは「既存の仕様が変わったから」なのか、それとも「内部実装へのモック結合が原因で壊れたから」なのか？
- [ ] **REV-3**: 単体テストが「振る舞い（Behavior）」を検証しているか？（内部のプライベートメソッドや呼び出し手順を鏡写しにしていないか？）
- [ ] **REV-4**: リファクタリング前後のコミットで、テストの Green 状態が継続して維持されているか？
