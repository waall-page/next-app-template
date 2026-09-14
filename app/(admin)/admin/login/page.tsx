'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { authenticateAdmin, AuthActionState } from '@/app/actions/auth';

const initialState: AuthActionState = { error: null };

export default function AdminLoginPage() {
    const [state, formAction, isPending] = useActionState(authenticateAdmin, initialState);

    return (
        <div className="min-h-[80vh] flex flex-col justify-center items-center px-4">
            <div className="w-full max-w-md bg-slate-800/90 border border-slate-700 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
                <div className="text-center space-y-2 mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-xl mb-2 shadow-md">
                        A
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        管理者ログイン
                    </h1>
                    <p className="text-xs text-slate-400">
                        Admin Console 管理アカウントでサインイン
                    </p>
                </div>

                {state.error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-sm flex items-start gap-2">
                        <span className="font-bold">⚠️</span>
                        <span>{state.error}</span>
                    </div>
                )}

                <form action={formAction} className="space-y-5">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                        >
                            メールアドレス
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="admin@example.com"
                            className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                        >
                            パスワード
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                認証中...
                            </>
                        ) : (
                            'サインイン'
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <Link href="/" className="hover:text-slate-200 transition-colors">
                        ← 一般トップへ
                    </Link>
                    <Link href="/login" className="hover:text-indigo-400 transition-colors">
                        一般ユーザーログイン →
                    </Link>
                </div>
            </div>
        </div>
    );
}
