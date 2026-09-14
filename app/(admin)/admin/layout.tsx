import Link from "next/link";
import React from "react";
import { auth } from "@/lib/auth";
import { adminSignOut } from "@/app/actions/adminAuth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdminLoggedIn = session?.user?.role === "admin";

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {/* Admin Top Banner */}
      <div className="bg-indigo-600 px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-white">
        管理者コンソール (Admin Console Mode)
      </div>

      {/* Admin Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shadow-sm">
                A
              </span>
              <span className="text-lg font-bold tracking-tight text-white">
                Admin Console
              </span>
            </Link>
            {isAdminLoggedIn && (
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
                <Link href="/admin" className="hover:text-white transition-colors">
                  ダッシュボード
                </Link>
                <Link href="/admin/invitations" className="hover:text-white transition-colors">
                  招待管理
                </Link>
                <Link href="/admin/settings" className="hover:text-white transition-colors">
                  パスワード設定
                </Link>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-slate-400 hover:text-white transition-colors text-xs"
            >
              ← 一般画面へ
            </Link>
            {isAdminLoggedIn ? (
              <div className="flex items-center gap-3">
                {session.user.email && (
                  <span className="hidden sm:inline-block text-xs text-slate-400">
                    {session.user.email}
                  </span>
                )}
                <form action={adminSignOut}>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700"
                  >
                    ログアウト
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700"
              >
                管理者ログイン
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Admin Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}

