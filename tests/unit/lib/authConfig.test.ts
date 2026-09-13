import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authConfig } from '@/lib/auth.config';

describe('Auth Middleware Configuration (authorized callback)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const authorized = authConfig.callbacks?.authorized as (params: {
        auth: { user?: { id: string; email: string; role: string } } | null;
        request: { nextUrl: URL };
    }) => boolean | Response;

    describe('正常系', () => {
        it('一般ユーザー (role: user) が /dashboard にアクセスした場合は許可 (true) されること', () => {
            const nextUrl = new URL('http://test.local/dashboard');
            const result = authorized({
                auth: { user: { id: 'u1', email: 'user@example.com', role: 'user' } },
                request: { nextUrl },
            });

            expect(result).toBe(true);
        });

        it('一般ユーザー (role: user) が /settings にアクセスした場合は許可 (true) されること', () => {
            const nextUrl = new URL('http://test.local/settings');
            const result = authorized({
                auth: { user: { id: 'u1', email: 'user@example.com', role: 'user' } },
                request: { nextUrl },
            });
            expect(result).toBe(true);
        });

        it('管理者 (role: admin) が /admin にアクセスした場合は許可 (true) されること', () => {
            const nextUrl = new URL('http://test.local/admin');
            const result = authorized({
                auth: { user: { id: 'a1', email: 'admin@example.com', role: 'admin' } },
                request: { nextUrl },
            });

            expect(result).toBe(true);
        });

        it('未ログインユーザーが公開ページ (/terms, /privacy, /contact) にアクセスした場合は許可 (true) されること', () => {
            const urls = [
                'http://test.local/terms',
                'http://test.local/privacy',
                'http://test.local/contact',
            ];

            for (const url of urls) {
                const result = authorized({
                    auth: null,
                    request: { nextUrl: new URL(url) },
                });
                expect(result).toBe(true);
            }
        });
    });

    describe('異常系（認可ガード・ロール分離）', () => {
        it('未ログインユーザーが /dashboard にアクセスした場合は拒否 (false) されること', () => {
            const nextUrl = new URL('http://test.local/dashboard');
            const result = authorized({
                auth: null,
                request: { nextUrl },
            });

            expect(result).toBe(false);
        });

        it('管理者 (role: admin) が /dashboard にアクセスした場合は /admin へリダイレクトされること', () => {
            const nextUrl = new URL('http://test.local/dashboard');
            const result = authorized({
                auth: { user: { id: 'a1', email: 'admin@example.com', role: 'admin' } },
                request: { nextUrl },
            });

            expect(result).toBeInstanceOf(Response);
            const res = result as Response;
            expect(res.headers.get('location')).toBe('http://test.local/admin');
        });

        it('管理者 (role: admin) が /settings にアクセスした場合も /admin へリダイレクトされること', () => {
            const nextUrl = new URL('http://test.local/settings');
            const result = authorized({
                auth: { user: { id: 'a1', email: 'admin@example.com', role: 'admin' } },
                request: { nextUrl },
            });

            expect(result).toBeInstanceOf(Response);
            const res = result as Response;
            expect(res.headers.get('location')).toBe('http://test.local/admin');
        });

        it('一般ユーザー (role: user) が /admin にアクセスした場合は 404 (Not Found) で隠蔽されること', () => {
            const nextUrl = new URL('http://test.local/admin');
            const result = authorized({
                auth: { user: { id: 'u1', email: 'user@example.com', role: 'user' } },
                request: { nextUrl },
            });

            expect(result).toBeInstanceOf(Response);
            const res = result as Response;
            expect(res.status).toBe(404);
        });

        it('一般ユーザー (role: user) が /admin/login にアクセスした場合も 404 (Not Found) で隠蔽されること', () => {
            const nextUrl = new URL('http://test.local/admin/login');
            const result = authorized({
                auth: { user: { id: 'u1', email: 'user@example.com', role: 'user' } },
                request: { nextUrl },
            });

            expect(result).toBeInstanceOf(Response);
            const res = result as Response;
            expect(res.status).toBe(404);
        });

        it('未ログインユーザーが /admin にアクセスした場合は /admin/login へリダイレクトされること', () => {
            const nextUrl = new URL('http://test.local/admin');
            const result = authorized({
                auth: null,
                request: { nextUrl },
            });

            expect(result).toBeInstanceOf(Response);
            const res = result as Response;
            expect(res.headers.get('location')).toBe('http://test.local/admin/login');
        });

        it('ログイン済み管理者が /login にアクセスした場合は /admin へリダイレクトされること', () => {
            const nextUrl = new URL('http://test.local/login');
            const result = authorized({
                auth: { user: { id: 'a1', email: 'admin@example.com', role: 'admin' } },
                request: { nextUrl },
            });

            expect(result).toBeInstanceOf(Response);
            const res = result as Response;
            expect(res.headers.get('location')).toBe('http://test.local/admin');
        });

        it('ログイン済み一般ユーザーが /login にアクセスした場合は /dashboard へリダイレクトされること', () => {
            const nextUrl = new URL('http://test.local/login');
            const result = authorized({
                auth: { user: { id: 'u1', email: 'user@example.com', role: 'user' } },
                request: { nextUrl },
            });

            expect(result).toBeInstanceOf(Response);
            const res = result as Response;
            expect(res.headers.get('location')).toBe('http://test.local/dashboard');
        });
    });
});
