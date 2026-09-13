import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authenticate, authenticateAdmin, AuthActionState } from '@/app/actions/auth';
import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

vi.mock('@/lib/auth', () => ({
    signIn: vi.fn(),
}));

describe('auth Server Actions', () => {
    const initialState: AuthActionState = { error: null };

    beforeEach(() => {
        vi.clearAllMocks();
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
});
