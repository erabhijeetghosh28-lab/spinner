const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.tenantAdmin.findFirst({
      where: {
        OR: [
          { email: 'raju001' },
          { adminId: 'raju001' }
        ]
      },
      include: {
        tenant: true
      }
    });
    console.log('User:', JSON.stringify(user, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
