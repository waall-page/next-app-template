'use server';

export type ActionResponse =
    | { success: true; message: string }
    | { success: false; error: string };

export type UserSettingsDataResponse =
    | { success: true; data: { email: string; name: string | null } }
    | { success: false; error: string };

export async function updateProfile(
    _prevState: unknown,
    _formData: FormData
): Promise<ActionResponse> {
    return { success: true, message: 'プロフィールを更新しました。' };
}

export async function changePassword(
    _prevState: unknown,
    _formData: FormData
): Promise<ActionResponse> {
    return { success: true, message: 'パスワードを変更しました。' };
}

export async function deleteAccount(
    _prevState: unknown,
    _formData: FormData
): Promise<ActionResponse> {
    return { success: true, message: '退会手続きが完了しました。' };
}

export async function getUserSettingsData(): Promise<UserSettingsDataResponse> {
    return {
        success: true,
        data: {
            email: 'user@example.com',
            name: null,
        },
    };
}
