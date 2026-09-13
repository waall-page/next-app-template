'use server';

export type ActionResponse =
    | { success: true; message: string }
    | { success: false; error: string };

export async function changeAdminPassword(
    _prevState: unknown,
    _formData: FormData
): Promise<ActionResponse> {
    return { success: true, message: 'パスワードを更新しました。' };
}

export async function adminSignOut(): Promise<void> {
    // stub
}

export async function getAdminSessionData(): Promise<{ email: string | null }> {
    return { email: null };
}
