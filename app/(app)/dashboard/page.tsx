import React from 'react';
import Link from 'next/link';
import { getUserSettingsData } from '@/app/actions/userSettings';

export default async function DashboardPage() {
    const dataResponse = await getUserSettingsData();

    const userEmail = dataResponse.success ? dataResponse.data.email : '';
    const userName = dataResponse.success && dataResponse.data.name ? dataResponse.data.name : '';
    const displayName = userName || userEmail;

    return (
        <div className="space-y-8">
            {/* ウェルカムバナー */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white mb-4 backdrop-blur-sm">
                        一般ユーザーポータル
                    </span>
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-2">
                        こんにちは、{displayName} さん
                    </h1>
                    <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                        Next App Template へようこそ。アカウント設定の変更やセキュリティ管理は、以下のクイックアクセスから行えます。
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* アカウントステータス & クイックリンク グリッド */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ステータスカード */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
                            👤
                        </div>
                        <h2 className="text-base font-bold text-slate-900 mb-1">
                            アカウント状態
                        </h2>
                        <p className="text-xs text-slate-500 mb-4">
                            現在の登録ステータス
                        </p>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">ロール</span>
                                <span className="font-semibold text-slate-800">一般ユーザー</span>
                            </div>
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                <span className="text-slate-500">ステータス</span>
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    ● 有効 (ACTIVE)
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-1.5">
                                <span className="text-slate-500">メール</span>
                                <span className="font-mono text-xs text-slate-700 truncate max-w-[150px]">
                                    {userEmail}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* プロフィール設定カード */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-4">
                            ✏️
                        </div>
                        <h2 className="text-base font-bold text-slate-900 mb-1">
                            プロフィール設定
                        </h2>
                        <p className="text-xs text-slate-500 mb-4">
                            画面上に表示される名前を更新します。
                        </p>
                        <p className="text-sm text-slate-600 mb-6">
                            現在の表示名: <strong className="text-slate-900">{userName || '（未設定）'}</strong>
                        </p>
                    </div>
                    <Link
                        href="/settings#profile"
                        className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-center"
                    >
                        プロフィールを編集する
                    </Link>
                </div>

                {/* セキュリティ管理カード */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
                            🔒
                        </div>
                        <h2 className="text-base font-bold text-slate-900 mb-1">
                            セキュリティ管理
                        </h2>
                        <p className="text-xs text-slate-500 mb-4">
                            ログインパスワードの変更を行います。
                        </p>
                        <p className="text-sm text-slate-600 mb-6">
                            定期的なパスワードの変更を推奨しています。
                        </p>
                    </div>
                    <Link
                        href="/settings#password"
                        className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors text-center"
                    >
                        パスワードを変更する
                    </Link>
                </div>
            </div>
        </div>
    );
}
