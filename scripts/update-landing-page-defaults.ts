import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating existing LandingPage records...');
    
    // Note: metaTitle and metaDescription are now required fields
    // This script is kept for reference but may not be needed if all records already have these fields
    const landingPages = await prisma.landingPage.findMany({
        include: {
            campaign: true,
        },
    });

    let updatedCount = 0;
    for (const page of landingPages) {
        const defaultTitle = page.campaign?.name || page.title || 'Campaign Landing Page';
        const defaultDescription = page.campaign?.description || 'Spin to win amazing prizes!';
        
        // Update if fields are empty strings (safety check)
        if (!page.metaTitle || !page.metaDescription) {
            await prisma.landingPage.update({
                where: { id: page.id },
                data: {
                    metaTitle: page.metaTitle || defaultTitle,
                    metaDescription: page.metaDescription || defaultDescription,
                },
            });
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} landing page(s)`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
