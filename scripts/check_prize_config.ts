import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const prizes = await prisma.prize.findMany({
    where: {
      name: {
        contains: '50% Off',
        mode: 'insensitive'
      }
    }
  });

  console.log('Prizes found:', JSON.stringify(prizes, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
