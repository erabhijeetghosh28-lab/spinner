import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReferralIssue() {
    console.log('=== REFERRAL SYSTEM DIAGNOSTIC ===\n');

    // Get the default tenant's active campaign
    const tenant = await prisma.tenant.findUnique({
        where: { slug: 'default' },
        include: {
            campaigns: {
                where: {
                    isActive: true,
                    isArchived: false
                },
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    if (!tenant || !tenant.campaigns[0]) {
        console.log('❌ No active campaign found');
        return;
    }

    const campaign = tenant.campaigns[0];
    
    console.log('📊 CAMPAIGN SETTINGS:');
    console.log(`Campaign Name: ${campaign.name}`);
    console.log(`Referrals Required For Spin: ${campaign.referralsRequiredForSpin}`);
    console.log(`Referrals For Bonus: ${campaign.referralsForBonus}`);
    console.log(`Referral Bonus Spins: ${campaign.referralBonusSpins}`);
    console.log('');

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
            referrals: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    createdAt: true
                }
            }
        },
        orderBy: { successfulReferrals: 'desc' }
    });

    console.log(`👥 USERS WITH REFERRALS: ${usersWithReferrals.length}`);
    console.log('');

    usersWithReferrals.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'Anonymous'} (${user.phone})`);
        console.log(`   Referral Code: ${user.referralCode}`);
        console.log(`   Successful Referrals: ${user.successfulReferrals}`);
        console.log(`   Bonus Spins Earned: ${user.bonusSpinsEarned}`);
        console.log(`   Referred Users (${user.referrals.length}):`);
        user.referrals.forEach((ref, i) => {
            console.log(`      ${i + 1}. ${ref.name || 'Anonymous'} (${ref.phone}) - ${ref.createdAt.toISOString()}`);
        });
        console.log('');
    });

    // Check if referral threshold is 0
    if (campaign.referralsRequiredForSpin === 0) {
        console.log('⚠️  ISSUE DETECTED:');
        console.log('   Referral threshold is set to 0, but UI is showing a number.');
        console.log('   This means the UI is using a different field or has a bug.');
        console.log('');
        console.log('   Possible causes:');
        console.log('   1. UI is reading "referralsForBonus" instead of "referralsRequiredForSpin"');
        console.log('   2. UI has hardcoded value');
        console.log('   3. Frontend is calculating incorrectly');
    }

    // Check WhatsApp referral tracking
    console.log('📱 WHATSAPP REFERRAL TRACKING:');
    console.log('   When a user shares their referral link:');
    console.log('   1. User gets unique referral code (stored in EndUser.referralCode)');
    console.log('   2. Link format: https://yoursite.com?ref=REFERRAL_CODE');
    console.log('   3. New user signs up with that link');
    console.log('   4. System finds referrer by referralCode');
    console.log('   5. Sets referredById on new user');
    console.log('   6. Increments successfulReferrals on referrer');
    console.log('   7. Checks if milestone reached (successfulReferrals % referralsForBonus === 0)');
    console.log('   8. Awards bonus spins if milestone reached');
    console.log('');

    await prisma.$disconnect();
}

checkReferralIssue().catch(console.error);
