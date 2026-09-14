'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
    inviteUser,
    resendInvitation,
    cancelInvitation,
} from '@/lib/services/invitation';
import { isInvitationEnabled } from '@/lib/env';
import { revalidatePath } from 'next/cache';

export type InvitationActionResponse =
    | { success: true; message: string }
    | { success: false; error: string };

/**
 * 管理者が新規ユーザーに招待メールを送信する Server Action
 */
export async function inviteUserAction(
    _prevState: unknown,
    formData: FormData
): Promise<InvitationActionResponse> {
    if (!isInvitationEnabled()) {
        return {
            success: false,
            error: '現在、招待機能は無効に設定されています（自由登録制で稼働中）。',
        };
    }

    const session = await auth();

    if (!session?.user) {
        return { success: false, error: '管理者としてログインが必要です。' };
    }

    if (session.user.role !== 'admin') {
        return { success: false, error: '管理者権限がありません。' };
    }

    const email = formData.get('email');
    if (typeof email !== 'string' || !email.trim()) {
        return { success: false, error: 'メールアドレスを入力してください。' };
    }

    const result = await inviteUser(email.trim());

    if (!result.success) {
        return { success: false, error: result.error };
    }

    revalidatePath('/admin/invitations');
    return { success: true, message: result.message };
}

/**
 * 招待案内を再送信する Server Action
 */
export async function resendInvitationAction(
    invitationId: string
): Promise<InvitationActionResponse> {
    if (!isInvitationEnabled()) {
        return {
            success: false,
            error: '現在、招待機能は無効に設定されています。',
        };
    }

    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
        return { success: false, error: '管理者権限がありません。' };
    }

    const result = await resendInvitation(invitationId);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    revalidatePath('/admin/invitations');
    return { success: true, message: result.message };
}

/**
 * 招待を取り消す Server Action
 */
export async function cancelInvitationAction(
    invitationId: string
): Promise<InvitationActionResponse> {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
        return { success: false, error: '管理者権限がありません。' };
    }

    const result = await cancelInvitation(invitationId);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    revalidatePath('/admin/invitations');
    return { success: true, message: result.message };
}

export interface InvitationItem {
    id: string;
    email: string;
    token: string;
    expiresAt: Date;
    status: string;
    createdAt: Date;
}

/**
 * 招待一覧を取得する Server Action (Server Component からも利用可能)
 */
export async function getInvitations(): Promise<InvitationItem[]> {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
        return [];
    }

    const invitations = await prisma.userInvitation.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return invitations;
}
