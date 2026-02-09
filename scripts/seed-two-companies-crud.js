#!/usr/bin/env node
/**
 * Comprehensive Two-Company Seed with Full CRUD Operations
 * Creates 1 user, 2 companies with proper default locations, and runs CRUD tests on all entities
 */

const BASE_URL = 'http://localhost:5001/api/v1';

let authTokens = null;
let testCompanyId = null;
let testLocationId = null;
const results = { passed: [], failed: [] };

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
      results.passed.push(`✅ ${description}`);
      return { success: true, data: data.data || data, status: response.status };
    } else {
      results.failed.push(`❌ ${description}: ${data.message || data.details || 'Unknown error'}`);
      return { success: false, error: data, status: response.status };
    }
  } catch (error) {
    results.failed.push(`❌ ${description}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runCRUDForCompany(companyName) {
  console.log(`\n📦 Running CRUD tests for: ${companyName}`);

  // ============ LOCATIONS CRUD ============
  console.log('  📋 LOCATIONS CRUD');
  const locList = await request('GET', '/locations', null, `[${companyName}] READ: Get locations`);
  if (locList.success && locList.data?.length > 0) {
    testLocationId = locList.data[0].id;
    await request(
      'GET',
      `/locations/${testLocationId}`,
      null,
      `[${companyName}] READ: Get single location`
    );
    await request(
      'PUT',
      `/locations/${testLocationId}`,
      { name: `Updated-${Date.now()}` },
      `[${companyName}] UPDATE: Edit location`
    );
  }

  const newLoc = await request(
    'POST',
    '/locations',
    {
      name: `TestLoc-${Date.now()}`,
      locationType: 'WAREHOUSE',
      addressLine1: '456 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
    },
    `[${companyName}] CREATE: New location`
  );
  if (newLoc.success && newLoc.data?.id) {
    await request(
      'DELETE',
      `/locations/${newLoc.data.id}`,
      null,
      `[${companyName}] DELETE: Remove location`
    );
  }

  // ============ CUSTOMERS CRUD ============
  console.log('  📋 CUSTOMERS CRUD');
  const custList = await request(
    'GET',
    `/companies/${testCompanyId}/customers`,
    null,
    `[${companyName}] READ: Get customers`
  );
  if (custList.success && custList.data?.length > 0) {
    const custId = custList.data[0].id;
    await request(
      'GET',
      `/companies/${testCompanyId}/customers/${custId}`,
      null,
      `[${companyName}] READ: Get single customer`
    );
    await request(
      'PUT',
      `/companies/${testCompanyId}/customers/${custId}`,
      { name: `UpdCust-${Date.now()}` },
      `[${companyName}] UPDATE: Edit customer`
    );
  }

  const newCust = await request(
    'POST',
    `/companies/${testCompanyId}/customers`,
    { name: `TestCustomer-${Date.now()}` },
    `[${companyName}] CREATE: New customer`
  );
  if (newCust.success && newCust.data?.id) {
    await request(
      'DELETE',
      `/companies/${testCompanyId}/customers/${newCust.data.id}`,
      null,
      `[${companyName}] DELETE: Remove customer`
    );
  }

  // ============ SUPPLIERS CRUD ============
  console.log('  📋 SUPPLIERS CRUD');
  const suppList = await request(
    'GET',
    `/companies/${testCompanyId}/suppliers`,
    null,
    `[${companyName}] READ: Get suppliers`
  );
  if (suppList.success && suppList.data?.length > 0) {
    const suppId = suppList.data[0].id;
    await request(
      'GET',
      `/companies/${testCompanyId}/suppliers/${suppId}`,
      null,
      `[${companyName}] READ: Get single supplier`
    );
    await request(
      'PUT',
      `/companies/${testCompanyId}/suppliers/${suppId}`,
      { name: `UpdSupp-${Date.now()}` },
      `[${companyName}] UPDATE: Edit supplier`
    );
  }

  const newSupp = await request(
    'POST',
    `/companies/${testCompanyId}/suppliers`,
    { name: `TestSupp-${Date.now()}`, email: `supp${Date.now()}@test.com` },
    `[${companyName}] CREATE: New supplier`
  );
  if (newSupp.success && newSupp.data?.id) {
    await request(
      'DELETE',
      `/companies/${testCompanyId}/suppliers/${newSupp.data.id}`,
      null,
      `[${companyName}] DELETE: Remove supplier`
    );
  }

  // ============ PRODUCTS CRUD ============
  console.log('  📋 PRODUCTS CRUD');
  const prodList = await request('GET', '/products', null, `[${companyName}] READ: Get products`);
  if (prodList.success && prodList.data?.length > 0) {
    const prodId = prodList.data[0].id;
    await request('GET', `/products/${prodId}`, null, `[${companyName}] READ: Get single product`);
    await request(
      'PUT',
      `/products/${prodId}`,
      { name: `UpdProd-${Date.now()}` },
      `[${companyName}] UPDATE: Edit product`
    );
  }

  const newProd = await request(
    'POST',
    '/products',
    { name: `TestProduct-${Date.now()}`, costPrice: 100, sellingPrice: 150 },
    `[${companyName}] CREATE: New product`
  );
  if (newProd.success && newProd.data?.id) {
    await request(
      'DELETE',
      `/products/${newProd.data.id}`,
      null,
      `[${companyName}] DELETE: Remove product`
    );
  }

  // ============ MACHINES CRUD ============
  console.log('  📋 MACHINES CRUD');
  const machList = await request('GET', '/machines', null, `[${companyName}] READ: Get machines`);
  if (machList.success && machList.data?.length > 0) {
    const machId = machList.data[0].id;
    await request('GET', `/machines/${machId}`, null, `[${companyName}] READ: Get single machine`);
    await request(
      'PUT',
      `/machines/${machId}`,
      { name: `UpdMach-${Date.now()}` },
      `[${companyName}] UPDATE: Edit machine`
    );
  }

  if (testLocationId) {
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const newMach = await request(
      'POST',
      '/machines',
      { name: `TestMach-${Date.now()}`, warrantyExpiry: futureDate, locationId: testLocationId },
      `[${companyName}] CREATE: New machine`
    );
    if (newMach.success && newMach.data?.id) {
      await request(
        'DELETE',
        `/machines/${newMach.data.id}`,
        null,
        `[${companyName}] DELETE: Remove machine`
      );
    }
  }

  // ============ QUALITY CONTROL CRUD ============
  console.log('  📋 QUALITY CONTROL CRUD');
  await request('GET', '/quality/checkpoints', null, `[${companyName}] READ: Get checkpoints`);
  await request('GET', '/quality/defects', null, `[${companyName}] READ: Get defects`);

  // ============ TEXTILE OPERATIONS ============
  console.log('  📋 TEXTILE OPERATIONS');
  await request('GET', '/textile/fabrics', null, `[${companyName}] READ: Get fabrics`);
  await request('GET', '/textile/yarns', null, `[${companyName}] READ: Get yarns`);
  await request('GET', '/textile/designs', null, `[${companyName}] READ: Get designs`);

  // ============ DASHBOARD & REPORTS ============
  console.log('  📋 DASHBOARD & REPORTS');
  await request('GET', '/analytics/dashboard', null, `[${companyName}] READ: Get dashboard`);

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await request(
    'GET',
    `/reports/profit-loss?startDate=${thirtyDaysAgo}&endDate=${today}`,
    null,
    `[${companyName}] Profit & Loss`
  );
  await request(
    'GET',
    `/reports/balance-sheet?asOfDate=${today}`,
    null,
    `[${companyName}] Balance Sheet`
  );
}

async function run() {
  console.log('🚀 Starting Two-Company Seed with CRUD Operations...\n');

  // ============ REGISTER/LOGIN USER ============
  console.log('📋 STEP 1: Register/Login User');
  const timestamp = Date.now();
  const userPayload = {
    firstName: 'Seed',
    lastName: 'Tester',
    email: `seed-test-${timestamp}@ayphen.com`,
    password: 'SeedTest@123',
  };

  const regResult = await request('POST', '/auth/register', userPayload, 'Register User');
  if (!regResult.success) {
    console.log('❌ Registration failed. Exiting.');
    return;
  }
  authTokens = regResult.data.tokens;
  console.log(`  ✅ User registered: ${userPayload.email}`);

  // ============ CREATE 2 COMPANIES ============
  const companies = [
    {
      name: `Alpha Textiles ${timestamp}`,
      slug: `alpha-textiles-${timestamp}`,
      industry: 'Textiles',
      country: 'India',
      currency: 'INR',
      contactInfo: 'admin@alpha.com',
      addressLine1: '123 Textile Park',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395001',
      businessType: 'MANUFACTURING',
      defaultLocation: 'Alpha HQ',
      establishedDate: '2020-01-01',
    },
    {
      name: `Beta Garments ${timestamp}`,
      slug: `beta-garments-${timestamp}`,
      industry: 'Textiles',
      country: 'India',
      currency: 'INR',
      contactInfo: 'admin@beta.com',
      addressLine1: '456 Fashion Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      businessType: 'MANUFACTURING',
      defaultLocation: 'Beta HQ',
      establishedDate: '2021-06-15',
    },
  ];

  for (const compInfo of companies) {
    console.log(`\n📋 STEP 2: Creating Company: ${compInfo.name}`);
    const compResult = await request('POST', '/companies', compInfo, `Create ${compInfo.name}`);

    if (!compResult.success) {
      console.log(`  ❌ Failed to create company: ${compInfo.name}`);
      continue;
    }

    testCompanyId = compResult.data.id;
    console.log(`  ✅ Company created: ${compResult.data.name} (ID: ${testCompanyId})`);

    // Switch to company context
    const switchResult = await request(
      'POST',
      `/companies/${testCompanyId}/switch`,
      {},
      `Switch to ${compInfo.name}`
    );
    if (switchResult.success && switchResult.data.tokens) {
      authTokens = switchResult.data.tokens;
      console.log(`  🔄 Switched to: ${compInfo.name}`);

      // Create initial entities for the company
      console.log('  📦 Creating initial entities...');

      // Create a customer
      await request(
        'POST',
        `/companies/${testCompanyId}/customers`,
        { name: `Primary Customer for ${compInfo.name}`, customerType: 'WHOLESALER' },
        'Create Customer'
      );

      // Create a supplier
      await request(
        'POST',
        `/companies/${testCompanyId}/suppliers`,
        {
          name: `Lead Supplier for ${compInfo.name}`,
          email: `supp@${compInfo.slug}.com`,
          supplierType: 'MANUFACTURER',
        },
        'Create Supplier'
      );

      // Create a product
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

      // Create a checkpoint
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

      // Create a design
      await request(
        'POST',
        '/textile/designs',
        {
          designName: 'Modern Pattern',
          designCategory: 'PRINT',
          status: 'CONCEPT',
          notes: 'New collection design',
        },
        'Create Design'
      );

      // Run comprehensive CRUD tests
      await runCRUDForCompany(compInfo.name);
    }
  }

  // ============ TEST NAME UNIQUENESS ============
  console.log('\n📋 STEP 3: Testing Company Name Uniqueness');
  const duplicateResult = await request(
    'POST',
    '/companies',
    companies[0],
    'Create duplicate company name'
  );
  if (!duplicateResult.success && duplicateResult.error?.message?.includes('already exists')) {
    results.passed.push('✅ Company name uniqueness validation works');
    console.log('  ✅ Duplicate name correctly rejected');
  } else if (duplicateResult.success) {
    results.failed.push('❌ Duplicate company name was allowed (should have been rejected)');
    console.log('  ❌ Duplicate name was incorrectly allowed');
  }

  // ============ SUMMARY ============
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEED & CRUD TEST RESULTS');
  console.log('='.repeat(60));
  const total = results.passed.length + results.failed.length;
  const pct = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : '0';
  console.log(`✅ Passed: ${results.passed.length}/${total} (${pct}%)`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ FAILURES:');
    results.failed.forEach(f => console.log(`  ${f}`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEED COMPLETE');
  console.log('='.repeat(60));
  console.log(`Email: ${userPayload.email}`);
  console.log(`Pass : ${userPayload.password}`);
  console.log('='.repeat(60));
}

run().catch(console.error);
