#!/usr/bin/env node
/**
 * Multi-Company Data Internal Populator
 * Creates 1 user, 3 companies, and multiple entities in each.
 */

const BASE_URL = 'http://localhost:5001/api/v1';

let authTokens = null;
let currentCompanyId = null;

async function request(method, endpoint, body = null, description = '') {
  const headers = {
    'Content-Type': 'application/json',
    ...(authTokens && { Authorization: `Bearer ${authTokens.accessToken}` }),
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`  ✅ ${description} | OK`);
      return { success: true, data: data.data || data };
    } else {
      console.error(`  ❌ ${description} | FAILED: ${data.message || 'Unknown error'}`);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error(`  ❌ ${description} | ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function run() {
  console.log('🚀 Starting Multi-Company Data Generation...\n');

  // 1. REGISTER USER
  console.log('📋 STEP 1: Register User');
  const userPayload = {
    firstName: 'Multi',
    lastName: 'Test',
    email: 'multi-test@ayphen.com',
    password: 'TestPassword@123',
  };

  const regResult = await request('POST', '/auth/register', userPayload, 'Register User');
  if (!regResult.success) {
    // Try login if register fails (might already exist)
    console.log('  ⚠️ Register failed, trying login...');
    const loginResult = await request(
      'POST',
      '/auth/login',
      {
        emailOrPhone: userPayload.email,
        password: userPayload.password,
      },
      'Login User'
    );
    if (!loginResult.success) return;
    authTokens = loginResult.data.tokens;
  } else {
    authTokens = regResult.data.tokens;
  }

  const companies = [
    { name: 'Alpha Textiles v3', slug: 'alpha-tex-v3' },
    { name: 'Beta Garments v3', slug: 'beta-garments-v3' },
    { name: 'Gamma Fabrications v3', slug: 'gamma-fab-v3' },
  ];

  for (const compInfo of companies) {
    console.log(`\n🏢 STEP 2: Creating/Fetching Company: ${compInfo.name}`);
    const compPayload = {
      ...compInfo,
      industry: 'Textiles',
      country: 'India',
      currency: 'INR',
      contactInfo: 'admin@' + compInfo.slug + '.com',
      establishedDate: '2020-01-01',
      businessType: 'MANUFACTURING',
      defaultLocation: 'Main Office',
      addressLine1: '123 Textile Street',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395001',
    };
    let compResult = await request('POST', '/companies', compPayload, `Create ${compInfo.name}`);

    let companyId;
    if (!compResult.success && compResult.error?.message?.includes('already exists')) {
      console.log(`  ℹ️ Company ${compInfo.name} already exists. Fetching...`);
      const allComps = await request('GET', '/companies', null, 'Get Companies');
      const existing = allComps.data.find(
        c => c.name === compInfo.name || c.slug === compInfo.slug
      );
      if (existing) {
        companyId = existing.id;
        console.log(`  ✅ Found existing company ID: ${companyId}`);
      } else {
        console.error(`  ❌ Could not find existing company ${compInfo.name}`);
        continue;
      }
    } else if (compResult.success) {
      companyId = compResult.data.id;
    } else {
      continue;
    }

    // Switch Context
    const switchRes = await request('POST', `/companies/${companyId}/switch`, {}, 'Switch Context');
    if (!switchRes.success) continue;
    authTokens = switchRes.data.tokens;

    // STEP 3: Create Entities
    console.log(`  📦 Populating entities for ${compInfo.name}...`);

    // 3.1 Location
    const locRes = await request(
      'POST',
      '/locations',
      {
        name: `${compInfo.name} HO`,
        locationType: 'FACTORY',
        isHeadquarters: true,
        addressLine1: '123 Textile Street',
        city: 'Surat',
        state: 'Gujarat',
        country: 'India',
        pincode: '395001',
      },
      'Create Location'
    );
    const locationId = locRes.data?.id;

    // 3.2 Customer
    await request(
      'POST',
      `/companies/${companyId}/customers`,
      {
        name: `Primary Customer for ${compInfo.name}`,
        customerType: 'WHOLESALER',
      },
      'Create Customer'
    );

    // 3.3 Supplier
    await request(
      'POST',
      `/companies/${companyId}/suppliers`,
      {
        name: `Lead Supplier for ${compInfo.name}`,
        email: `supp@${compInfo.slug}.com`,
        supplierType: 'MANUFACTURER',
      },
      'Create Supplier'
    );

    // 3.4 Product
    await request(
      'POST',
      '/products',
      {
        name: `${compInfo.name} Premium Item`,
        costPrice: 500,
        sellingPrice: 850,
        productType: 'OWN_MANUFACTURE',
      },
      'Create Product'
    );

    // 3.5 Machine
    if (locationId) {
      await request(
        'POST',
        '/machines',
        {
          name: `SuperLoom-01`,
          warrantyExpiry: new Date(Date.now() + 1000000000).toISOString(),
          locationId: locationId,
        },
        'Create Machine'
      );
    }

    // 3.6 Quality Checkpoint
    await request(
      'POST',
      '/quality/checkpoints',
      {
        checkpointName: 'Initial Inspection',
        checkpointType: 'IN_PROCESS',
        inspectorName: 'Quality Lead',
        inspectionDate: new Date().toISOString(),
        notes: 'First quality gate',
      },
      'Create Checkpoint'
    );

    // 3.7 Textile Design
    await request(
      'POST',
      '/textile/designs',
      {
        designName: 'Summer Flora',
        designCategory: 'PRINT',
        status: 'CONCEPT',
        notes: 'Floral pattern for summer collection',
      },
      'Create Design'
    );
  }

  console.log('\n' + '='.repeat(40));
  console.log('🎉 POPULATION COMPLETE');
  console.log('='.repeat(40));
  console.log('Email: multi-test@ayphen.com');
  console.log('Pass : TestPassword@123');
  console.log('='.repeat(40));
}

run().catch(console.error);
