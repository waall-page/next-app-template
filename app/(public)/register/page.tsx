import React from 'react';
import Link from 'next/link';
import { isPublicRegistrationEnabled } from '@/lib/env';
import { verifyInvitationToken } from '@/lib/services/registration';
import RegisterEmailForm from './RegisterEmailForm';
import RegisterPasswordForm from './RegisterPasswordForm';

interface RegisterPageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
    const { token } = await searchParams;

    // 1. トークンが存在しない場合: 自由登録の確認メール入力フロー
    if (!token) {
        const isPublicEnabled = isPublicRegistrationEnabled();

        if (!isPublicEnabled) {
            return (
                <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
                    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-md text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-600 text-xl font-bold">
                            ✉️
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">
                            新規登録の受付について
                        </h1>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            現在、一般ユーザー向けの新規会員登録受付は停止しております。
                            本システムをご利用いただくには、管理者からの招待メールが必要です。
                        </p>
                        <div className="pt-2">
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                            >
                                ログイン画面へ戻る
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
                <RegisterEmailForm />
            </div>
        );
    }

    // 2. トークンが存在する場合: トークン検証 ➔ パスワード設定・規約同意の本登録フロー
    const verifyResult = await verifyInvitationToken(token);

    if (!verifyResult.valid || !verifyResult.invitation) {
        return (
            <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-md text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 text-red-600 text-xl font-bold">
                        ⚠️
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">
                        登録リンクが無効です
                    </h1>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {verifyResult.message || '登録用リンクの有効期限が切れているか、既に使用済み・取り消しされています。'}
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            最初からやり直す
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                        >
                            ログインへ進む
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
            <RegisterPasswordForm
                token={token}
                email={verifyResult.invitation.email}
            />
        </div>
    );
}
