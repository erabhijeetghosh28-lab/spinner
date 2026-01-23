import axios from 'axios';

// Test API endpoints for Week 1
async function testAPIs() {
    console.log('🧪 Testing Week 1 API Endpoints\n');

    // You'll need to set these from your actual login
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'YOUR_TOKEN_HERE';
    const TENANT_ID = process.env.TENANT_ID || 'tenant-default';

    axios.defaults.headers.common['Authorization'] = `Bearer ${ADMIN_TOKEN}`;

    try {
        // Test 1: Check Campaign Limit API
        console.log('1️⃣ Testing /api/admin/campaigns/check-limit...');
        try {
            const limitRes = await axios.get(
                `http://localhost:3000/api/admin/campaigns/check-limit?tenantId=${TENANT_ID}`
            );
            console.log('   ✅ Response:', JSON.stringify(limitRes.data, null, 2));
        } catch (err: any) {
            console.log('   ❌ Error:', err.response?.data || err.message);
        }

        // Test 2: Get Campaigns (should exclude archived)
        console.log('\n2️⃣ Testing /api/admin/campaigns (GET)...');
        try {
            const campaignsRes = await axios.get(
                `http://localhost:3000/api/admin/campaigns?tenantId=${TENANT_ID}`
            );
            const campaigns = campaignsRes.data.campaigns || [];
            console.log(`   ✅ Found ${campaigns.length} campaigns`);
            campaigns.forEach((camp: any) => {
                console.log(`      - ${camp.name}: ${camp.isArchived ? 'ARCHIVED' : 'ACTIVE'}`);
            });
        } catch (err: any) {
            console.log('   ❌ Error:', err.response?.data || err.message);
        }

        // Test 3: Try to create campaign (should fail if at limit)
        console.log('\n3️⃣ Testing Campaign Creation (should respect limits)...');
        try {
            const createRes = await axios.post('http://localhost:3000/api/admin/campaigns', {
                tenantId: TENANT_ID,
                name: 'Test Campaign - Should Fail',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });
            console.log('   ⚠️  Campaign created (unexpected if at limit):', createRes.data);
        } catch (err: any) {
            if (err.response?.status === 403) {
                console.log('   ✅ Correctly blocked (limit reached):', err.response.data.error);
            } else {
                console.log('   ❌ Error:', err.response?.data || err.message);
            }
        }

        // Test 4: Archive a campaign
        console.log('\n4️⃣ Testing Campaign Archive...');
        try {
            const campaignsRes = await axios.get(
                `http://localhost:3000/api/admin/campaigns?tenantId=${TENANT_ID}`
            );
            const campaigns = campaignsRes.data.campaigns || [];
            if (campaigns.length > 0) {
                const firstCamp = campaigns[0];
                console.log(`   Attempting to archive: ${firstCamp.name}`);
                
                const archiveRes = await axios.delete('http://localhost:3000/api/admin/campaigns', {
                    data: {
                        campaignId: firstCamp.id,
                        tenantId: TENANT_ID,
                    },
                });
                console.log('   ✅ Archive response:', archiveRes.data);
            } else {
                console.log('   ⚠️  No campaigns to archive');
            }
        } catch (err: any) {
            console.log('   ❌ Error:', err.response?.data || err.message);
        }

        console.log('\n✅ API Testing Complete!');
        console.log('\n📝 Note: Make sure your dev server is running (npm run dev)');
        console.log('   And you have valid ADMIN_TOKEN and TENANT_ID set');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Only run if called directly
if (require.main === module) {
    testAPIs();
}

export { testAPIs };
