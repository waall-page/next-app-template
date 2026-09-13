import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '@/lib/hash';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding database...');
    const initialPassword = 'Template2026!';
    const passwordHash = await hashPassword(initialPassword);

    // Create Admin
    const adminEmail = 'admin@example.com';
    const admin = await prisma.admin.upsert({
        where: { email: adminEmail },
        update: {
            passwordHash: passwordHash,
        },
        create: {
            email: adminEmail,
            passwordHash: passwordHash,
        },
    });

    // Create User
    const userEmail = 'user@example.com';
    const user = await prisma.user.upsert({
        where: { email: userEmail },
        update: {
            passwordHash: passwordHash,
            status: 'ACTIVE',
        },
        create: {
            email: userEmail,
            passwordHash: passwordHash,
            status: 'ACTIVE',
        },
    });

    console.log('✅ データベースシード完了:');
    console.log(`- 管理者: ${admin.email} (Password: ${initialPassword})`);
    console.log(`- 一般ユーザー: ${user.email} (Password: ${initialPassword})`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
