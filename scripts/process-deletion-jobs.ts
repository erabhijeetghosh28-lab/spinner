#!/usr/bin/env ts-node
import prisma from '../lib/prisma';

async function processJobs(limit = 10) {
    console.log('Starting deletion job processor...');
    for (let i = 0; i < limit; i++) {
        const job = await prisma.deletionJob.findFirst({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'asc' }
        });
        if (!job) {
            console.log('No pending jobs. Exiting.');
            return;
        }

        console.log(`Processing job ${job.id} (campaign: ${job.campaignId})`);
        await prisma.deletionJob.update({
            where: { id: job.id },
            data: { status: 'IN_PROGRESS', startedAt: new Date(), attempts: { increment: 1 } }
        });

        try {
            const campaignId = job.campaignId;

            // 1) Landing page and related content (if any)
            const landingPage = await prisma.landingPage.findUnique({
                where: { campaignId }
            });

            if (landingPage) {
                await prisma.campaignFooter.deleteMany({
                    where: { landingPageId: landingPage.id }
                });
                await prisma.offerShowcase.deleteMany({
                    where: { landingPageId: landingPage.id }
                });
                await prisma.landingPageSection.deleteMany({
                    where: { landingPageId: landingPage.id }
                });
                await prisma.landingPage.delete({
                    where: { id: landingPage.id }
                });
            }

            // 2) Vouchers (must be removed before spins/prizes due to FK)
            await prisma.voucher.deleteMany({
                where: {
                    spin: {
                        campaignId
                    }
                }
            });

            // 3) Social tasks and their completions + related audit logs
            const socialTasks = await prisma.socialMediaTask.findMany({
                where: { campaignId },
                select: { id: true }
            });

            if (socialTasks.length > 0) {
                const taskIds = socialTasks.map(t => t.id);

                const completions = await prisma.socialTaskCompletion.findMany({
                    where: { taskId: { in: taskIds } },
                    select: { id: true }
                });

                if (completions.length > 0) {
                    const completionIds = completions.map(c => c.id);
                    await prisma.managerAuditLog.deleteMany({
                        where: { taskCompletionId: { in: completionIds } }
                    });

                    await prisma.socialTaskCompletion.deleteMany({
                        where: { id: { in: completionIds } }
                    });
                }
            }

            // Delete social media tasks
            await prisma.socialMediaTask.deleteMany({
                where: { campaignId }
            });

            // 4) Spins
            await prisma.spin.deleteMany({
                where: { campaignId }
            });

            // 5) Prizes
            await prisma.prize.deleteMany({
                where: { campaignId }
            });

            // 6) Finally delete the campaign
            await prisma.campaign.delete({
                where: { id: campaignId }
            });

            await prisma.deletionJob.update({
                where: { id: job.id },
                data: { status: 'COMPLETED', processedAt: new Date() }
            });

            console.log(`Job ${job.id} completed.`);
        } catch (err: any) {
            console.error(`Job ${job.id} failed:`, err);
            await prisma.deletionJob.update({
                where: { id: job.id },
                data: {
                    status: 'FAILED',
                    lastError: err?.message || String(err),
                    processedAt: new Date()
                }
            });
        }
    }
}

if (require.main === module) {
    const limitArg = parseInt(process.argv[2] || '10', 10);
    processJobs(limitArg)
        .catch((e) => {
            console.error('Processor encountered an error:', e);
        })
        .finally(async () => {
            await prisma.$disconnect();
            process.exit(0);
        });
}

export default processJobs;

