# Next.js 16 認証テンプレート (Next.js Authentication Template)

Next.js 16 (App Router)、Auth.js v5 (NextAuth)、Prisma 7、PostgreSQL、Mailpit を採用した、プロダクション品質の認証・会員管理スターターテンプレートです。
一般ユーザー向け機能（自由登録・招待登録・ダッシュボード・設定変更・退会）および管理者向け機能（セキュアログイン・招待管理・パスワード変更）を完全網羅しています。

---

## ⚡️ クイックスタート (Quick Start)

Git クローンを行わず、**`curl` または `wget` を使って GitHub リポジトリから直接ダウンロード・展開**して即座にセットアップできます。

### 1. リポジトリのダウンロード & 展開

お使いの環境に合わせて以下のいずれかのワンライナーを実行してください。

#### 🌐 `curl` を使用する場合:
```bash
curl -L https://github.com/waall-page/next-app-template/archive/refs/heads/main.tar.gz | tar -xz
cd next-app-template-main
```

#### 🌐 `wget` を使用する場合:
```bash
wget -qO- https://github.com/waall-page/next-app-template/archive/refs/heads/main.tar.gz | tar -xz
cd next-app-template-main
```

*(参考: `git clone` を使用する場合)*:
```bash
git clone https://github.com/waall-page/next-app-template.git
cd next-app-template
```

---

### 2. 依存パッケージのインストール

```bash
npm install
```

---

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成します。

```bash
cp .env.example .env
```

> [!TIP]
> **AUTH_SECRET の自動生成**:
> `.env` 内の `AUTH_SECRET` にはランダムな秘密鍵を設定してください。
> ```bash
> npx auth secret
> # または
> openssl rand -base64 32
> ```
> ローカル開発用のデータベース接続（PostgreSQL: 5432）やメール送信（Mailpit: 1025）は、初期状態でそのまま動作するように構成されています。

---

### 4. データベース起動 & 初期シード

Docker Compose で PostgreSQL および Mailpit（ローカルメールサーバー）を起動し、データベースを初期化します。

```bash
# 1. バックグラウンドでコンテナを起動
docker compose up -d

# 2. データベーススキーマの反映
npm run db:push

# 3. 初期シードデータの投入（管理者 & 一般ユーザー）
npm run db:seed
```

---

### 5. 開発サーバーの起動

```bash
npm run dev
```

起動後、ブラウザで以下のエンドポイントにアクセスできます。

| サービス | URL | 説明 |
| :--- | :--- | :--- |
| **Web アプリ (一般)** | [http://localhost:3000](http://localhost:3000) | トップ画面・ログイン・新規登録 |
| **管理コンソール** | [http://localhost:3000/admin/login](http://localhost:3000/admin/login) | 管理者サインイン画面 |
| **Mailpit (Web UI)** | [http://localhost:8025](http://localhost:8025) | 開発環境で送信されたメールの閲覧・確認UI |

---

## 🔑 初期アカウント情報

`npm run db:seed` を実行すると、以下のテストアカウントが自動作成されます。

### 一般ユーザー
* **メールアドレス**: `user@example.com`
* **パスワード**: `Template2026!`
* **ログイン後遷移**: `/dashboard`

### 管理者
* **メールアドレス**: `admin@example.com`
* **パスワード**: `Template2026!`
* **ログイン後遷移**: `/admin`

> [!NOTE]
> **任意の管理者アカウントを手動作成する場合**:
> CLIスクリプトから任意の管理者アカウントを作成できます。
> ```bash
> ADMIN_EMAIL="your-admin@example.com" ADMIN_PASSWORD="YourSecurePassword123!" npm run admin:create
> ```

---

## 🛠 主な機能と設定

### 1. 排他的ユーザー登録モード (`REGISTRATION_MODE`)
BtoC/オープンSaaSとクローズド/BtoB招待制SaaSの双方に対応するため、`.env` で排他制御できます。

```env
# "public" | "invitation" | "disabled"
REGISTRATION_MODE="public"
```

* **`public` (自由登録制・デフォルト)**:
  * `/register` から誰でも確認メールを受信して本登録可能。管理画面の招待機能は案内表示となり非活性化。
* **`invitation` (招待制)**:
  * 管理者（`/admin/invitations`）から招待されたユーザーのみ登録可能。トークンなしの `/register` アクセスは案内表示。
* **`disabled` (新規受付停止)**:
  * 自由登録・招待登録ともに新規受付を停止。

### 2. メールアドレス所有確認型の共通本登録フロー
自由登録・招待制ともに、**「確認メール送信 ➔ 専用ワンタイムリンクからパスワード設定＆規約同意」** の共通フロー（`/register?token=...`）を採用しています。

### 3. 一般ユーザー機能 (セルフサーブ & Danger Zone)
* **ダッシュボード (`/dashboard`)**: アカウントステータス表示・クイックリンク。
* **アカウント設定 (`/settings`)**:
  * プロフィール変更（表示名の変更・上限50文字）。
  * パスワード変更（現在パスワード照合 ➔ 新パスワード設定）。
  * 退会・アカウント削除（Danger Zone: 本人確認パスワード照合 ➔ 完全削除 ➔ `/deactivated` へリダイレクト）。

### 4. セキュリティ & アーキテクチャ原則
* **Argon2id ハッシュ**: 最新の暗号化方式による安全なパスワード管理。
* **Fail-Fast 原則**: 不正な状態や未定義環境変数のサイレントフォールバックを排除し、即座にエラー検知。
* **Discriminated Union**: 戻り値の型を `{ success: true, ... } | { success: false, error: string }` に統一。
* **UI Presenter 化**: 画面コンポーネント内でのフォールバック・オプショナル乱立（`?.` / `??`）ゼロを達成。

---

## 🧪 品質検証・テストコマンド

本テンプレートには包括的なテスト・品質監査ツールが統合されています。

```bash
# 型チェック
npm run type-check

# 静的解析 (Lint)
npm run lint

# UI複雑度・フォールバック密度監査 (Presenter原則の検証)
npm run audit:ui

# 単体テスト (Vitest / 135 tests 全件実行)
npm run test:unit

# E2E ブラウザテスト (Playwright)
npx playwright test --project=chromium

# プロダクションビルド検証
npm run build
```

---

## 📁 ディレクトリ構造

```text
├── app/
│   ├── (admin)/admin/        # 管理者領域（ログイン、管理コンソール、招待管理）
│   ├── (app)/                # 一般認証ユーザー専用領域（ダッシュボード、設定）
│   ├── (public)/             # 一般公開領域（トップ、利用規約、ポリシー、ログイン、登録、退会完了）
│   └── actions/              # Server Actions（認証・招待・ユーザー設定）
├── lib/
│   ├── services/             # ドメインサービス層（DB操作、ビジネスロジック、バリデーション）
│   ├── auth.ts               # Auth.js / NextAuth 設定
│   ├── auth.config.ts        # 認可・ミドルウェアルール設定
│   ├── email.ts              # メール送信ユーティリティ (Nodemailer)
│   ├── hash.ts               # パスワードハッシュ化 (Argon2id)
│   └── prisma.ts             # Prisma クライアント
├── prisma/
│   ├── schema.prisma         # データベース定義（User, Admin, Invitation）
│   └── seed.ts               # 初期シードデータ投入スクリプト
├── scripts/                  # CLIツール（管理者作成、UI監査、テストメール送信）
├── tests/
│   ├── unit/                 # 単体テスト (Services / Server Actions / Lib)
│   └── e2e/                  # ブラウザ結合 E2E テスト (Playwright)
└── doc/
    ├── spec/                 # 認証・登録仕様書 (auth.md)
    └── usecase/              # ユースケース仕様書（9件）
```

---

## 📜 ライセンス

（未定）
