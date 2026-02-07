#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const outDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const prefix = `prod-backup-${ts}`;

  console.log('Initializing Prisma client...');
  const prisma = new PrismaClient();

  try {
    console.log('Exporting tables to JSON...');
    const tables = [
      { name: 'campaigns', fn: () => prisma.campaign.findMany() },
      { name: 'prizes', fn: () => prisma.prize.findMany() },
      { name: 'spins', fn: () => prisma.spin.findMany() },
      { name: 'vouchers', fn: () => prisma.voucher.findMany() },
      { name: 'socialMediaTasks', fn: () => prisma.socialMediaTask.findMany() },
      { name: 'socialTaskCompletions', fn: () => prisma.socialTaskCompletion.findMany() },
      { name: 'landingPages', fn: () => prisma.landingPage.findMany() },
      { name: 'offerShowcases', fn: () => prisma.offerShowcase.findMany() },
      { name: 'landingPageSections', fn: () => prisma.landingPageSection.findMany() },
      { name: 'campaignFooters', fn: () => prisma.campaignFooter.findMany() },
      { name: 'managerAuditLogs', fn: () => prisma.managerAuditLog.findMany() },
      { name: 'endUsers', fn: () => prisma.endUser.findMany() },
      { name: 'tenants', fn: () => prisma.tenant.findMany() },
    ];

    for (const t of tables) {
      try {
        console.log(`Fetching ${t.name}...`);
        const rows = await t.fn();
        const outPath = path.join(outDir, `${prefix}-${t.name}.json`);
        fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf8');
        console.log(`Wrote ${rows.length} rows to ${outPath}`);
      } catch (err) {
        console.warn(`Skipping ${t.name}:`, err.message || err);
      }
    }

    console.log('Applying non-destructive SQL to add DeletionJob table if missing...');
    const createTable = `CREATE TABLE IF NOT EXISTS "DeletionJob" (
      id TEXT PRIMARY KEY,
      "campaignId" TEXT NOT NULL,
      "tenantId" TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attempts INTEGER NOT NULL DEFAULT 0,
      "lastError" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "startedAt" TIMESTAMPTZ,
      "processedAt" TIMESTAMPTZ
    );`;

    const createIndex1 = `CREATE INDEX IF NOT EXISTS "DeletionJob_status_createdAt_idx" ON "DeletionJob"(status, "createdAt");`;
    const createIndex2 = `CREATE INDEX IF NOT EXISTS "DeletionJob_campaignId_idx" ON "DeletionJob"("campaignId");`;

    // Execute statements separately to avoid prepared-statement multi-command error
    await prisma.$executeRawUnsafe(createTable);
    await prisma.$executeRawUnsafe(createIndex1);
    await prisma.$executeRawUnsafe(createIndex2);
    console.log('SQL applied successfully.');

    console.log('Backup and schema change completed. Files saved in backups/.');
  } catch (err) {
    console.error('Error during backup/apply:', err);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

