---
description: ユーザーからコミットの要求（「コミット」「コミットして」等）があった際のGitコミット生成ルール
always_on: true
---

# Git Commit Automation Rule

ユーザーから「コミット」「コミットして」「コミットする」「commit」等のコミット要求があった場合は、以下の手順に従って自動処理を行い、ターミナル貼り付け用のコマンドを提示すること。

---

## 1. 実行手順

1. **差分確認とステージング (`git add`)**:
   - `git status` や変更差分を確認し、コミット対象となるファイルを `git add` コマンドでステージングする。
2. **コミットメッセージの生成（英語必須）**:
   - コミットメッセージは**必ず英語（English）**で作成する。
   - Conventional Commits プレフィックス（`feat:`, `fix:`, `style:`, `refactor:`, `test:`, `docs:`, `chore:` 等）を使用する。
   - **単一の目的の変更の場合（1行）**:
     - 1行の簡潔なサマリー（例: `git commit -m "style: update legal document styling to use prose-paper class"`）
   - **複数の目的の変更の場合（2行以上）**:
     - 1行目に全体のサマリーを書き、2行目以降に `- ` で各目的・詳細な変更箇所の箇条書き（Body）を英語で記述する。
3. **ターミナル貼り付け用コマンドの提示**:
   - AIが自動で `git commit` を実行して完了させるのではなく、**ユーザーが内容を確認してターミナルに貼り付けて実行できるコードブロック形式**で提示する。

---

## 2. 出力フォーマット例

### パターンA: 単一の目的の変更の場合（1行）
```bash
git commit -m "feat: add agreedToTerms validation in user registration service"
```

### パターンB: 複数の目的の変更の場合（2行以上）
複数行のコミットメッセージをターミナルで安全に実行できるよう、以下の `-m` 複数指定形式で提示する：

```bash
git commit -m "feat: implement legal documents system and update design guidelines" \
  -m "- Add /terms and /privacy pages with Markdown parsing (marked + gray-matter)
- Enforce terms and privacy policy agreement during user registration via invitation
- Add termsAgreedVersion and termsAgreedAt columns to User table and apply migration
- Update doc/DESIGN.md with .prose-paper typography and checkbox specifications"
```
