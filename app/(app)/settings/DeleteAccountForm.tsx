'use client';

import React, { useActionState, useState } from 'react';
import { deleteAccount, ActionResponse } from '@/app/actions/userSettings';

const initialState: ActionResponse = {
    success: false,
    error: '',
};

export default function DeleteAccountForm() {
    const [state, formAction, isPending] = useActionState(deleteAccount, initialState);
    const [confirmed, setConfirmed] = useState(false);

    return (
        <div className="space-y-6">
            <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 text-red-800 text-sm leading-relaxed">
                <p className="font-bold mb-1">⚠️ アカウント削除に伴う重要事項</p>
                <p>
                    退会手続きが完了すると、アカウントおよび関連するすべてのデータが完全に消去され、復旧することはできません。
                    利用を継続する場合は、この操作を行わないでください。
                </p>
            </div>

            <form action={formAction} className="space-y-4">
                <div>
                    <label
                        htmlFor="deletePassword"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                        本人確認用パスワード
                    </label>
                    <input
                        id="deletePassword"
                        name="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="現在のパスワードを入力して退会を確認"
                        className="w-full px-4 py-2.5 rounded-xl border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 bg-white"
                    />
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <input
                        id="confirmDelete"
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                    />
                    <label htmlFor="confirmDelete" className="text-xs text-slate-700 cursor-pointer select-none">
                        すべてのデータが消去されることを理解した上で退会します
                    </label>
                </div>

                {!state.success && state.error ? (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{state.error}</span>
                    </div>
                ) : null}

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={!confirmed || isPending}
                        className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>退会処理中...</span>
                            </>
                        ) : (
                            'アカウントを完全に削除する'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
