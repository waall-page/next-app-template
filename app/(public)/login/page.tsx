'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { authenticate, AuthActionState } from '@/app/actions/auth';

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(authenticate, initialState);

    return (
        <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-md">
                <div className="text-center space-y-2 mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-xl mb-2 shadow-sm">
                        T
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        ログイン
                    </h1>
                    <p className="text-sm text-slate-500">
                        登録済みのメールアドレスとパスワードでサインイン
                    </p>
                </div>

                {state.error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                        <span className="font-bold">⚠️</span>
                        <span>{state.error}</span>
                    </div>
                )}

                <form action={formAction} className="space-y-5">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                        >
                            メールアドレス
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="user@example.com"
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all shadow-sm"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
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
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all shadow-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ログイン中...
                            </>
                        ) : (
                            'ログイン'
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3 text-xs text-slate-500">
                    <p>
                        アカウントをお持ちでないですか？{' '}
                        <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                            新規会員登録
                        </Link>
                    </p>
                    <div className="flex items-center gap-4 text-slate-400">
                        <Link href="/" className="hover:text-slate-600 transition-colors">
                            トップへ戻る
                        </Link>
                        <span>•</span>
                        <Link href="/admin/login" className="hover:text-slate-600 transition-colors">
                            管理者ログイン
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
