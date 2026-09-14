import Link from "next/link";
import React from "react";
import { isPublicRegistrationEnabled } from "@/lib/env";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const showRegister = isPublicRegistrationEnabled();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold tracking-tight text-blue-600 flex items-center gap-2">
              <span className="inline-block w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-center leading-8 shadow-sm">
                T
              </span>
              <span>NextTemplate</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="/terms" className="hover:text-blue-600 transition-colors">
                利用規約
              </Link>
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                プライバシーポリシー
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {showRegister && (
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
              >
                新規登録
              </Link>
            )}
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              ログイン
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Next App Template. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-slate-900 transition-colors">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/admin/login" className="text-slate-400 hover:text-slate-700 transition-colors">
              管理者コンソール
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
