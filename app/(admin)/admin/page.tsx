import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          管理者ダッシュボード
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          システム全体のユーザー状態や招待状況の確認と管理を行います。
        </p>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="text-slate-400 text-sm font-medium">総登録ユーザー数</div>
          <div className="mt-2 text-3xl font-extrabold text-white">--</div>
          <div className="mt-2 text-xs text-slate-500">アクティブなアカウント</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="text-slate-400 text-sm font-medium">承認待ちの招待</div>
          <div className="mt-2 text-3xl font-extrabold text-amber-400">--</div>
          <div className="mt-2 text-xs text-slate-500">期限内の招待トークン</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="text-slate-400 text-sm font-medium">管理者アカウント</div>
          <div className="mt-2 text-3xl font-extrabold text-indigo-400">--</div>
          <div className="mt-2 text-xs text-slate-500">システム管理者数</div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">クイックアクション</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/invitations"
            className="flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors group"
          >
            <div>
              <div className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                ✉️ 新規ユーザーを招待する
              </div>
              <div className="text-xs text-slate-400 mt-1">
                メールアドレス宛に招待URLを発行・送信します。
              </div>
            </div>
            <span className="text-slate-400 group-hover:text-white">→</span>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors group"
          >
            <div>
              <div className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                👥 ユーザーアカウントを管理する
              </div>
              <div className="text-xs text-slate-400 mt-1">
                登録済みユーザーのステータス変更やパスワードリセット。
              </div>
            </div>
            <span className="text-slate-400 group-hover:text-white">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
