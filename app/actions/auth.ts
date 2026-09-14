'use server';

import { signIn, signOut } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { isPublicRegistrationEnabled } from '@/lib/env';
import {
    registerUserViaInvitation,
    requestPublicRegistration,
} from '@/lib/services/registration';

export interface AuthActionState {
    error: string | null;
}

export type AuthActionResponse =
    | { success: true; message: string }
    | { success: false; error: string };

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

/**
 * 一般ユーザーのログアウトを行う Server Action
 */
export async function userSignOut(): Promise<void> {
    await signOut({ redirectTo: '/' });
}

/**
 * 自由登録の確認メールを送信する Server Action
 */
export async function requestRegistrationEmailAction(
    _prevState: unknown,
    formData: FormData
): Promise<AuthActionResponse> {
    if (!isPublicRegistrationEnabled()) {
        return {
            success: false,
            error: '現在、自由登録の受付は停止しております。',
        };
    }

    const email = formData.get('email');
    if (typeof email !== 'string' || !email.trim() || !email.includes('@')) {
        return {
            success: false,
            error: '有効なメールアドレスを入力してください。',
        };
    }

    const result = await requestPublicRegistration(email.trim());

    if (!result.success) {
        return {
            success: false,
            error: result.error,
        };
    }

    return {
        success: true,
        message: result.message,
    };
}

/**
 * 登録トークンを用いてパスワード設定・規約同意を行い、アカウントを開設する Server Action
 */
export async function registerUserAction(
    _prevState: unknown,
    formData: FormData
): Promise<AuthActionResponse> {
    const token = formData.get('token');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const agreedToTerms = formData.get('agreedToTerms');

    if (typeof token !== 'string' || !token.trim()) {
        return {
            success: false,
            error: '登録トークンが無効または存在しません。',
        };
    }

    if (typeof password !== 'string' || password.length < 8) {
        return {
            success: false,
            error: 'パスワードは8文字以上で入力してください。',
        };
    }

    if (password !== confirmPassword) {
        return {
            success: false,
            error: 'パスワードが確認用と一致しません。',
        };
    }

    if (agreedToTerms !== 'on' && agreedToTerms !== 'true') {
        return {
            success: false,
            error: '利用規約およびプライバシーポリシーへの同意が必要です。',
        };
    }

    const result = await registerUserViaInvitation({
        token: token.trim(),
        password,
        agreedToTerms: true,
    });

    if (!result.success) {
        return {
            success: false,
            error: result.error,
        };
    }

    return {
        success: true,
        message: 'アカウントの登録が完了しました。ログイン画面へ進んでください。',
    };
}
