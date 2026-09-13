import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// ESM / Edge Runtime 環境で __dirname が参照された場合のエラーを防止
declare global {
    var __dirname: string;
}

globalThis.__dirname ??= '';

export default NextAuth(authConfig).auth;

export const config = {
    // api, _next/static, _next/image, favicon.ico および 拡張子を持つ静的ファイル (check-ux.html など) を除外
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
