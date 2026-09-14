'use server';

import prisma from '@/lib/prisma';
import { auth, signOut } from '@/lib/auth';
import { verifyPassword, hashPassword } from '@/lib/hash';

export type ActionResponse =
    | { success: true; message: string }
    | { success: false; error: string };

/**
 * 管理者のパスワードを変更する Server Action
 */
export async function changeAdminPassword(
    _prevState: unknown,
    formData: FormData
): Promise<ActionResponse> {
    const session = await auth();

    if (!session?.user) {
        return { success: false, error: '管理者としてログインが必要です。' };
    }

    if (session.user.role !== 'admin') {
        return { success: false, error: '管理者権限がありません。' };
    }

    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (typeof currentPassword !== 'string' || !currentPassword) {
        return { success: false, error: '現在のパスワードを入力してください。' };
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return { success: false, error: '新しいパスワードは8文字以上で入力してください。' };
    }

    if (newPassword !== confirmPassword) {
        return { success: false, error: '新しいパスワードが確認用と一致しません。' };
    }

    const admin = await prisma.admin.findUnique({
        where: { id: session.user.id },
    });

    if (!admin) {
        return { success: false, error: '管理者アカウントが見つかりません。' };
    }

    const isPasswordValid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!isPasswordValid) {
        return { success: false, error: '現在のパスワードが正しくありません。' };
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.admin.update({
        where: { id: session.user.id },
        data: { passwordHash: newPasswordHash },
    });

    return { success: true, message: 'パスワードを変更しました。' };
}

/**
 * 管理者のログアウトを行う Server Action
 */
export async function adminSignOut(): Promise<void> {
    await signOut({ redirectTo: '/admin/login' });
}

/**
 * ログイン中管理者のセッション情報を取得する Server Action
 */
export async function getAdminSessionData(): Promise<{ email: string | null }> {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
        return { email: null };
    }

    return { email: session.user.email ?? null };
}
