import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testAPIEndpoints() {
    console.log('=== API ENDPOINTS DIAGNOSTIC ===\n');
    
    const endpoints = [
        '/api/admin/referrals?tenantId=test',
        '/api/admin/stats?tenantId=test',
        '/api/admin/super/stats',
        '/api/admin/super/tenants'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${endpoint}`);
            
            const response = await axios.get(`${BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': 'Bearer mock-super-admin-token',
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            console.log(`✅ ${endpoint} - Status: ${response.status}`);
        } catch (error: any) {
            console.log(`❌ ${endpoint} - Error: ${error.response?.status || error.code} - ${error.response?.data?.error || error.message}`);
            
            if (error.response?.data) {
                console.log(`   Details: ${JSON.stringify(error.response.data, null, 2)}`);
            }
        }
        console.log('');
    }
}

testAPIEndpoints().catch(console.error);