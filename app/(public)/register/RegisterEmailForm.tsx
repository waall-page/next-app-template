'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { requestRegistrationEmailAction, AuthActionResponse } from '@/app/actions/auth';

const initialState: AuthActionResponse = {
    success: false,
    error: '',
};

export default function RegisterEmailForm() {
    const [state, formAction, isPending] = useActionState(
        requestRegistrationEmailAction,
        initialState
    );

    return (
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-md">
            <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-xl mb-2 shadow-sm">
                    T
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    新規会員登録
                </h1>
                <p className="text-sm text-slate-500">
                    ご入力いただいたメールアドレスに登録案内メールをお送りします。
                </p>
            </div>

            {state.success ? (
                <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
                        <span className="font-bold text-emerald-600">✓</span>
                        <div className="space-y-1">
                            <p className="font-semibold">確認メールを送信しました</p>
                            <p className="text-xs text-emerald-700 leading-relaxed">
                                メールに記載された本登録リンクをクリックし、パスワードの設定と利用規約への同意を行ってください。
                            </p>
                        </div>
                    </div>
                    <div className="text-center pt-2">
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            ログイン画面へ
                        </Link>
                    </div>
                </div>
            ) : (
                <form action={formAction} className="space-y-5">
                    {state.error ? (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                            <span className="font-bold">⚠️</span>
                            <span>{state.error}</span>
                        </div>
                    ) : null}

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
                        <p className="text-xs text-slate-500 mt-1.5">
                            ※ ご登録後、確認用リンクをお送りします。
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                送信中...
                            </>
                        ) : (
                            '確認メールを送信'
                        )}
                    </button>
                </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3 text-xs text-slate-500">
                <p>
                    既にアカウントをお持ちですか？{' '}
                    <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                        ログイン
                    </Link>
                </p>
                <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
                    トップへ戻る
                </Link>
            </div>
        </div>
    );
}
