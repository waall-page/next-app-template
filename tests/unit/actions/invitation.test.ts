import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    inviteUserAction,
    resendInvitationAction,
    cancelInvitationAction,
    getInvitations,
} from '@/app/actions/invitation';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
    inviteUser,
    resendInvitation,
    cancelInvitation,
} from '@/lib/services/invitation';
import { isInvitationEnabled } from '@/lib/env';
import { revalidatePath } from 'next/cache';
import { Session } from 'next-auth';

vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
    isInvitationEnabled: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/services/invitation', () => ({
    inviteUser: vi.fn(),
    resendInvitation: vi.fn(),
    cancelInvitation: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
    default: {
        userInvitation: {
            findMany: vi.fn(),
        },
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

describe('invitation Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(isInvitationEnabled).mockReturnValue(true);
    });

    describe('inviteUserAction', () => {
        describe('正常系', () => {
            it('管理者が有効なメールアドレスを指定して招待メールを送信できること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', role: 'admin' },
                } as unknown as Session);

                vi.mocked(inviteUser).mockResolvedValue({
                    success: true,
                    message: '招待メールを送信しました。',
                    invitation: {
                        id: 'inv-1',
                        email: 'user@example.com',
                        token: 'tok-1',
                        expiresAt: new Date(),
                    },
                });

                const formData = new FormData();
                formData.set('email', 'user@example.com');

                const result = await inviteUserAction(null, formData);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.message).toBe('招待メールを送信しました。');
                }
                expect(inviteUser).toHaveBeenCalledWith('user@example.com');
                expect(revalidatePath).toHaveBeenCalledWith('/admin/invitations');
            });
        });

        describe('異常系', () => {
            it('未ログインの場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue(null);

                const formData = new FormData();
                formData.set('email', 'user@example.com');

                const result = await inviteUserAction(null, formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('管理者としてログインが必要です。');
                }
                expect(inviteUser).not.toHaveBeenCalled();
            });

            it('管理者以外のロール（一般ユーザー）の場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' },
                } as unknown as Session);

                const formData = new FormData();
                formData.set('email', 'user@example.com');

                const result = await inviteUserAction(null, formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('管理者権限がありません。');
                }
                expect(inviteUser).not.toHaveBeenCalled();
            });

            it('メールアドレスが空の場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', role: 'admin' },
                } as unknown as Session);

                const formData = new FormData();
                formData.set('email', '   ');

                const result = await inviteUserAction(null, formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('メールアドレスを入力してください。');
                }
                expect(inviteUser).not.toHaveBeenCalled();
            });

            it('招待機能が無効に設定されている場合はエラーを返すこと', async () => {
                vi.mocked(isInvitationEnabled).mockReturnValue(false);

                const formData = new FormData();
                formData.set('email', 'user@example.com');

                const result = await inviteUserAction(null, formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toContain('招待機能は無効に設定されています');
                }
                expect(inviteUser).not.toHaveBeenCalled();
            });

            it('サービス層で招待送信に失敗した場合はそのエラーメッセージを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', role: 'admin' },
                } as unknown as Session);

                vi.mocked(inviteUser).mockResolvedValue({
                    success: false,
                    error: 'このメールアドレスは既に登録されています。',
                });

                const formData = new FormData();
                formData.set('email', 'registered@example.com');

                const result = await inviteUserAction(null, formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('このメールアドレスは既に登録されています。');
                }
            });
        });
    });

    describe('resendInvitationAction', () => {
        describe('正常系', () => {
            it('管理者が既存の招待案内を再送信できること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', role: 'admin' },
                } as unknown as Session);

                vi.mocked(resendInvitation).mockResolvedValue({
                    success: true,
                    message: '招待メールを再送信しました。',
                    invitation: {
                        id: 'inv-1',
                        email: 'user@example.com',
                        token: 'tok-1',
                        expiresAt: new Date(),
                    },
                });

                const result = await resendInvitationAction('inv-1');

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.message).toBe('招待メールを再送信しました。');
                }
                expect(resendInvitation).toHaveBeenCalledWith('inv-1');
                expect(revalidatePath).toHaveBeenCalledWith('/admin/invitations');
            });
        });

        describe('異常系', () => {
            it('招待機能が無効に設定されている場合はエラーを返すこと', async () => {
                vi.mocked(isInvitationEnabled).mockReturnValue(false);

                const result = await resendInvitationAction('inv-1');

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('現在、招待機能は無効に設定されています。');
                }
                expect(resendInvitation).not.toHaveBeenCalled();
            });

            it('非管理者が再送信を試みた場合は権限エラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' },
                } as unknown as Session);

                const result = await resendInvitationAction('inv-1');

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('管理者権限がありません。');
                }
                expect(resendInvitation).not.toHaveBeenCalled();
            });

            it('サービス層で再送信に失敗した場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', role: 'admin' },
                } as unknown as Session);

                vi.mocked(resendInvitation).mockResolvedValue({
                    success: false,
                    error: '招待が見つかりません。',
                });

                const result = await resendInvitationAction('inv-invalid');

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('招待が見つかりません。');
                }
            });
        });
    });

    describe('cancelInvitationAction', () => {
        describe('正常系', () => {
            it('管理者が招待を取り消すことができること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', role: 'admin' },
                } as unknown as Session);

                vi.mocked(cancelInvitation).mockResolvedValue({
                    success: true,
                    message: '招待を取り消しました。',
                });

                const result = await cancelInvitationAction('inv-1');

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.message).toBe('招待を取り消しました。');
                }
                expect(cancelInvitation).toHaveBeenCalledWith('inv-1');
                expect(revalidatePath).toHaveBeenCalledWith('/admin/invitations');
            });
        });

        describe('異常系', () => {
            it('非管理者が取り消しを試みた場合は権限エラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' },
                } as unknown as Session);

                const result = await cancelInvitationAction('inv-1');

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('管理者権限がありません。');
                }
                expect(cancelInvitation).not.toHaveBeenCalled();
            });

            it('サービス層で取り消しに失敗した場合はエラーを返すこと', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', role: 'admin' },
                } as unknown as Session);

                vi.mocked(cancelInvitation).mockResolvedValue({
                    success: false,
                    error: '招待が見つかりません。',
                });

                const result = await cancelInvitationAction('inv-invalid');

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('招待が見つかりません。');
                }
            });
        });
    });

    describe('getInvitations', () => {
        describe('正常系', () => {
            it('管理者の場合に招待一覧を返却すること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'admin-1', role: 'admin' },
                } as unknown as Session);

                const mockInvitations = [
                    {
                        id: 'inv-1',
                        email: 'test1@example.com',
                        token: 'tok-1',
                        expiresAt: new Date(),
                        status: 'PENDING',
                        createdAt: new Date(),
                    },
                ];

                vi.mocked(prisma.userInvitation.findMany).mockResolvedValue(
                    mockInvitations as unknown as Awaited<ReturnType<typeof prisma.userInvitation.findMany>>
                );

                const result = await getInvitations();

                expect(result).toHaveLength(1);
                expect(result[0].id).toBe('inv-1');
            });
        });

        describe('異常系', () => {
            it('非管理者の場合は空配列を返却すること', async () => {
                vi.mocked(auth as () => Promise<Session | null>).mockResolvedValue({
                    user: { id: 'user-1', role: 'user' },
                } as unknown as Session);

                const result = await getInvitations();

                expect(result).toEqual([]);
                expect(prisma.userInvitation.findMany).not.toHaveBeenCalled();
            });
        });
    });
});
