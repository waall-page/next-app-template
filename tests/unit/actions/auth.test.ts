import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    authenticate,
    authenticateAdmin,
    userSignOut,
    requestRegistrationEmailAction,
    registerUserAction,
    AuthActionState,
} from '@/app/actions/auth';
import { signIn, signOut } from '@/lib/auth';
import { AuthError } from 'next-auth';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { isPublicRegistrationEnabled } from '@/lib/env';
import { registerUserViaInvitation } from '@/lib/services/registration';

vi.mock('@/lib/auth', () => ({
    signIn: vi.fn(),
    signOut: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
    sendEmail: vi.fn().mockResolvedValue({ messageId: 'mock-msg-id' }),
}));

vi.mock('@/lib/env', () => ({
    isPublicRegistrationEnabled: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/services/registration', () => ({
    registerUserViaInvitation: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
        },
        userInvitation: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}));

describe('auth Server Actions', () => {
    const initialState: AuthActionState = { error: null };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(isPublicRegistrationEnabled).mockReturnValue(true);
        process.env.APP_URL = 'http://test.local';
    });

    describe('authenticate (一般ユーザーログイン)', () => {
        describe('正常系', () => {
            it('role: "user" および redirectTo: "/dashboard" を指定して signIn が呼ばれ、error: null が返ること', async () => {
                vi.mocked(signIn).mockResolvedValue(undefined as never);

                const formData = new FormData();
                formData.append('email', 'user@example.com');
                formData.append('password', 'Template2026!');

                const result = await authenticate(initialState, formData);

                expect(signIn).toHaveBeenCalledWith('credentials', {
                    email: 'user@example.com',
                    password: 'Template2026!',
                    role: 'user',
                    redirectTo: '/dashboard',
                });
                expect(result).toEqual({ error: null });
            });
        });

        describe('異常系', () => {
            it('CredentialsSignin エラーの場合は「メールアドレスまたはパスワードが正しくありません。」が返ること', async () => {
                const authError = new AuthError('CredentialsSignin');
                authError.type = 'CredentialsSignin';
                vi.mocked(signIn).mockRejectedValue(authError);

                const formData = new FormData();
                formData.append('email', 'user@example.com');
                formData.append('password', 'wrongpassword');

                const result = await authenticate(initialState, formData);

                expect(result.error).toBe('メールアドレスまたはパスワードが正しくありません。');
            });

            it('その他の AuthError の場合は汎用エラーメッセージが返ること', async () => {
                const authError = new AuthError('OtherError');
                authError.type = 'CallbackRouteError' as never;
                vi.mocked(signIn).mockRejectedValue(authError);

                const formData = new FormData();
                formData.append('email', 'user@example.com');
                formData.append('password', 'password');

                const result = await authenticate(initialState, formData);

                expect(result.error).toBe('ログイン中にエラーが発生しました。時間をおいて再度お試しください。');
            });

            it('AuthError 以外の例外（リダイレクト例外等）はそのまま再スローされること', async () => {
                const redirectError = new Error('NEXT_REDIRECT');
                vi.mocked(signIn).mockRejectedValue(redirectError);

                const formData = new FormData();
                formData.append('email', 'user@example.com');
                formData.append('password', 'password');

                await expect(authenticate(initialState, formData)).rejects.toThrow('NEXT_REDIRECT');
            });
        });
    });

    describe('authenticateAdmin (管理者ログイン)', () => {
        describe('正常系', () => {
            it('role: "admin" および redirectTo: "/admin" を指定して signIn が呼ばれ、error: null が返ること', async () => {
                vi.mocked(signIn).mockResolvedValue(undefined as never);

                const formData = new FormData();
                formData.append('email', 'admin@example.com');
                formData.append('password', 'Template2026!');

                const result = await authenticateAdmin(initialState, formData);

                expect(signIn).toHaveBeenCalledWith('credentials', {
                    email: 'admin@example.com',
                    password: 'Template2026!',
                    role: 'admin',
                    redirectTo: '/admin',
                });
                expect(result).toEqual({ error: null });
            });
        });

        describe('異常系', () => {
            it('CredentialsSignin エラーの場合は「メールアドレスまたはパスワードが正しくありません。」が返ること', async () => {
                const authError = new AuthError('CredentialsSignin');
                authError.type = 'CredentialsSignin';
                vi.mocked(signIn).mockRejectedValue(authError);

                const formData = new FormData();
                formData.append('email', 'admin@example.com');
                formData.append('password', 'wrongpassword');

                const result = await authenticateAdmin(initialState, formData);

                expect(result.error).toBe('メールアドレスまたはパスワードが正しくありません。');
            });

            it('その他の AuthError の場合は汎用エラーメッセージが返ること', async () => {
                const authError = new AuthError('OtherError');
                authError.type = 'OAuthSignin' as never;
                vi.mocked(signIn).mockRejectedValue(authError);

                const formData = new FormData();
                formData.append('email', 'admin@example.com');
                formData.append('password', 'password');

                const result = await authenticateAdmin(initialState, formData);

                expect(result.error).toBe('ログイン中にエラーが発生しました。時間をおいて再度お試しください。');
            });

            it('AuthError 以外の例外（リダイレクト例外等）はそのまま再スローされること', async () => {
                const redirectError = new Error('NEXT_REDIRECT');
                vi.mocked(signIn).mockRejectedValue(redirectError);

                const formData = new FormData();
                formData.append('email', 'admin@example.com');
                formData.append('password', 'password');

                await expect(authenticateAdmin(initialState, formData)).rejects.toThrow('NEXT_REDIRECT');
            });
        });
    });

    describe('userSignOut (一般ログアウト)', () => {
        describe('正常系', () => {
            it('トップ画面 (/) を指定して signOut が呼ばれること', async () => {
                vi.mocked(signOut).mockResolvedValue(undefined as never);

                await userSignOut();

                expect(signOut).toHaveBeenCalledWith({ redirectTo: '/' });
            });
        });
    });

    describe('requestRegistrationEmailAction (自由登録確認メール送信)', () => {
        describe('正常系', () => {
            it('未登録の有効なメールアドレスの場合にトークンを発行し、メールを送信できること', async () => {
                vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
                vi.mocked(prisma.userInvitation.findFirst).mockResolvedValue(null);
                vi.mocked(prisma.userInvitation.create).mockResolvedValue({
                    id: 'inv-1',
                    email: 'newuser@example.com',
                    token: 'uuid-token',
                    expiresAt: new Date(),
                    status: 'PENDING',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                const formData = new FormData();
                formData.append('email', 'newuser@example.com');

                const result = await requestRegistrationEmailAction(null, formData);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.message).toContain('確認メールを送信しました');
                }
                expect(prisma.userInvitation.create).toHaveBeenCalled();
                expect(sendEmail).toHaveBeenCalledWith(
                    expect.objectContaining({
                        to: 'newuser@example.com',
                        subject: '【Template】アカウント登録のご案内',
                    })
                );
            });

            it('既に登録済みのユーザーの場合も列挙防止のため成功メッセージを返し、メール送信は行わないこと', async () => {
                vi.mocked(prisma.user.findUnique).mockResolvedValue({
                    id: 'user-1',
                    email: 'existing@example.com',
                    passwordHash: 'hash',
                    name: 'User',
                    status: 'ACTIVE',
                    termsAgreedVersion: '1.0',
                    termsAgreedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                const formData = new FormData();
                formData.append('email', 'existing@example.com');

                const result = await requestRegistrationEmailAction(null, formData);

                expect(result.success).toBe(true);
                expect(sendEmail).not.toHaveBeenCalled();
                expect(prisma.userInvitation.create).not.toHaveBeenCalled();
            });
        });

        describe('異常系', () => {
            it('自由登録が無効に設定されている場合はエラーを返すこと', async () => {
                vi.mocked(isPublicRegistrationEnabled).mockReturnValue(false);

                const formData = new FormData();
                formData.append('email', 'newuser@example.com');

                const result = await requestRegistrationEmailAction(null, formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('現在、自由登録の受付は停止しております。');
                }
                expect(sendEmail).not.toHaveBeenCalled();
            });

            it('メールアドレスが無効または空の場合はエラーを返すこと', async () => {
                const formData = new FormData();
                formData.append('email', 'invalid-email');

                const result = await requestRegistrationEmailAction(null, formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('有効なメールアドレスを入力してください。');
                }
                expect(sendEmail).not.toHaveBeenCalled();
            });
        });
    });

    describe('registerUserAction (本登録処理)', () => {
        describe('正常系', () => {
            it('有効なトークン、パスワード、規約同意で登録が成功すること', async () => {
                vi.mocked(registerUserViaInvitation).mockResolvedValue({
                    success: true,
                    message: 'アカウントの登録が完了しました。',
                    user: {
                        id: 'user-1',
                        email: 'user@example.com',
                        status: 'ACTIVE',
                    },
                });

                const formData = new FormData();
                formData.append('token', 'valid-token');
                formData.append('password', 'Password1234!');
                formData.append('confirmPassword', 'Password1234!');
                formData.append('agreedToTerms', 'on');

                const result = await registerUserAction(null, formData);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.message).toContain('アカウントの登録が完了しました');
                }
                expect(registerUserViaInvitation).toHaveBeenCalledWith({
                    token: 'valid-token',
                    password: 'Password1234!',
                    agreedToTerms: true,
                });
            });
        });

        describe('異常系', () => {
            it('トークンが存在しない場合はエラーを返すこと', async () => {
                const formData = new FormData();
                formData.append('token', '  ');
                formData.append('password', 'Password1234!');
                formData.append('confirmPassword', 'Password1234!');
                formData.append('agreedToTerms', 'on');

                const result = await registerUserAction(null, formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('登録トークンが無効または存在しません。');
                }
            });

            it('パスワードが8文字未満の場合はエラーを返すこと', async () => {
                const formData = new FormData();
                formData.append('token', 'valid-token');
                formData.append('password', 'short');
                formData.append('confirmPassword', 'short');
                formData.append('agreedToTerms', 'on');

                const result = await registerUserAction(null, formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('パスワードは8文字以上で入力してください。');
                }
            });

            it('パスワードと確認用が一致しない場合はエラーを返すこと', async () => {
                const formData = new FormData();
                formData.append('token', 'valid-token');
                formData.append('password', 'Password1234!');
                formData.append('confirmPassword', 'DifferentPassword1234!');
                formData.append('agreedToTerms', 'on');

                const result = await registerUserAction(null, formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('パスワードが確認用と一致しません。');
                }
            });

            it('利用規約に同意していない場合はエラーを返すこと', async () => {
                const formData = new FormData();
                formData.append('token', 'valid-token');
                formData.append('password', 'Password1234!');
                formData.append('confirmPassword', 'Password1234!');
                // agreedToTerms を付与しない

                const result = await registerUserAction(null, formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('利用規約およびプライバシーポリシーへの同意が必要です。');
                }
            });

            it('サービス層がエラーを返した場合はそのメッセージを返すこと', async () => {
                vi.mocked(registerUserViaInvitation).mockResolvedValue({
                    success: false,
                    message: '招待リンクの有効期限が切れています。',
                });

                const formData = new FormData();
                formData.append('token', 'expired-token');
                formData.append('password', 'Password1234!');
                formData.append('confirmPassword', 'Password1234!');
                formData.append('agreedToTerms', 'on');

                const result = await registerUserAction(null, formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBe('招待リンクの有効期限が切れています。');
                }
            });
        });
    });
});
