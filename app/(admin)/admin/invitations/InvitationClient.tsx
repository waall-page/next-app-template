'use client';

import React, { useActionState, useTransition } from 'react';
import {
    inviteUserAction,
    resendInvitationAction,
    cancelInvitationAction,
    InvitationItem,
    InvitationActionResponse,
} from '@/app/actions/invitation';

const initialActionState: InvitationActionResponse = {
    success: false,
    error: '',
};

interface InvitationClientProps {
    initialInvitations: InvitationItem[];
    isInvitationEnabled: boolean;
}

export default function InvitationClient({
    initialInvitations,
    isInvitationEnabled,
}: InvitationClientProps) {
    const [state, formAction, isPending] = useActionState(inviteUserAction, initialActionState);
    const [isTransitionPending, startTransition] = useTransition();

    const handleResend = (id: string) => {
        if (!confirm('このユーザーに招待案内を再送信しますか？')) return;
        startTransition(async () => {
            const res = await resendInvitationAction(id);
            if (!res.success) {
                alert(res.error);
            }
        });
    };

    const handleCancel = (id: string) => {
        if (!confirm('この招待を取り消しますか？')) return;
        startTransition(async () => {
            const res = await cancelInvitationAction(id);
            if (!res.success) {
                alert(res.error);
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    ユーザー招待管理
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    新規ユーザーへの招待メール送信および発行済み招待の状況管理を行います。
                </p>
            </div>

            {/* Mode Banner when invitation is disabled */}
            {!isInvitationEnabled && (
                <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 text-sm flex items-start gap-3 shadow-sm">
                    <span className="text-amber-400 font-bold">ℹ️</span>
                    <div>
                        <p className="font-semibold text-white">自由登録制（Public Registration）モードで稼働中</p>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            現在、一般ビジター自身が新規登録（/register）できる自由登録制で稼働しているため、管理者からの個別招待メール発行は停止しています。招待制に切り替えるには環境変数 <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">REGISTRATION_MODE=&quot;invitation&quot;</code> を設定してください。
                        </p>
                    </div>
                </div>
            )}

            {/* Invite Form Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-semibold text-white mb-4">新規ユーザーを招待</h2>

                {state.success ? (
                    <div className="mb-4 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-sm flex items-center gap-2">
                        <span>✅</span>
                        <span>{state.message}</span>
                    </div>
                ) : state.error ? (
                    <div className="mb-4 p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-sm flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{state.error}</span>
                    </div>
                ) : null}

                <form action={formAction} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="email"
                        name="email"
                        required
                        disabled={!isInvitationEnabled || isPending}
                        placeholder={
                            isInvitationEnabled
                                ? '招待するユーザーのメールアドレス (例: user@example.com)'
                                : '招待機能は無効化されています'
                        }
                        className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={!isInvitationEnabled || isPending}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
                    >
                        {isPending ? (
                            <>
                                <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                送信中...
                            </>
                        ) : (
                            '✉️ 招待メールを送信'
                        )}
                    </button>
                </form>
            </div>

            {/* Invitations Table Card */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white">招待一覧</h2>
                    <span className="text-xs text-slate-400">
                        全 {initialInvitations.length} 件
                    </span>
                </div>

                {initialInvitations.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                        現在、発行された招待はありません。
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-900/50 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-3">メールアドレス</th>
                                    <th className="px-6 py-3">ステータス</th>
                                    <th className="px-6 py-3">発行日時</th>
                                    <th className="px-6 py-3">有効期限</th>
                                    <th className="px-6 py-3 text-right">アクション</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/60">
                                {initialInvitations.map((inv) => {
                                    const isExpired = new Date(inv.expiresAt) < new Date();
                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">
                                                {inv.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                {inv.status === 'ACCEPTED' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                                        登録完了
                                                    </span>
                                                )}
                                                {inv.status === 'PENDING' && !isExpired && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                                                        承認待ち
                                                    </span>
                                                )}
                                                {inv.status === 'PENDING' && isExpired && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950 text-red-300 border border-red-800">
                                                        期限切れ
                                                    </span>
                                                )}
                                                {inv.status === 'CANCELED' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                                        取消済み
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">
                                                {new Date(inv.createdAt).toLocaleString('ja-JP')}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">
                                                {new Date(inv.expiresAt).toLocaleString('ja-JP')}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {inv.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleResend(inv.id)}
                                                            disabled={isTransitionPending}
                                                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            再送信
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(inv.id)}
                                                            disabled={isTransitionPending}
                                                            className="px-3 py-1 bg-red-950/60 hover:bg-red-900/80 text-xs font-medium text-red-300 border border-red-800 rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            取り消し
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
