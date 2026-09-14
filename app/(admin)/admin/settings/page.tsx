'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { changeAdminPassword, ActionResponse } from '@/app/actions/adminAuth';

const initialState: ActionResponse = {
    success: false,
    error: '',
};

export default function AdminSettingsPage() {
    const [state, formAction, isPending] = useActionState(changeAdminPassword, initialState);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <Link href="/admin" className="hover:text-white transition-colors">
                        ダッシュボード
                    </Link>
                    <span>/</span>
                    <span className="text-slate-200">設定・パスワード変更</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    管理者パスワード変更
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    管理者アカウントのパスワードを変更します。次回ログイン時から新しいパスワードが有効になります。
                </p>
            </div>

            {/* Notification messages */}
            {state.success ? (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-sm flex items-start gap-2">
                    <span className="font-bold">✓</span>
                    <span>{state.message}</span>
                </div>
            ) : state.error ? (
                <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-sm flex items-start gap-2">
                    <span className="font-bold">⚠️</span>
                    <span>{state.error}</span>
                </div>
            ) : null}

            {/* Form Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-sm">
                <form action={formAction} className="space-y-6">
                    <div>
                        <label
                            htmlFor="currentPassword"
                            className="block text-sm font-medium text-slate-200 mb-1.5"
                        >
                            現在のパスワード
                        </label>
                        <input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            autoComplete="current-password"
                            required
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                        />
                    </div>

                    <div className="border-t border-slate-700/60 pt-6 space-y-6">
                        <div>
                            <label
                                htmlFor="newPassword"
                                className="block text-sm font-medium text-slate-200 mb-1.5"
                            >
                                新しいパスワード
                            </label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                                placeholder="8文字以上の強力なパスワード"
                                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                8文字以上で、推測されにくい文字列を指定してください。
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-slate-200 mb-1.5"
                            >
                                新しいパスワード（確認用）
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                                placeholder="もう一度入力してください"
                                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-4">
                        <Link
                            href="/admin"
                            className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            キャンセル
                        </Link>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    更新中...
                                </>
                            ) : (
                                'パスワードを変更'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
