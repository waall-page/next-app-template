'use client';

import React, { useActionState } from 'react';
import { updateProfile, ActionResponse } from '@/app/actions/userSettings';

interface ProfileFormProps {
    initialName: string;
    userEmail: string;
}

const initialState: ActionResponse = {
    success: false,
    error: '',
};

export default function ProfileForm({ initialName, userEmail }: ProfileFormProps) {
    const [state, formAction, isPending] = useActionState(updateProfile, initialState);

    return (
        <form action={formAction} className="space-y-6">
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    登録メールアドレス（変更不可）
                </label>
                <input
                    type="email"
                    disabled
                    value={userEmail}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                    ログインIDとして使用されているメールアドレスです。
                </p>
            </div>

            <div>
                <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                >
                    表示名
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    maxLength={50}
                    defaultValue={initialName}
                    placeholder="例: 山田 太郎"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 bg-white"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                    ダッシュボード等で表示される名前です（最大50文字）。空欄の場合はメールアドレスが表示されます。
                </p>
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
                            <span>保存中...</span>
                        </>
                    ) : (
                        'プロフィールを更新'
                    )}
                </button>
            </div>
        </form>
    );
}
