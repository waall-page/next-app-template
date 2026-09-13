import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const userRole = auth?.user?.role;
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');
            const isUserAppRoute =
                nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/settings');

            // 1. 管理者画面 (/admin/*) の保護（プラン2: セキュリティ隠蔽型）
            if (isOnAdmin) {
                // 一般ユーザー (role === 'user') がアクセスした場合は 404 で管理画面の存在を完全隠蔽
                if (isLoggedIn && userRole === 'user') {
                    return new Response('Not Found', { status: 404 });
                }

                // 管理者ログイン画面へのアクセス制御
                if (nextUrl.pathname === '/admin/login') {
                    if (isLoggedIn && userRole === 'admin') {
                        return Response.redirect(new URL('/admin', nextUrl));
                    }
                    return true;
                }

                // 管理者画面は role === 'admin' のみ許可（未ログインは /admin/login へ）
                if (!isLoggedIn || userRole !== 'admin') {
                    return Response.redirect(new URL('/admin/login', nextUrl));
                }
                return true;
            }

            // 2. ユーザー専用アプリ画面 (/dashboard, /settings) の保護
            if (isUserAppRoute) {
                // 未ログインの場合はログイン画面へ
                if (!isLoggedIn) {
                    return false; // pages.signIn (/login) へリダイレクト
                }

                // 管理者がアクセスした場合はユーザー画面を遮断し、管理者画面へリダイレクト
                if (userRole === 'admin') {
                    return Response.redirect(new URL('/admin', nextUrl));
                }

                // 一般ユーザー (role === 'user') のみ許可
                return userRole === 'user';
            }

            // 3. 一般ユーザーログイン画面 (/login) へのアクセス制御
            if (nextUrl.pathname === '/login') {
                if (isLoggedIn) {
                    if (userRole === 'admin') {
                        return Response.redirect(new URL('/admin', nextUrl));
                    }
                    if (userRole === 'user') {
                        return Response.redirect(new URL('/dashboard', nextUrl));
                    }
                }
                return true;
            }

            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role ?? 'user';
                session.user.id = token.id ?? '';
            }
            return session;
        }
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
