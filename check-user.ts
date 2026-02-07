import prisma from './lib/prisma';

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
    if (user) {
      console.log('User found:', {
          id: user.id,
          adminId: user.adminId,
          email: user.email,
          name: user.name,
          tenantName: user.tenant.name
      });
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
