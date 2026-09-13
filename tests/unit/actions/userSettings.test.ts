import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProfile, changePassword, deleteAccount, getUserSettingsData } from '@/app/actions/userSettings';
import prisma from '@/lib/prisma';
import { auth, signOut } from '@/lib/auth';
import { verifyPassword, hashPassword } from '@/lib/hash';
import { Session } from 'next-auth';

// モックの設定
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
    signOut: vi.fn(),
}));

vi.mock('@/lib/hash', () => ({
    verifyPassword: vi.fn(),
    hashPassword: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}));

describe('userSettings Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUserSettingsData', () => {
        describe('正常系', () => {
            it('ログインユーザーの設定画面用データ（表示名、メール）を正常に取得できること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', email: 'user1@example.com', role: 'user' }
                } as unknown as Session);

                vi.mocked(prisma.user.findUnique).mockResolvedValue({
                    id: 'user-1',
                    email: 'user1@example.com',
                    name: 'ユーザー名',
                } as unknown as never);

                const result = await getUserSettingsData();

                expect(result.success).toBe(true);
                if (!result.success) throw new Error(`Expected success, but got error: ${(result as { error?: string }).error}`);
                expect(result.data.email).toBe('user1@example.com');
                expect(result.data.name).toBe('ユーザー名');
            });

            it('表示名が未設定の場合、name: null で返ること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', email: 'user1@example.com', role: 'user' }
                } as unknown as Session);

                vi.mocked(prisma.user.findUnique).mockResolvedValue({
                    id: 'user-1',
                    email: 'user1@example.com',
                    name: null,
                } as unknown as never);

                const result = await getUserSettingsData();

                expect(result.success).toBe(true);
                if (!result.success) throw new Error(`Expected success, but got error: ${(result as { error?: string }).error}`);
                expect(result.data.email).toBe('user1@example.com');
                expect(result.data.name).toBeNull();
            });
        });

        describe('異常系', () => {
            it('未ログイン状態の場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue(null);

                const result = await getUserSettingsData();

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('Unauthorized');
                expect(prisma.user.findUnique).not.toHaveBeenCalled();
            });
        });
    });

    describe('updateProfile', () => {
        describe('正常系', () => {
            it('有効な表示名を入力して更新できること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' }
                } as unknown as Session);

                vi.mocked(prisma.user.update).mockResolvedValue({
                    id: 'user-1',
                    name: '新しい表示名',
                } as unknown as never);

                const formData = new FormData();
                formData.append('name', '新しい表示名');

                const result = await updateProfile(undefined, formData);

                expect(prisma.user.update).toHaveBeenCalledWith({
                    where: { id: 'user-1' },
                    data: { name: '新しい表示名' },
                });
                expect(result.success).toBe(true);
                if (!result.success) throw new Error(`Expected success, but got error: ${(result as { error?: string }).error}`);
                expect(result.message).toBe('プロフィールを更新しました。');
            });

            it('表示名が境界値（50文字ジャスト）の場合に正常に更新できること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' }
                } as unknown as Session);

                const exact50Name = 'あ'.repeat(50);
                vi.mocked(prisma.user.update).mockResolvedValue({
                    id: 'user-1',
                    name: exact50Name,
                } as unknown as never);

                const formData = new FormData();
                formData.append('name', exact50Name);

                const result = await updateProfile(undefined, formData);

                expect(prisma.user.update).toHaveBeenCalledWith({
                    where: { id: 'user-1' },
                    data: { name: exact50Name },
                });
                expect(result.success).toBe(true);
            });

            it('絵文字や特殊文字を含む表示名（例: 夏目 漱石 🐱）が正常に更新できること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' }
                } as unknown as Session);

                const emojiName = '夏目 漱石 🐱 ✨';
                vi.mocked(prisma.user.update).mockResolvedValue({
                    id: 'user-1',
                    name: emojiName,
                } as unknown as never);

                const formData = new FormData();
                formData.append('name', emojiName);

                const result = await updateProfile(undefined, formData);

                expect(prisma.user.update).toHaveBeenCalledWith({
                    where: { id: 'user-1' },
                    data: { name: emojiName },
                });
                expect(result.success).toBe(true);
            });

            it('表示名を空欄で送信した場合、nullとして未設定化できること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' }
                } as unknown as Session);

                vi.mocked(prisma.user.update).mockResolvedValue({
                    id: 'user-1',
                    name: null,
                } as unknown as never);

                const formData = new FormData();
                formData.append('name', '   '); // 空白のみ

                const result = await updateProfile(undefined, formData);

                expect(prisma.user.update).toHaveBeenCalledWith({
                    where: { id: 'user-1' },
                    data: { name: null },
                });
                expect(result.success).toBe(true);
            });
        });

        describe('異常系', () => {
            it('未ログイン状態の場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue(null);

                const formData = new FormData();
                formData.append('name', 'テスト');

                const result = await updateProfile(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('ログインが必要です。');
                expect(prisma.user.update).not.toHaveBeenCalled();
            });

            it('表示名が50文字を超えている場合（51文字・境界値）はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' }
                } as unknown as Session);

                const formData = new FormData();
                formData.append('name', 'あ'.repeat(51));

                const result = await updateProfile(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('表示名は50文字以内で入力してください。');
                expect(prisma.user.update).not.toHaveBeenCalled();
            });
        });
    });

    describe('changePassword', () => {
        describe('正常系', () => {
            it('正しい現在パスワードと有効な新パスワードで正常に更新できること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' }
                } as unknown as Session);

                vi.mocked(prisma.user.findUnique).mockResolvedValue({
                    id: 'user-1',
                    passwordHash: 'hashed_old_password',
                } as unknown as never);

                vi.mocked(verifyPassword).mockResolvedValue(true);
                vi.mocked(hashPassword).mockResolvedValue('hashed_new_password');
                vi.mocked(prisma.user.update).mockResolvedValue({
                    id: 'user-1',
                } as unknown as never);

                const formData = new FormData();
                formData.append('currentPassword', 'OldPassword123');
                formData.append('newPassword', 'NewPassword123');
                formData.append('confirmPassword', 'NewPassword123');

                const result = await changePassword(undefined, formData);

                expect(verifyPassword).toHaveBeenCalledWith('OldPassword123', 'hashed_old_password');
                expect(hashPassword).toHaveBeenCalledWith('NewPassword123');
                expect(prisma.user.update).toHaveBeenCalledWith({
                    where: { id: 'user-1' },
                    data: { passwordHash: 'hashed_new_password' },
                });
                expect(result.success).toBe(true);
                if (!result.success) throw new Error(`Expected success, but got error: ${(result as { error?: string }).error}`);
                expect(result.message).toBe('パスワードを変更しました。');
            });

            it('新しいパスワードが境界値（8文字ジャスト）の場合に正常に更新できること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' }
                } as unknown as Session);

                vi.mocked(prisma.user.findUnique).mockResolvedValue({
                    id: 'user-1',
                    passwordHash: 'hashed_old_password',
                } as unknown as never);

                vi.mocked(verifyPassword).mockResolvedValue(true);
                vi.mocked(hashPassword).mockResolvedValue('hashed_8char_password');
                vi.mocked(prisma.user.update).mockResolvedValue({
                    id: 'user-1',
                } as unknown as never);

                const formData = new FormData();
                formData.append('currentPassword', 'OldPassword123');
                formData.append('newPassword', '12345678'); // 8文字ジャスト
                formData.append('confirmPassword', '12345678');

                const result = await changePassword(undefined, formData);

                expect(hashPassword).toHaveBeenCalledWith('12345678');
                expect(result.success).toBe(true);
            });
        });

        describe('異常系', () => {
            it('未ログイン状態の場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue(null);

                const formData = new FormData();
                formData.append('currentPassword', 'Old123');
                formData.append('newPassword', 'New12345');
                formData.append('confirmPassword', 'New12345');

                const result = await changePassword(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('ログインが必要です。');
                expect(prisma.user.update).not.toHaveBeenCalled();
            });

            it('現在のパスワードが間違っている場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' }
                } as unknown as Session);

                vi.mocked(prisma.user.findUnique).mockResolvedValue({
                    id: 'user-1',
                    passwordHash: 'hashed_old_password',
                } as unknown as never);

                vi.mocked(verifyPassword).mockResolvedValue(false);

                const formData = new FormData();
                formData.append('currentPassword', 'WrongPassword');
                formData.append('newPassword', 'NewPassword123');
                formData.append('confirmPassword', 'NewPassword123');

                const result = await changePassword(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('現在のパスワードが正しくありません。');
                expect(prisma.user.update).not.toHaveBeenCalled();
            });

            it('新しいパスワードが境界値（7文字）で8文字未満の場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' }
                } as unknown as Session);

                const formData = new FormData();
                formData.append('currentPassword', 'OldPassword123');
                formData.append('newPassword', '1234567'); // 7文字境界値
                formData.append('confirmPassword', '1234567');

                const result = await changePassword(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('新しいパスワードは8文字以上で入力してください。');
                expect(prisma.user.update).not.toHaveBeenCalled();
            });

            it('新しいパスワードと確認用が一致しない場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' }
                } as unknown as Session);

                const formData = new FormData();
                formData.append('currentPassword', 'OldPassword123');
                formData.append('newPassword', 'NewPassword123');
                formData.append('confirmPassword', 'DifferentPassword123');

                const result = await changePassword(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('新しいパスワードが確認用と一致しません。');
                expect(prisma.user.update).not.toHaveBeenCalled();
            });
        });
    });

    describe('deleteAccount', () => {
        describe('正常系', () => {
            it('正しいパスワードを入力して正常に退会できること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' }
                } as unknown as Session);

                vi.mocked(prisma.user.findUnique).mockResolvedValue({
                    id: 'user-1',
                    passwordHash: 'hashed_password',
                } as unknown as never);

                vi.mocked(verifyPassword).mockResolvedValue(true);
                vi.mocked(prisma.user.delete).mockResolvedValue({
                    id: 'user-1',
                } as unknown as never);

                const formData = new FormData();
                formData.append('password', 'MySecretPassword123');

                const result = await deleteAccount(undefined, formData);

                expect(verifyPassword).toHaveBeenCalledWith('MySecretPassword123', 'hashed_password');
                expect(prisma.user.delete).toHaveBeenCalledWith({
                    where: { id: 'user-1' },
                });
                expect(signOut).toHaveBeenCalledWith({ redirectTo: '/' });
                expect(result.success).toBe(true);
                if (!result.success) throw new Error(`Expected success, but got error: ${(result as { error?: string }).error}`);
                expect(result.message).toBe('退会手続きが完了しました。');
            });
        });

        describe('異常系', () => {
            it('未ログイン状態の場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue(null);

                const formData = new FormData();
                formData.append('password', 'Password123');

                const result = await deleteAccount(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('ログインが必要です。');
                expect(prisma.user.delete).not.toHaveBeenCalled();
            });

            it('本人確認パスワードが一致しない場合はエラーになること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' }
                } as unknown as Session);

                vi.mocked(prisma.user.findUnique).mockResolvedValue({
                    id: 'user-1',
                    passwordHash: 'hashed_password',
                } as unknown as never);

                vi.mocked(verifyPassword).mockResolvedValue(false); // パスワード不一致

                const formData = new FormData();
                formData.append('password', 'WrongPassword');

                const result = await deleteAccount(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('パスワードが正しくありません。');
                expect(prisma.user.delete).not.toHaveBeenCalled();
            });
        });
    });
});
