import prisma from '../lib/prisma';

async function checkReferralData() {
    try {
        // Get the default tenant's campaign
        const tenant = await prisma.tenant.findUnique({
            where: { slug: 'default' }
        });

        if (!tenant) {
            console.log('❌ Tenant not found');
            return;
        }

        console.log('\n📊 TENANT INFO:');
        console.log('Tenant ID:', tenant.id);
        console.log('Tenant Slug:', tenant.slug);

        // Get active campaign
        const campaign = await prisma.campaign.findFirst({
            where: {
                tenantId: tenant.id,
                isActive: true
            }
        });

        if (!campaign) {
            console.log('❌ No active campaign found');
            return;
        }

        console.log('\n🎯 CAMPAIGN SETTINGS:');
        console.log('Campaign ID:', campaign.id);
        console.log('Campaign Name:', campaign.name);
        console.log('Referrals Required For Spin:', campaign.referralsRequiredForSpin);
        console.log('Referrals For Bonus:', campaign.referralsForBonus);
        console.log('Referral Bonus Spins:', campaign.referralBonusSpins);

        // Get all users with referrals
        const usersWithReferrals = await prisma.endUser.findMany({
            where: {
                tenantId: tenant.id,
                successfulReferrals: { gt: 0 }
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
            }
        });

        console.log('\n👥 USERS WITH REFERRALS:');
        console.log('Total users with referrals:', usersWithReferrals.length);
        
        if (usersWithReferrals.length > 0) {
            console.log('\nTop referrers:');
            usersWithReferrals.slice(0, 5).forEach((user, index) => {
                console.log(`\n${index + 1}. ${user.name || 'Anonymous'}`);
                console.log('   Phone:', user.phone);
                console.log('   Successful Referrals:', user.successfulReferrals);
                console.log('   Bonus Spins Earned:', user.bonusSpinsEarned);
                console.log('   Referral Code:', user.referralCode);
                console.log('   Created:', user.createdAt.toISOString());
            });
        }

        // Check if there are users referred by someone
        const referredUsers = await prisma.endUser.findMany({
            where: {
                tenantId: tenant.id,
                referredById: { not: null }
            },
            select: {
                id: true,
                name: true,
                phone: true,
                referredById: true,
                createdAt: true,
                referredBy: {
                    select: {
                        name: true,
                        phone: true,
                        referralCode: true
                    }
                }
            },
            take: 10
        });

        console.log('\n🔗 REFERRED USERS (Sample):');
        console.log('Total referred users:', referredUsers.length);
        
        if (referredUsers.length > 0) {
            referredUsers.forEach((user, index) => {
                console.log(`\n${index + 1}. ${user.name || 'Anonymous'} (${user.phone})`);
                console.log('   Referred by:', user.referredBy?.name || 'Unknown');
                console.log('   Referrer code:', user.referredBy?.referralCode);
                console.log('   Joined:', user.createdAt.toISOString());
            });
        }

        // Calculate referral progress for a sample user
        if (usersWithReferrals.length > 0) {
            const sampleUser = usersWithReferrals[0];
            const referralsRequired = campaign.referralsRequiredForSpin;
            const referralsProgress = referralsRequired > 0 
                ? sampleUser.successfulReferrals % referralsRequired 
                : 0;

            console.log('\n📈 SAMPLE USER REFERRAL CALCULATION:');
            console.log('User:', sampleUser.name);
            console.log('Total Successful Referrals:', sampleUser.successfulReferrals);
            console.log('Referrals Required Per Bonus:', referralsRequired);
            console.log('Current Progress:', referralsProgress, '/', referralsRequired);
            
            if (referralsRequired > 0) {
                const bonusesEarned = Math.floor(sampleUser.successfulReferrals / referralsRequired);
                console.log('Bonuses Earned from Referrals:', bonusesEarned);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkReferralData();
