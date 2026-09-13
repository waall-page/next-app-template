import { describe, it, expect, vi, beforeEach } from 'vitest';
import { changeAdminPassword, adminSignOut, getAdminSessionData } from '@/app/actions/adminAuth';
import prisma from '@/lib/prisma';
import { auth, signOut } from '@/lib/auth';
import { verifyPassword, hashPassword } from '@/lib/hash';
import { Session } from 'next-auth';

// モックの設定
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
        admin: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

describe('adminAuth Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('changeAdminPassword', () => {
        describe('正常系', () => {
            it('管理者が正しい現在パスワードと有効な新パスワードでパスワードを更新できること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', role: 'admin' }
                } as unknown as Session);

                vi.mocked(prisma.admin.findUnique).mockResolvedValue({
                    id: 'admin-1',
                    passwordHash: 'hashed_old_admin_password',
                } as unknown as never);

                vi.mocked(verifyPassword).mockResolvedValue(true);
                vi.mocked(hashPassword).mockResolvedValue('hashed_new_admin_password');
                vi.mocked(prisma.admin.update).mockResolvedValue({
                    id: 'admin-1',
                } as unknown as never);

                const formData = new FormData();
                formData.append('currentPassword', 'AdminOldPass123');
                formData.append('newPassword', 'AdminNewPass123');
                formData.append('confirmPassword', 'AdminNewPass123');

                const result = await changeAdminPassword(undefined, formData);

                expect(verifyPassword).toHaveBeenCalledWith('AdminOldPass123', 'hashed_old_admin_password');
                expect(hashPassword).toHaveBeenCalledWith('AdminNewPass123');
                expect(prisma.admin.update).toHaveBeenCalledWith({
                    where: { id: 'admin-1' },
                    data: { passwordHash: 'hashed_new_admin_password' },
                });
                expect(result.success).toBe(true);
                if (!result.success) throw new Error(`Expected success, but got error: ${(result as { error?: string }).error}`);
                expect(result.message).toBe('パスワードを変更しました。');
            });

            it('新しいパスワードが境界値（8文字ジャスト）の場合に正常に更新できること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', role: 'admin' }
                } as unknown as Session);

                vi.mocked(prisma.admin.findUnique).mockResolvedValue({
                    id: 'admin-1',
                    passwordHash: 'hashed_old_admin_password',
                } as unknown as never);

                vi.mocked(verifyPassword).mockResolvedValue(true);
                vi.mocked(hashPassword).mockResolvedValue('hashed_8char_admin_password');
                vi.mocked(prisma.admin.update).mockResolvedValue({
                    id: 'admin-1',
                } as unknown as never);

                const formData = new FormData();
                formData.append('currentPassword', 'AdminOldPass123');
                formData.append('newPassword', 'Admin123'); // 8文字ジャスト
                formData.append('confirmPassword', 'Admin123');

                const result = await changeAdminPassword(undefined, formData);

                expect(hashPassword).toHaveBeenCalledWith('Admin123');
                expect(result.success).toBe(true);
            });
        });

        describe('異常系', () => {
            it('未ログイン状態の場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue(null);

                const formData = new FormData();
                formData.append('currentPassword', 'Pass123');
                formData.append('newPassword', 'NewPass123');
                formData.append('confirmPassword', 'NewPass123');

                const result = await changeAdminPassword(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('管理者としてログインが必要です。');
                expect(prisma.admin.update).not.toHaveBeenCalled();
            });

            it('ログイン中のユーザーが管理者権限（admin）を持たない場合は権限エラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' } // 一般ユーザー
                } as unknown as Session);

                const formData = new FormData();
                formData.append('currentPassword', 'Pass123');
                formData.append('newPassword', 'NewPass123');
                formData.append('confirmPassword', 'NewPass123');

                const result = await changeAdminPassword(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('管理者権限がありません。');
                expect(prisma.admin.update).not.toHaveBeenCalled();
            });

            it('現在の管理者パスワードが一致しない場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', role: 'admin' }
                } as unknown as Session);

                vi.mocked(prisma.admin.findUnique).mockResolvedValue({
                    id: 'admin-1',
                    passwordHash: 'hashed_old_admin_password',
                } as unknown as never);

                vi.mocked(verifyPassword).mockResolvedValue(false);

                const formData = new FormData();
                formData.append('currentPassword', 'WrongAdminPass');
                formData.append('newPassword', 'NewAdminPass123');
                formData.append('confirmPassword', 'NewAdminPass123');

                const result = await changeAdminPassword(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('現在のパスワードが正しくありません。');
                expect(prisma.admin.update).not.toHaveBeenCalled();
            });

            it('新しいパスワードが境界値（7文字）で8文字未満の場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', role: 'admin' }
                } as unknown as Session);

                const formData = new FormData();
                formData.append('currentPassword', 'AdminOldPass123');
                formData.append('newPassword', '1234567'); // 7文字境界値
                formData.append('confirmPassword', '1234567');

                const result = await changeAdminPassword(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('新しいパスワードは8文字以上で入力してください。');
                expect(prisma.admin.update).not.toHaveBeenCalled();
            });

            it('新しいパスワードと確認用が一致しない場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', role: 'admin' }
                } as unknown as Session);

                const formData = new FormData();
                formData.append('currentPassword', 'AdminOldPass123');
                formData.append('newPassword', 'NewAdminPass123');
                formData.append('confirmPassword', 'DifferentAdminPass123');

                const result = await changeAdminPassword(undefined, formData);

                expect(result.success).toBe(false);
                if (result.success) throw new Error('Expected failure, but got success');
                expect(result.error).toBe('新しいパスワードが確認用と一致しません。');
                expect(prisma.admin.update).not.toHaveBeenCalled();
            });
        });
    });

    describe('adminSignOut', () => {
        describe('正常系', () => {
            it('管理者がログアウト処理を呼び出せること', async () => {
                await adminSignOut();
                expect(signOut).toHaveBeenCalledWith({ redirectTo: '/admin/login' });
            });
        });
    });

    describe('getAdminSessionData', () => {
        describe('正常系', () => {
            it('ログイン中の管理者メールアドレスを正常に取得できること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' }
                } as unknown as Session);

                const result = await getAdminSessionData();
                expect(result.email).toBe('admin@example.com');
            });
        });

        describe('異常系', () => {
            it('未ログイン状態の場合は email: null を返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue(null);

                const result = await getAdminSessionData();
                expect(result.email).toBeNull();
            });

            it('一般ユーザー（role: user）の場合は email: null を返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', email: 'user@example.com', role: 'user' }
                } as unknown as Session);

                const result = await getAdminSessionData();
                expect(result.email).toBeNull();
            });
        });
    });
});
