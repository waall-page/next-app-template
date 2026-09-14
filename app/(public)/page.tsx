import Link from "next/link";
import { isPublicRegistrationEnabled } from "@/lib/env";

export default function HomePage() {
  const showRegister = isPublicRegistrationEnabled();

  return (
    <div className="relative overflow-hidden py-16 sm:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span>🚀 Production-Ready Architecture</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900">
            Next.js App Template
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600">
            管理者・一般ユーザーの二系統認証（NextAuth v5）、確認メール先行型ユーザー登録、
            PostgreSQL + Prisma、Docker Mailpit を完備したフルスタックテンプレートです。
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700 transition-all"
            >
              ユーザーログイン
            </Link>
            {showRegister && (
              <Link
                href="/register"
                className="px-6 py-3 text-base font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl shadow-sm hover:bg-blue-100 transition-all"
              >
                新規会員登録
              </Link>
            )}
            <Link
              href="/admin/login"
              className="px-6 py-3 text-base font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 transition-all"
            >
              管理者コンソール
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              🔐
            </div>
            <h2 className="text-lg font-bold text-slate-900">二系統の認証基盤</h2>
            <p className="text-sm text-slate-600">
              一般ユーザー（User）と管理者（Admin）の認証モデルを完全に分離。NextAuth v5 とセッション管理で安全な権限分離を提供。
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              ✉️
            </div>
            <h2 className="text-lg font-bold text-slate-900">モダンなユーザー登録</h2>
            <p className="text-sm text-slate-600">
              確認メール先行型による安全なメール所有確認。自由登録制と招待制で本登録フロー（パスワード設定・規約同意）を共通化。
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              🐳
            </div>
            <h2 className="text-lg font-bold text-slate-900">ローカル開発環境</h2>
            <p className="text-sm text-slate-600">
              Docker Compose による PostgreSQL 16 と Mailpit を標準搭載。開発時のメール送信確認が即座に可能。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
