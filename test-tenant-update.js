/**
 * Test script for tenant update API
 * Run with: node test-tenant-update.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPER_ADMIN_TOKEN = process.env.SUPER_ADMIN_TOKEN || 'your-token-here';

async function testTenantUpdate() {
  console.log('🧪 Testing Tenant Update API\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Token: ${SUPER_ADMIN_TOKEN ? '✓ Provided' : '✗ Missing'}\n`);

  try {
    // Step 1: Get list of tenants
    console.log('📋 Step 1: Fetching tenants...');
    const tenantsResponse = await axios.get(`${BASE_URL}/api/admin/super/tenants`, {
      headers: {
        'Authorization': `Bearer ${SUPER_ADMIN_TOKEN}`
      }
    });
    
    const tenants = tenantsResponse.data.tenants;
    console.log(`✓ Found ${tenants.length} tenants\n`);
    
    if (tenants.length === 0) {
      console.log('❌ No tenants found. Please create a tenant first.');
      return;
    }

    // Step 2: Get first tenant details
    const testTenant = tenants[0];
    console.log('🎯 Test Tenant:');
    console.log(`   ID: ${testTenant.id}`);
    console.log(`   Name: ${testTenant.name}`);
    console.log(`   Slug: ${testTenant.slug}`);
    console.log(`   Plan: ${testTenant.plan?.name || 'N/A'}`);
    console.log(`   Plan ID: ${testTenant.planId}\n`);

    // Step 3: Get list of plans
    console.log('📋 Step 2: Fetching plans...');
    const plansResponse = await axios.get(`${BASE_URL}/api/admin/super/plans`, {
      headers: {
        'Authorization': `Bearer ${SUPER_ADMIN_TOKEN}`
      }
    });
    
    const plans = plansResponse.data.plans || [];
    console.log(`✓ Found ${plans.length} plans`);
    plans.forEach(plan => {
      console.log(`   - ${plan.name} (${plan.id})`);
    });
    console.log('');

    if (plans.length === 0) {
      console.log('❌ No plans found. Cannot test plan change.');
      return;
    }

    // Step 4: Prepare update data
    const updateData = {
      id: testTenant.id,
      name: testTenant.name,
      slug: testTenant.slug,
      contactPhone: testTenant.contactPhone || null,
      planId: testTenant.planId, // Keep same plan for now
      isActive: testTenant.isActive,
      waConfig: testTenant.waConfig || null
    };

    console.log('📝 Step 3: Preparing update request...');
    console.log('Update Data:', JSON.stringify(updateData, null, 2));
    console.log('');

    // Step 5: Attempt update
    console.log('🔄 Step 4: Sending update request...');
    const updateResponse = await axios.put(
      `${BASE_URL}/api/admin/super/tenants`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${SUPER_ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Update successful!');
    console.log('Response:', JSON.stringify(updateResponse.data, null, 2));

  } catch (error) {
    console.log('\n❌ Error occurred:');
    
    if (error.response) {
      // Server responded with error
      console.log(`Status: ${error.response.status}`);
      console.log(`Error:`, JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data.details) {
        console.log(`\n📋 Error Details: ${error.response.data.details}`);
      }
      if (error.response.data.errorName) {
        console.log(`Error Name: ${error.response.data.errorName}`);
      }
      if (error.response.data.errorCode) {
        console.log(`Error Code: ${error.response.data.errorCode}`);
      }
    } else if (error.request) {
      // Request made but no response
      console.log('No response received from server');
      console.log('Request:', error.request);
    } else {
      // Error setting up request
      console.log('Error:', error.message);
    }
  }
}

// Run the test
testTenantUpdate();
