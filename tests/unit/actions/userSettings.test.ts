import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getUserSettingsData,
    updateProfile,
    changePassword,
    deleteAccount,
} from '@/app/actions/userSettings';
import { auth, signOut } from '@/lib/auth';
import {
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
    deleteUserAccount,
} from '@/lib/services/userSettings';
import { revalidatePath } from 'next/cache';
import { Session } from 'next-auth';

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
    signOut: vi.fn(),
}));

vi.mock('@/lib/services/userSettings', () => ({
    getUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
    updateUserPassword: vi.fn(),
    deleteUserAccount: vi.fn(),
}));

describe('userSettings Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUserSettingsData', () => {
        describe('正常系', () => {
            it('ログインユーザーの設定画面用データをサービスから取得して返却すること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', email: 'user1@example.com', role: 'user' },
                } as unknown as Session);

                vi.mocked(getUserProfile).mockResolvedValue({
                    success: true,
                    user: {
                        id: 'user-1',
                        email: 'user1@example.com',
                        name: 'ユーザー名',
                    },
                });

                const result = await getUserSettingsData();

                expect(result.success).toBe(true);
                if (!result.success) throw new Error('Expected success');
                expect(result.data.email).toBe('user1@example.com');
                expect(result.data.name).toBe('ユーザー名');
                expect(getUserProfile).toHaveBeenCalledWith('user-1');
            });

            it('表示名が null の場合、name: null で返ること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', email: 'user1@example.com', role: 'user' },
                } as unknown as Session);

                vi.mocked(getUserProfile).mockResolvedValue({
                    success: true,
                    user: {
                        id: 'user-1',
                        email: 'user1@example.com',
                        name: null,
                    },
                });

                const result = await getUserSettingsData();

                expect(result.success).toBe(true);
                if (!result.success) throw new Error('Expected success');
                expect(result.data.name).toBeNull();
            });
        });

        describe('異常系', () => {
            it('未ログイン状態の場合はエラーを返し、サービスを呼び出さないこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue(null);

                const result = await getUserSettingsData();

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure');
                expect(result.error).toBe('Unauthorized');
                expect(getUserProfile).not.toHaveBeenCalled();
            });

            it('サービス層でエラーが返った場合はそのエラーを返却すること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' },
                } as unknown as Session);

                vi.mocked(getUserProfile).mockResolvedValue({
                    success: false,
                    error: 'ユーザーが見つかりません。',
                });

                const result = await getUserSettingsData();

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure');
                expect(result.error).toBe('ユーザーが見つかりません。');
            });
        });
    });

    describe('updateProfile', () => {
        describe('正常系', () => {
            it('有効な表示名を入力してサービスを呼び出し、再検証を実行すること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' },
                } as unknown as Session);

                vi.mocked(updateUserProfile).mockResolvedValue({
                    success: true,
                    message: 'プロフィールを更新しました。',
                    user: { id: 'user-1', name: '新しい表示名' },
                });

                const formData = new FormData();
                formData.append('name', '新しい表示名');

                const result = await updateProfile(undefined, formData);

                expect(updateUserProfile).toHaveBeenCalledWith('user-1', '新しい表示名');
                expect(revalidatePath).toHaveBeenCalledWith('/settings');
                expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
                expect(result.success).toBe(true);
                if (!result.success) throw new Error('Expected success');
                expect(result.message).toBe('プロフィールを更新しました。');
            });
        });

        describe('異常系', () => {
            it('未ログイン状態の場合はエラーを返し、サービスを呼ばないこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue(null);

                const formData = new FormData();
                formData.append('name', 'テスト');

                const result = await updateProfile(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure');
                expect(result.error).toBe('ログインが必要です。');
                expect(updateUserProfile).not.toHaveBeenCalled();
            });

            it('サービス層がエラー（50文字超など）を返した場合はそのエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' },
                } as unknown as Session);

                vi.mocked(updateUserProfile).mockResolvedValue({
                    success: false,
                    error: '表示名は50文字以内で入力してください。',
                });

                const formData = new FormData();
                formData.append('name', 'あ'.repeat(51));

                const result = await updateProfile(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure');
                expect(result.error).toBe('表示名は50文字以内で入力してください。');
                expect(revalidatePath).not.toHaveBeenCalled();
            });
        });
    });

    describe('changePassword', () => {
        describe('正常系', () => {
            it('正しい入力でパスワード変更サービスを呼び出すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' },
                } as unknown as Session);

                vi.mocked(updateUserPassword).mockResolvedValue({
                    success: true,
                    message: 'パスワードを変更しました。',
                });

                const formData = new FormData();
                formData.append('currentPassword', 'OldPassword123');
                formData.append('newPassword', 'NewPassword123');
                formData.append('confirmPassword', 'NewPassword123');

                const result = await changePassword(undefined, formData);

                expect(updateUserPassword).toHaveBeenCalledWith(
                    'user-1',
                    'OldPassword123',
                    'NewPassword123'
                );
                expect(result.success).toBe(true);
                if (!result.success) throw new Error('Expected success');
                expect(result.message).toBe('パスワードを変更しました。');
            });
        });

        describe('異常系', () => {
            it('未ログイン状態の場合はエラーを返しサービスを呼ばないこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue(null);

                const formData = new FormData();
                formData.append('currentPassword', 'Old123');
                formData.append('newPassword', 'New12345');
                formData.append('confirmPassword', 'New12345');

                const result = await changePassword(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure');
                expect(result.error).toBe('ログインが必要です。');
                expect(updateUserPassword).not.toHaveBeenCalled();
            });

            it('新パスワードと確認用が一致しない場合はエラーを返しサービスを呼ばないこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' },
                } as unknown as Session);

                const formData = new FormData();
                formData.append('currentPassword', 'OldPassword123');
                formData.append('newPassword', 'NewPassword123');
                formData.append('confirmPassword', 'DifferentPassword123');

                const result = await changePassword(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure');
                expect(result.error).toBe('新しいパスワードが確認用と一致しません。');
                expect(updateUserPassword).not.toHaveBeenCalled();
            });

            it('サービス層がエラー（現在パスワード不一致等）を返した場合はそのメッセージを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' },
                } as unknown as Session);

                vi.mocked(updateUserPassword).mockResolvedValue({
                    success: false,
                    error: '現在のパスワードが正しくありません。',
                });

                const formData = new FormData();
                formData.append('currentPassword', 'WrongPassword');
                formData.append('newPassword', 'NewPassword123');
                formData.append('confirmPassword', 'NewPassword123');

                const result = await changePassword(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure');
                expect(result.error).toBe('現在のパスワードが正しくありません。');
            });
        });
    });

    describe('deleteAccount', () => {
        describe('正常系', () => {
            it('正しいパスワードを入力して退会サービスを呼び出し、/deactivated へリダイレクトしてログアウトすること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' },
                } as unknown as Session);

                vi.mocked(deleteUserAccount).mockResolvedValue({
                    success: true,
                    message: '退会手続きが完了しました。',
                });

                const formData = new FormData();
                formData.append('password', 'MySecretPassword123');

                const result = await deleteAccount(undefined, formData);

                expect(deleteUserAccount).toHaveBeenCalledWith('user-1', 'MySecretPassword123');
                expect(signOut).toHaveBeenCalledWith({ redirectTo: '/deactivated' });
                expect(result.success).toBe(true);
                if (!result.success) throw new Error('Expected success');
                expect(result.message).toBe('退会手続きが完了しました。');
            });
        });

        describe('異常系', () => {
            it('未ログイン状態の場合はエラーを返し、退会サービスを呼ばないこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue(null);

                const formData = new FormData();
                formData.append('password', 'Password123');

                const result = await deleteAccount(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure');
                expect(result.error).toBe('ログインが必要です。');
                expect(deleteUserAccount).not.toHaveBeenCalled();
                expect(signOut).not.toHaveBeenCalled();
            });

            it('パスワードが間違っていてサービス層がエラーを返した場合、signOut は呼ばれないこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' },
                } as unknown as Session);

                vi.mocked(deleteUserAccount).mockResolvedValue({
                    success: false,
                    error: 'パスワードが正しくありません。',
                });

                const formData = new FormData();
                formData.append('password', 'WrongPassword');

                const result = await deleteAccount(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure');
                expect(result.error).toBe('パスワードが正しくありません。');
                expect(signOut).not.toHaveBeenCalled();
            });
        });
    });
});
