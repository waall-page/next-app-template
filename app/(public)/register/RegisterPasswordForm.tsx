'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { registerUserAction, AuthActionResponse } from '@/app/actions/auth';

const initialState: AuthActionResponse = {
    success: false,
    error: '',
};

interface RegisterPasswordFormProps {
    token: string;
    email: string;
}

export default function RegisterPasswordForm({ token, email }: RegisterPasswordFormProps) {
    const [state, formAction, isPending] = useActionState(registerUserAction, initialState);

    return (
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-8 shadow-md">
            <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-xl mb-2 shadow-sm">
                    T
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    アカウントの本登録
                </h1>
                <p className="text-sm text-slate-500">
                    パスワードの設定と利用規約への同意を行って登録を完了してください。
                </p>
            </div>

            {state.success ? (
                <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
                        <span className="font-bold text-emerald-600">✓</span>
                        <div className="space-y-1">
                            <p className="font-semibold">アカウントが開設されました</p>
                            <p className="text-xs text-emerald-700 leading-relaxed">
                                ご登録いただいたパスワードでログインしてサービスをご利用いただけます。
                            </p>
                        </div>
                    </div>
                    <div className="text-center pt-2">
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-colors"
                        >
                            ログイン画面へ進む
                        </Link>
                    </div>
                </div>
            ) : (
                <form action={formAction} className="space-y-6">
                    <input type="hidden" name="token" value={token} />

                    {state.error ? (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                            <span className="font-bold">⚠️</span>
                            <span>{state.error}</span>
                        </div>
                    ) : null}

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                            登録メールアドレス
                        </label>
                        <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium">
                            {email}
                        </div>
                    </div>

                    <div className="space-y-4">
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
                                autoComplete="new-password"
                                required
                                minLength={8}
                                placeholder="8文字以上の強力なパスワード"
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all shadow-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                8文字以上で指定してください。
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                            >
                                パスワード（確認用）
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                                placeholder="もう一度入力してください"
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* 利用規約同意チェックボックス */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                name="agreedToTerms"
                                required
                                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs text-slate-700 leading-relaxed">
                                <Link
                                    href="/terms"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-blue-600 hover:underline"
                                >
                                    利用規約
                                </Link>
                                {' '}および{' '}
                                <Link
                                    href="/privacy"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-blue-600 hover:underline"
                                >
                                    プライバシーポリシー
                                </Link>
                                {' '}の内容を確認し、これらに同意します。
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                登録処理中...
                            </>
                        ) : (
                            'アカウント本登録を完了する'
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}
