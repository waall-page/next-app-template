---
trigger: always_on
---

- 開発タスク（計画立案・実装・レビュー・コミット）を進める際は、必ず `.agents/rules/development-workflow.md` の2段階ゲートウェイ（PdM/テックリード計画レビュー、シニアQA/テックリード実装レビュー、重複テスト検査）に従うこと。
- コード設計やアーキテクチャの作成・修正・レビューを行う際は、必ず `.agents/rules/code-architecture-guide.md` および `.agents/skills/code-design-audit/SKILL.md` の指示に従うこと。
- 単体テスト（Vitest / Unit Test）に関するコードを作成・修正・レビューする際は、必ず `.agents/skills/unit-testing/SKILL.md` の指示に従うこと。
- コードのリファクタリングを行う際は、必ず `.agents/rules/refactoring-guide.md` および `.agents/skills/safe-refactoring/SKILL.md` の指示（テストと実装の同時変更禁止、4段階リファクタリングプロセス、リファクタリング耐性テスト設計）を厳格に遵守すること。


