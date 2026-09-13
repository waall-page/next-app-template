import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

async function main() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('❌ エラー: 環境変数 ADMIN_EMAIL と ADMIN_PASSWORD を指定してください。');
        console.error('使用例: ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="<Password>" npx tsx scripts/create-admin.ts');
        process.exit(1);
    }

    if (password.length < 8) {
        console.error('❌ エラー: ADMIN_PASSWORD は 8 文字以上で設定してください。');
        process.exit(1);
    }

    // 既に同メールアドレスの管理者が存在するか確認（冪等性の確保）
    const existingAdmin = await prisma.admin.findUnique({
        where: { email },
    });

    if (existingAdmin) {
        console.log(`ℹ️ 管理者アカウント (${email}) は既に存在します。スキップします。`);
        process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
        data: {
            email,
            passwordHash: hashedPassword,
        },
    });

    console.log(`✅ 管理者初期アカウントが正常に作成されました: ${admin.email} (ID: ${admin.id})`);
}

main()
    .catch((e) => {
        console.error('❌ 管理者アカウント作成中にエラーが発生しました:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
