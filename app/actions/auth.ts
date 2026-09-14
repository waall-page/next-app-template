'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

export interface AuthActionState {
    error: string | null;
}

/**
 * 一般ユーザーログイン Server Action
 */
export async function authenticate(
    _prevState: AuthActionState,
    formData: FormData
): Promise<AuthActionState> {
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        await signIn('credentials', {
            email,
            password,
            role: 'user',
            redirectTo: '/dashboard',
        });
        return { error: null };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return { error: 'メールアドレスまたはパスワードが正しくありません。' };
                default:
                    return { error: 'ログイン中にエラーが発生しました。時間をおいて再度お試しください。' };
            }
        }
        // NEXT_REDIRECT などのリダイレクト例外はそのままスロー
        throw error;
    }
}

/**
 * 管理者ログイン Server Action
 */
export async function authenticateAdmin(
    _prevState: AuthActionState,
    formData: FormData
): Promise<AuthActionState> {
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        await signIn('credentials', {
            email,
            password,
            role: 'admin',
            redirectTo: '/admin',
        });
        return { error: null };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return { error: 'メールアドレスまたはパスワードが正しくありません。' };
                default:
                    return { error: 'ログイン中にエラーが発生しました。時間をおいて再度お試しください。' };
            }
        }
        // NEXT_REDIRECT などのリダイレクト例外はそのままスロー
        throw error;
    }
}
