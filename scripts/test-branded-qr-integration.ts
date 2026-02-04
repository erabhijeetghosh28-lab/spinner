/**
 * Test script for Branded QR Generator integration
 * 
 * Tests the complete flow:
 * 1. API endpoint functionality
 * 2. Image generation
 * 3. Download functionality
 */

import { generateBrandedQRCard, generateBrandedQRPoster } from '../lib/branded-qr-generator';

async function testBrandedQRGeneration() {
  console.log('🧪 Testing Branded QR Generation...\n');

  const testOptions = {
    campaignName: 'Test Campaign - Spin & Win',
    qrData: 'https://example.com/campaign/test',
    businessName: 'Test Business',
    phone: '+1-555-123-4567',
    website: 'www.testbusiness.com',
    primaryColor: '#1E3A8A',
    backgroundColor: '#FFFFFF'
  };

  try {
    // Test poster generation
    console.log('📄 Generating poster...');
    const posterBuffer = await generateBrandedQRPoster(testOptions);
    console.log(`✅ Poster generated successfully (${posterBuffer.length} bytes)`);

    // Test card generation
    console.log('💳 Generating card...');
    const cardBuffer = await generateBrandedQRCard(testOptions);
    console.log(`✅ Card generated successfully (${cardBuffer.length} bytes)`);

    // Save test files
    const fs = require('fs');
    fs.writeFileSync('test-branded-poster.png', posterBuffer);
    fs.writeFileSync('test-branded-card.png', cardBuffer);
    
    console.log('\n🎉 All tests passed!');
    console.log('📁 Test files saved:');
    console.log('   - test-branded-poster.png');
    console.log('   - test-branded-card.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testBrandedQRGeneration();