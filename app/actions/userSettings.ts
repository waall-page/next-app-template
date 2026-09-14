'use server';

import { auth, signOut } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
    deleteUserAccount,
} from '@/lib/services/userSettings';

export type ActionResponse =
    | { success: true; message: string }
    | { success: false; error: string };

export type UserSettingsDataResponse =
    | { success: true; data: { email: string; name: string | null } }
    | { success: false; error: string };

/**
 * ログインユーザーの設定画面用データを取得する Server Action
 */
export async function getUserSettingsData(): Promise<UserSettingsDataResponse> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    const result = await getUserProfile(session.user.id);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    return {
        success: true,
        data: {
            email: result.user.email,
            name: result.user.name,
        },
    };
}

/**
 * プロフィール（表示名）を更新する Server Action
 */
export async function updateProfile(
    _prevState: unknown,
    formData: FormData
): Promise<ActionResponse> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'ログインが必要です。' };
    }

    const name = formData.get('name');
    const nameStr = typeof name === 'string' ? name : null;

    const result = await updateUserProfile(session.user.id, nameStr);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    revalidatePath('/settings');
    revalidatePath('/dashboard');

    return {
        success: true,
        message: result.message,
    };
}

/**
 * パスワードを変更する Server Action
 */
export async function changePassword(
    _prevState: unknown,
    formData: FormData
): Promise<ActionResponse> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'ログインが必要です。' };
    }

    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (
        typeof currentPassword !== 'string' ||
        typeof newPassword !== 'string' ||
        typeof confirmPassword !== 'string'
    ) {
        return { success: false, error: '入力内容を確認してください。' };
    }

    if (newPassword !== confirmPassword) {
        return { success: false, error: '新しいパスワードが確認用と一致しません。' };
    }

    const result = await updateUserPassword(
        session.user.id,
        currentPassword,
        newPassword
    );

    if (!result.success) {
        return { success: false, error: result.error };
    }

    return {
        success: true,
        message: result.message,
    };
}

/**
 * アカウントを退会（削除）する Server Action
 */
export async function deleteAccount(
    _prevState: unknown,
    formData: FormData
): Promise<ActionResponse> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'ログインが必要です。' };
    }

    const password = formData.get('password');
    if (typeof password !== 'string') {
        return { success: false, error: 'パスワードを入力してください。' };
    }

    const result = await deleteUserAccount(session.user.id, password);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    // 退会成功時: セッションを破棄し、退会完了画面へ遷移
    await signOut({ redirectTo: '/deactivated' });

    return {
        success: true,
        message: result.message,
    };
}
