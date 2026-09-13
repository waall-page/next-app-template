'use server';

export interface AuthActionState {
    error: string | null;
}

export async function authenticate(
    _prevState: AuthActionState,
    _formData: FormData
): Promise<AuthActionState> {
    return { error: null };
}

export async function authenticateAdmin(
    _prevState: AuthActionState,
    _formData: FormData
): Promise<AuthActionState> {
    return { error: null };
}
