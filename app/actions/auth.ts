'use server';

import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { signIn, signOut } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { sendEmail } from '@/lib/email';
import { isPublicRegistrationEnabled } from '@/lib/env';
import { registerUserViaInvitation } from '@/lib/services/registration';

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

    const normalizedEmail = email.trim().toLowerCase();

    // 既存アカウントの確認 (アカウント列挙攻撃対策: 画面表示は同一の成功を返す)
    const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (existingUser) {
        return {
            success: true,
            message: '確認メールを送信しました。メールに記載されたリンクから登録を完了してください。',
        };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const existingInvitation = await prisma.userInvitation.findFirst({
        where: { email: normalizedEmail, status: 'PENDING' },
    });

    if (existingInvitation) {
        await prisma.userInvitation.update({
            where: { id: existingInvitation.id },
            data: { token, expiresAt },
        });
    } else {
        await prisma.userInvitation.create({
            data: {
                email: normalizedEmail,
                token,
                expiresAt,
                status: 'PENDING',
            },
        });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const registrationUrl = `${appUrl}/register?token=${token}`;

    await sendEmail({
        to: normalizedEmail,
        subject: '【Template】アカウント登録のご案内',
        text: `サービスへの登録ありがとうございます。\n\n以下のリンクをクリックして、パスワードの設定および利用規約への同意を行ってアカウント登録を完了してください。\n\n${registrationUrl}\n\n※このリンクの有効期限は24時間です。`,
        html: `<p>サービスへの登録ありがとうございます。</p><p>以下のリンクをクリックして、パスワードの設定および利用規約への同意を行ってアカウント登録を完了してください。</p><p><a href="${registrationUrl}">${registrationUrl}</a></p><p><small>※このリンクの有効期限は24時間です。</small></p>`,
    });

    return {
        success: true,
        message: '確認メールを送信しました。メールに記載されたリンクから登録を完了してください。',
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
            error: result.message ?? 'アカウント登録に失敗しました。',
        };
    }

    return {
        success: true,
        message: 'アカウントの登録が完了しました。ログイン画面へ進んでください。',
    };
}
