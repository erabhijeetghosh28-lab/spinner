#!/usr/bin/env node
/**
 * enqueue-old-archives.js
 *
 * Finds campaigns archived more than 1 year ago and enqueues a DeletionJob
 * for each (if not already pending). Designed to be run nightly by your
 * process manager or CI scheduler (no cron required here).
 *
 * Usage:
 *   node scripts/enqueue-old-archives.js        # run default (not dry)
 *   node scripts/enqueue-old-archives.js --dry  # preview only
 *   node scripts/enqueue-old-archives.js --limit=100
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 500;

  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  console.log(`Searching for campaigns archived before ${cutoff.toISOString()} (limit ${limit})`);

  const campaigns = await prisma.campaign.findMany({
    where: {
      isArchived: true,
      archivedAt: { lt: cutoff }
    },
    select: { id: true, tenantId: true, archivedAt: true },
    take: limit
  });

  console.log(`Found ${campaigns.length} candidate(s).`);

  let enqueued = 0;
  for (const c of campaigns) {
    const existing = await prisma.deletionJob.findFirst({
      where: {
        campaignId: c.id,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    if (existing) {
      console.log(`Skipping ${c.id} (already queued/in-progress)`);
      continue;
    }

    console.log(`Will enqueue deletion job for campaign ${c.id} (archivedAt=${c.archivedAt})`);
    if (!dryRun) {
      await prisma.deletionJob.create({
        data: {
          campaignId: c.id,
          tenantId: c.tenantId,
          status: 'PENDING'
        }
      });
      enqueued++;
    }
  }

  console.log(dryRun ? 'Dry run complete.' : `Enqueued ${enqueued} job(s).`);
}

main()
  .catch(err => {
    console.error('Error running enqueue-old-archives:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

