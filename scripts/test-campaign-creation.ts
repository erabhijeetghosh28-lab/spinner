import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testCampaignCreation() {
    console.log('=== CAMPAIGN CREATION TEST ===\n');
    
    try {
        // First, get a tenant ID
        console.log('1. Getting tenants...');
        const tenantsResponse = await axios.get(`${BASE_URL}/api/admin/super/tenants`, {
            headers: {
                'Authorization': 'Bearer mock-super-admin-token',
                'Content-Type': 'application/json'
            }
        });
        
        const tenants = tenantsResponse.data.tenants;
        if (!tenants || tenants.length === 0) {
            console.log('❌ No tenants found');
            return;
        }
        
        const testTenant = tenants[0];
        console.log(`✅ Using tenant: ${testTenant.name} (${testTenant.id})`);
        
        // Test campaign creation
        console.log('\n2. Testing campaign creation...');
        const campaignData = {
            tenantId: testTenant.id,
            name: 'Test Campaign ' + Date.now(),
            description: 'Test campaign created by API test',
            spinLimit: 1,
            spinCooldown: 24,
            referralsRequiredForSpin: 0,
            prizes: [
                {
                    name: 'Test Prize',
                    probability: 50,
                    dailyLimit: 10,
                    position: 0,
                    colorCode: '#FF0000'
                }
            ]
        };
        
        const createResponse = await axios.post(`${BASE_URL}/api/admin/campaigns`, campaignData, {
            headers: {
                'Authorization': 'Bearer mock-tenant-admin-token',
                'Content-Type': 'application/json',
                'x-tenant-id': testTenant.id
            }
        });
        
        console.log(`✅ Campaign created successfully!`);
        console.log(`   Campaign ID: ${createResponse.data.campaign.id}`);
        console.log(`   Campaign Name: ${createResponse.data.campaign.name}`);
        
        // Test getting campaigns
        console.log('\n3. Testing campaign retrieval...');
        const getResponse = await axios.get(`${BASE_URL}/api/admin/campaigns?tenantId=${testTenant.id}`, {
            headers: {
                'Authorization': 'Bearer mock-tenant-admin-token',
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`✅ Retrieved ${getResponse.data.campaigns.length} campaigns`);
        
        console.log('\n🎉 All tests passed! Campaign creation is working.');
        
    } catch (error: any) {
        console.log(`❌ Test failed: ${error.response?.status || error.code} - ${error.response?.data?.error || error.message}`);
        
        if (error.response?.data) {
            console.log(`   Details: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
}

testCampaignCreation().catch(console.error);