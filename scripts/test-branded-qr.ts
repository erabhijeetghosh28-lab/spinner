import { writeFileSync } from 'fs';
import { BrandedQROptions, generateBrandedQRCard, generateBrandedQRPoster } from '../lib/branded-qr-generator';

async function testBrandedQR() {
    console.log('=== TESTING BRANDED QR GENERATOR ===\n');

    const options: BrandedQROptions = {
        campaignName: 'Season Sale 2025',
        qrData: 'https://example.com/campaign',
        businessName: 'Demo Business',
        phone: '+1 (555) 123-4567',
        website: 'www.demobusiness.com',
        primaryColor: '#1E3A8A',
        backgroundColor: '#FFFFFF'
    };

    try {
        console.log('1. Generating branded poster...');
        const posterBuffer = await generateBrandedQRPoster(options);
        writeFileSync('test-poster.png', posterBuffer);
        console.log('✅ Poster generated: test-poster.png');

        console.log('\n2. Generating branded card...');
        const cardBuffer = await generateBrandedQRCard(options);
        writeFileSync('test-card.png', cardBuffer);
        console.log('✅ Card generated: test-card.png');

        console.log('\n🎉 Branded QR generation test completed successfully!');
        console.log('Check the generated files: test-poster.png and test-card.png');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testBrandedQR().catch(console.error);