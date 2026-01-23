import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verifying Super Admin accounts...\n');

    const admins = await prisma.admin.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            isSuperAdmin: true,
            createdAt: true,
        },
    });

    console.log(`Found ${admins.length} admin account(s):\n`);

    admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Is Super Admin: ${admin.isSuperAdmin ? '✅ YES' : '❌ NO'}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log('');
    });

    const superAdmins = admins.filter(a => a.isSuperAdmin);
    console.log(`\n📊 Summary:`);
    console.log(`   Total Admins: ${admins.length}`);
    console.log(`   Super Admins: ${superAdmins.length}`);
    
    if (superAdmins.length === 0) {
        console.log('\n⚠️  WARNING: No Super Admin accounts found!');
        console.log('   Run: npm run seed');
    } else {
        console.log('\n✅ Super Admin accounts verified!');
    }
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
