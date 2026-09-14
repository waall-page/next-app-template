import React from 'react';
import Link from 'next/link';

export default function DeactivatedPage() {
    return (
        <div className="min-h-[75vh] flex flex-col justify-center items-center px-4 py-16">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm text-center space-y-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 text-2xl mb-2">
                    ✓
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        利用終了手続きが完了しました
                    </h1>
                    <p className="text-sm font-medium text-slate-500">
                        Account Deactivation Completed
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed text-left space-y-2">
                    <p>
                        これまで本サービスをご利用いただき、誠にありがとうございました。
                    </p>
                    <p>
                        お客様のアカウント情報および関連データはシステムから安全に消去され、ログインセッションは無効化されました。
                    </p>
                </div>

                <div className="pt-4">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all"
                    >
                        トップページへ戻る
                    </Link>
                </div>
            </div>
        </div>
    );
}
