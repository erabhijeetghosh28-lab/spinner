#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.deletionJob.count();
    console.log('DeletionJob rows:', count);
  } catch (err) {
    console.error('Error querying DeletionJob:', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

