import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

/**
 * Next.js 16+ Proxy File Convention
 *
 * Next.js 16 以降、従来の middleware.ts は非推奨化され proxy.ts に移行されました。
 * 将来互換性を担保するため、公式が推奨する Named Export (`proxy`) と
 * バンドラー・過渡期互換のための Default Export の両方を提供しています。
 */
export const { auth: proxy } = NextAuth(authConfig);
export default proxy;

export const config = {
    // api, _next/static, _next/image, favicon.ico および 拡張子を持つ静的ファイルを除外
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

