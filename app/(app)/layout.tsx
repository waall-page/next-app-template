import React from 'react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { userSignOut } from '@/app/actions/auth';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const userEmail = session?.user?.email ?? '';
    const userName = session?.user?.name ?? '';
    const displayLabel = userName || userEmail;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            {/* 認証ユーザー専用ヘッダー */}
            <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link
                            href="/dashboard"
                            className="text-xl font-bold tracking-tight text-blue-600 flex items-center gap-2"
                        >
                            <span className="inline-block w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-center leading-8">
                                T
                            </span>
                            <span>NextTemplate</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                            <Link
                                href="/dashboard"
                                className="hover:text-blue-600 transition-colors"
                            >
                                ダッシュボード
                            </Link>
                            <Link
                                href="/settings"
                                className="hover:text-blue-600 transition-colors"
                            >
                                アカウント設定
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col text-right">
                            <span className="text-xs font-medium text-slate-500">
                                ログイン中
                            </span>
                            <span className="text-sm font-semibold text-slate-800">
                                {displayLabel}
                            </span>
                        </div>
                        <form action={userSignOut}>
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                            >
                                ログアウト
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* フッター */}
            <footer className="border-t border-slate-200 bg-white mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <p>© 2026 Next App Template. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link href="/terms" className="hover:text-slate-900 transition-colors">
                            利用規約
                        </Link>
                        <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                            プライバシーポリシー
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
