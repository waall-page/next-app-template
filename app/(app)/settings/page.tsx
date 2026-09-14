import React from 'react';
import { getUserSettingsData } from '@/app/actions/userSettings';
import ProfileForm from './ProfileForm';
import PasswordForm from './PasswordForm';
import DeleteAccountForm from './DeleteAccountForm';

export default async function SettingsPage() {
    const dataResponse = await getUserSettingsData();

    const initialEmail = dataResponse.success ? dataResponse.data.email : '';
    const initialName = dataResponse.success && dataResponse.data.name ? dataResponse.data.name : '';

    return (
        <div className="max-w-3xl mx-auto space-y-10">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    アカウント設定
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    表示名やログインパスワード、アカウントの管理を行えます。
                </p>
            </div>

            {/* セクション 1: プロフィール設定 */}
            <section id="profile" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="border-b border-slate-100 pb-5 mb-6">
                    <h2 className="text-lg font-bold text-slate-900">
                        プロフィール情報
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        サービス内で表示される名前を設定・変更できます。
                    </p>
                </div>
                <ProfileForm
                    initialName={initialName}
                    userEmail={initialEmail}
                />
            </section>

            {/* セクション 2: パスワード変更 */}
            <section id="password" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="border-b border-slate-100 pb-5 mb-6">
                    <h2 className="text-lg font-bold text-slate-900">
                        パスワード変更
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        定期的なパスワードの変更により、アカウントの安全性を維持します。
                    </p>
                </div>
                <PasswordForm />
            </section>

            {/* セクション 3: 危険ゾーン (退会・アカウント削除) */}
            <section id="danger-zone" className="bg-white border border-red-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="border-b border-red-100 pb-5 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-red-600 font-bold text-lg">⚠️</span>
                        <h2 className="text-lg font-bold text-red-600">
                            アカウントの削除（退会）
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        アカウントを削除すると、すべてのデータが完全に消去されます。
                    </p>
                </div>
                <DeleteAccountForm />
            </section>
        </div>
    );
}
