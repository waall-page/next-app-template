import Link from 'next/link';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export default async function AdminDashboardPage() {
    const session = await auth();

    // 統計サマリーの取得
    const [userCount, pendingInvitationCount, adminCount] = await Promise.all([
        prisma.user.count(),
        prisma.userInvitation.count({
            where: {
                status: 'PENDING',
                expiresAt: { gt: new Date() },
            },
        }),
        prisma.admin.count(),
    ]);

    return (
        <div className="space-y-8">
            {/* Header / Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        管理者ダッシュボード
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        システム全体のユーザー状態や招待状況の確認と管理を行います。
                    </p>
                </div>
                {session?.user?.email && (
                    <div className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300">
                        ログイン中: <span className="font-semibold text-white">{session.user.email}</span>
                    </div>
                )}
            </div>

            {/* KPI Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-sm">
                    <div className="text-slate-400 text-sm font-medium">総登録ユーザー数</div>
                    <div className="mt-2 text-3xl font-extrabold text-white">
                        {userCount.toLocaleString()}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">アカウント開設済み</div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-sm">
                    <div className="text-slate-400 text-sm font-medium">承認待ちの招待</div>
                    <div className="mt-2 text-3xl font-extrabold text-amber-400">
                        {pendingInvitationCount.toLocaleString()}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">有効な招待トークン</div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-sm">
                    <div className="text-slate-400 text-sm font-medium">管理者アカウント</div>
                    <div className="mt-2 text-3xl font-extrabold text-indigo-400">
                        {adminCount.toLocaleString()}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">システム運用者</div>
                </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-4 shadow-sm">
                <h2 className="text-lg font-semibold text-white">クイックアクション</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                        href="/admin/invitations"
                        className="flex items-center justify-between p-4 bg-slate-700/40 hover:bg-slate-700/80 border border-slate-600 rounded-xl transition-all group"
                    >
                        <div>
                            <div className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                                ✉️ ユーザー招待管理
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                                招待メールの送信、招待中一覧の確認・再送・取消。
                            </div>
                        </div>
                        <span className="text-slate-400 group-hover:text-white transition-transform group-hover:translate-x-1">→</span>
                    </Link>

                    <Link
                        href="/admin/settings"
                        className="flex items-center justify-between p-4 bg-slate-700/40 hover:bg-slate-700/80 border border-slate-600 rounded-xl transition-all group"
                    >
                        <div>
                            <div className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                                🔑 パスワード変更
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                                現在ログイン中の管理者パスワードを安全に変更。
                            </div>
                        </div>
                        <span className="text-slate-400 group-hover:text-white transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
