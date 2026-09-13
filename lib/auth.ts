import NextAuth, { Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import prisma from './prisma';
import { verifyPassword } from './hash';
import { redirect } from 'next/navigation';

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: 'Credentials',
            id: 'credentials', // Explicit ID can verify
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                role: { label: "Role", type: "text" }
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;
                const role = credentials.role as string;

                if (role === 'admin') {
                    const admin = await prisma.admin.findUnique({ where: { email } });
                    if (!admin) return null;

                    const isValid = await verifyPassword(password, admin.passwordHash);
                    if (!isValid) return null;

                    return { id: admin.id, email: admin.email, role: 'admin' };
                } else {
                    const user = await prisma.user.findUnique({ where: { email } });
                    if (!user) return null;

                    const isValid = await verifyPassword(password, user.passwordHash);
                    if (!isValid) return null;

                    return { id: user.id, email: user.email, role: 'user' };
                }
            }
        })
    ],
});

export async function requireAuth(): Promise<Session> {
    const session = await auth();
    if (!session || !session.user || !session.user.id || session.user.role !== 'user') {
        redirect('/login');
    }
    return session as Session;
}
