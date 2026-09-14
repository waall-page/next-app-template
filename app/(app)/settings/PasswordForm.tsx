'use client';

import React, { useActionState, useRef } from 'react';
import { changePassword, ActionResponse } from '@/app/actions/userSettings';

const initialState: ActionResponse = {
    success: false,
    error: '',
};

export default function PasswordForm() {
    const [state, formAction, isPending] = useActionState(changePassword, initialState);
    const formRef = useRef<HTMLFormElement>(null);

    // 成功時にフォーム入力をクリア
    React.useEffect(() => {
        if (state.success && formRef.current) {
            formRef.current.reset();
        }
    }, [state.success]);

    return (
        <form ref={formRef} action={formAction} className="space-y-6">
            <div>
                <label
                    htmlFor="currentPassword"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                >
                    現在のパスワード
                </label>
                <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="現在のパスワードを入力"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 bg-white"
                />
            </div>

            <div>
                <label
                    htmlFor="newPassword"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                >
                    新しいパスワード（8文字以上）
                </label>
                <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="8文字以上の新しいパスワード"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 bg-white"
                />
            </div>

            <div>
                <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                >
                    新しいパスワード（確認用）
                </label>
                <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="新しいパスワードを再入力"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 bg-white"
                />
            </div>

            {state.success ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
                    <span>✓</span>
                    <span>{state.message}</span>
                </div>
            ) : null}

            {!state.success && state.error ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{state.error}</span>
                </div>
            ) : null}

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isPending ? (
                        <>
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>変更中...</span>
                        </>
                    ) : (
                        'パスワードを変更'
                    )}
                </button>
            </div>
        </form>
    );
}
