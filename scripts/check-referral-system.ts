import prisma from '../lib/prisma';

async function checkReferralSystem() {
    console.log('=== REFERRAL SYSTEM DIAGNOSTIC ===\n');

    // Get the default tenant's campaign
    const campaign = await prisma.campaign.findFirst({
        where: {
            tenant: { slug: 'default' },
            isActive: true
        },
        include: {
            tenant: true
        }
    });

    if (!campaign) {
        console.log('❌ No active campaign found');
        return;
    }

    console.log('📋 Campaign Settings:');
    console.log(`   Name: ${campaign.name}`);
    console.log(`   Referral Threshold (referralsRequiredForSpin): ${campaign.referralsRequiredForSpin}`);
    console.log(`   Referrals For Bonus (referralsForBonus): ${campaign.referralsForBonus}`);
    console.log(`   Referral Bonus Spins: ${campaign.referralBonusSpins}`);
    console.log('');

    // Get all users with referrals
    const usersWithReferrals = await prisma.endUser.findMany({
        where: {
            tenantId: campaign.tenantId,
            successfulReferrals: { gt: 0 }
        },
        select: {
            id: true,
            name: true,
            phone: true,
            successfulReferrals: true,
            bonusSpinsEarned: true,
            referralCode: true,
            _count: {
                select: {
                    referrals: true // Count of users who used this user's referral code
                }
            }
        },
        orderBy: {
            successfulReferrals: 'desc'
        }
    });

    console.log(`👥 Users with Referrals: ${usersWithReferrals.length}`);
    console.log('');

    for (const user of usersWithReferrals) {
        console.log(`User: ${user.name || 'Anonymous'} (${user.phone})`);
        console.log(`   Referral Code: ${user.referralCode}`);
        console.log(`   Successful Referrals (DB field): ${user.successfulReferrals}`);
        // @ts-ignore
        console.log(`   Actual Referred Users Count: ${user._count?.referrals}`);
        console.log(`   Bonus Spins Earned: ${user.bonusSpinsEarned}`);
        
        // Calculate what the UI would show
        const referralsRequired = campaign.referralsRequiredForSpin;
        const referralsProgress = referralsRequired > 0 
            ? user.successfulReferrals % referralsRequired 
            : user.successfulReferrals;
        
        console.log(`   UI Display (Progress): ${referralsProgress}/${referralsRequired > 0 ? referralsRequired : 0}`);
        console.log('');
    }

    // Check for any users who were referred
    const referredUsers = await prisma.endUser.findMany({
        where: {
            tenantId: campaign.tenantId,
            referredById: { not: null }
        },
        include: {
            referredBy: {
                select: {
                    name: true,
                    phone: true,
                    referralCode: true
                }
            }
        }
    });

    console.log(`🔗 Total Referred Users: ${referredUsers.length}`);
    console.log('');

    for (const user of referredUsers) {
        console.log(`${user.name || 'Anonymous'} was referred by ${user.referredBy?.name || 'Unknown'} (${user.referredBy?.referralCode})`);
    }

    await prisma.$disconnect();
}

checkReferralSystem().catch(console.error);
