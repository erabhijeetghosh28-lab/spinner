import prisma from '../lib/prisma';

async function checkSpecificUser() {
    try {
        // Get all users sorted by successfulReferrals
        const users = await prisma.endUser.findMany({
            where: {
                tenant: {
                    slug: 'default'
                }
            },
            select: {
                id: true,
                name: true,
                phone: true,
                successfulReferrals: true,
                bonusSpinsEarned: true,
                referralCode: true,
                createdAt: true
            },
            orderBy: {
                successfulReferrals: 'desc'
            },
            take: 20
        });

        console.log('\n📊 ALL USERS (Top 20):');
        console.log('Total users found:', users.length);
        
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name || 'Anonymous'}`);
            console.log('   Phone:', user.phone);
            console.log('   Successful Referrals:', user.successfulReferrals);
            console.log('   Bonus Spins Earned:', user.bonusSpinsEarned);
            console.log('   Referral Code:', user.referralCode);
        });

        // Check if any user has 52 referrals
        const userWith52 = users.find(u => u.successfulReferrals === 52);
        if (userWith52) {
            console.log('\n🎯 FOUND USER WITH 52 REFERRALS:');
            console.log('Name:', userWith52.name);
            console.log('Phone:', userWith52.phone);
            console.log('Referral Code:', userWith52.referralCode);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSpecificUser();
