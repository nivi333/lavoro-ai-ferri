#!/usr/bin/env node
/**
 * Comprehensive CRUD API Test v4
 * Tests Create, Read, Update, Delete for all entities with correct field validation
 */

const BASE_URL = 'http://localhost:5001/api/v1';

let authTokens = null;
let testCompanyId = null;
let testLocationId = null;
let results = { passed: [], failed: [] };

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
      const errorMsg =
        data.message || data.details || (data.errors ? data.errors.join(', ') : 'Unknown error');
      results.failed.push(`❌ ${description}: ${errorMsg}`);
      return { success: false, error: data, status: response.status };
    }
  } catch (error) {
    results.failed.push(`❌ ${description}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Comprehensive CRUD API Test v4...\n');

  // ============ AUTH ============
  console.log('📋 AUTHENTICATION');
  const loginResult = await request(
    'POST',
    '/auth/login',
    { emailOrPhone: 'testuser@ayphen.com', password: 'Test@123' },
    'Login'
  );
  if (!loginResult.success) {
    console.log('❌ Cannot authenticate');
    return;
  }
  authTokens = loginResult.data.tokens;
  console.log('  🔐 Logged in');

  // ============ COMPANY + SWITCH CONTEXT ============
  console.log('\n📋 COMPANY');
  const companiesResult = await request('GET', '/companies', null, 'Get companies');
  if (companiesResult.success && companiesResult.data.length > 0) {
    testCompanyId = companiesResult.data[0].id;
    const switchResult = await request(
      'POST',
      `/companies/${testCompanyId}/switch`,
      {},
      'Switch company'
    );
    if (switchResult.success && switchResult.data.tokens) {
      authTokens = switchResult.data.tokens;
      console.log(`  🔄 Switched to: ${companiesResult.data[0].name}`);
    }
  }

  // ============ LOCATIONS CRUD ============
  console.log('\n📋 LOCATIONS CRUD');
  const locList = await request('GET', '/locations', null, 'READ: Get locations');
  if (locList.success && locList.data?.length > 0) {
    testLocationId = locList.data[0].id;
    await request('GET', `/locations/${testLocationId}`, null, 'READ: Get single location');
    await request(
      'PUT',
      `/locations/${testLocationId}`,
      { name: `Updated-${Date.now()}` },
      'UPDATE: Edit location'
    );
  }

  // Create a test location (only 'name' is required per schema)
  const newLoc = await request(
    'POST',
    '/locations',
    {
      name: `TestLoc-${Date.now()}`,
      locationType: 'WAREHOUSE',
      addressLine1: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'India',
      pincode: '123456',
    },
    'CREATE: New location'
  );
  if (newLoc.success && newLoc.data?.id) {
    await request('DELETE', `/locations/${newLoc.data.id}`, null, 'DELETE: Remove location');
  }

  // ============ CUSTOMERS CRUD ============
  console.log('\n📋 CUSTOMERS CRUD');
  const custList = await request(
    'GET',
    `/companies/${testCompanyId}/customers`,
    null,
    'READ: Get customers'
  );
  if (custList.success && custList.data?.length > 0) {
    const custId = custList.data[0].id;
    await request(
      'GET',
      `/companies/${testCompanyId}/customers/${custId}`,
      null,
      'READ: Get single customer'
    );
    await request(
      'PUT',
      `/companies/${testCompanyId}/customers/${custId}`,
      { name: `UpdCust-${Date.now()}` },
      'UPDATE: Edit customer'
    );
  }

  // Create customer (name required, min 2 chars)
  const newCust = await request(
    'POST',
    `/companies/${testCompanyId}/customers`,
    {
      name: `TestCustomer-${Date.now()}`,
      email: `cust${Date.now()}@test.com`,
      customerType: 'INDIVIDUAL',
    },
    'CREATE: New customer'
  );
  if (newCust.success && newCust.data?.id) {
    await request(
      'DELETE',
      `/companies/${testCompanyId}/customers/${newCust.data.id}`,
      null,
      'DELETE: Remove customer'
    );
  }

  // ============ SUPPLIERS CRUD ============
  console.log('\n📋 SUPPLIERS CRUD');
  const suppList = await request(
    'GET',
    `/companies/${testCompanyId}/suppliers`,
    null,
    'READ: Get suppliers'
  );
  if (suppList.success && suppList.data?.length > 0) {
    const suppId = suppList.data[0].id;
    await request(
      'GET',
      `/companies/${testCompanyId}/suppliers/${suppId}`,
      null,
      'READ: Get single supplier'
    );
    await request(
      'PUT',
      `/companies/${testCompanyId}/suppliers/${suppId}`,
      { name: `UpdSupp-${Date.now()}` },
      'UPDATE: Edit supplier'
    );
  }

  // Create supplier (minimal required fields)
  const newSupp = await request(
    'POST',
    `/companies/${testCompanyId}/suppliers`,
    {
      name: `TestSupp-${Date.now()}`,
      email: `supp${Date.now()}@test.com`,
      supplierType: 'MANUFACTURER',
    },
    'CREATE: New supplier'
  );
  if (newSupp.success && newSupp.data?.id) {
    await request(
      'DELETE',
      `/companies/${testCompanyId}/suppliers/${newSupp.data.id}`,
      null,
      'DELETE: Remove supplier'
    );
  }

  // ============ PRODUCTS CRUD ============
  console.log('\n📋 PRODUCTS CRUD');
  const prodList = await request('GET', '/products', null, 'READ: Get products');
  if (prodList.success && prodList.data?.length > 0) {
    const prodId = prodList.data[0].id;
    await request('GET', `/products/${prodId}`, null, 'READ: Get single product');
    await request(
      'PUT',
      `/products/${prodId}`,
      { name: `UpdProd-${Date.now()}` },
      'UPDATE: Edit product'
    );
  }

  // Create product (name, costPrice, sellingPrice required)
  const newProd = await request(
    'POST',
    '/products',
    {
      name: `TestProduct-${Date.now()}`,
      costPrice: 100,
      sellingPrice: 150,
    },
    'CREATE: New product'
  );
  if (newProd.success && newProd.data?.id) {
    await request('DELETE', `/products/${newProd.data.id}`, null, 'DELETE: Remove product');
  }

  // ============ ORDERS CRUD ============
  console.log('\n📋 ORDERS CRUD');
  const orderList = await request('GET', '/orders', null, 'READ: Get orders');
  if (orderList.success && orderList.data?.length > 0) {
    const orderId = orderList.data[0].id;
    await request('GET', `/orders/${orderId}`, null, 'READ: Get single order');
    await request(
      'PUT',
      `/orders/${orderId}`,
      { notes: `Updated ${Date.now()}` },
      'UPDATE: Edit order'
    );
  }

  // ============ PURCHASE ORDERS CRUD ============
  console.log('\n📋 PURCHASE ORDERS CRUD');
  const poList = await request('GET', '/purchase-orders', null, 'READ: Get POs');
  if (poList.success && poList.data?.length > 0) {
    const poId = poList.data[0].id;
    await request('GET', `/purchase-orders/${poId}`, null, 'READ: Get single PO');
    await request(
      'PUT',
      `/purchase-orders/${poId}`,
      { notes: `Updated ${Date.now()}` },
      'UPDATE: Edit PO'
    );
  }

  // ============ INVOICES CRUD ============
  console.log('\n📋 INVOICES CRUD');
  const invList = await request('GET', '/invoices', null, 'READ: Get invoices');
  if (invList.success && invList.data?.length > 0) {
    const invId = invList.data[0].id;
    await request('GET', `/invoices/${invId}`, null, 'READ: Get single invoice');
    await request(
      'PUT',
      `/invoices/${invId}`,
      { notes: `Updated ${Date.now()}` },
      'UPDATE: Edit invoice'
    );
  }

  // ============ BILLS CRUD ============
  console.log('\n📋 BILLS CRUD');
  const billList = await request('GET', '/bills', null, 'READ: Get bills');
  if (billList.success && billList.data?.length > 0) {
    const billId = billList.data[0].id;
    await request('GET', `/bills/${billId}`, null, 'READ: Get single bill');
    await request(
      'PUT',
      `/bills/${billId}`,
      { notes: `Updated ${Date.now()}` },
      'UPDATE: Edit bill'
    );
  }

  // ============ MACHINES CRUD ============
  console.log('\n📋 MACHINES CRUD');
  const machList = await request('GET', '/machines', null, 'READ: Get machines');
  if (machList.success && machList.data?.length > 0) {
    const machId = machList.data[0].id;
    await request('GET', `/machines/${machId}`, null, 'READ: Get single machine');
    await request(
      'PUT',
      `/machines/${machId}`,
      { name: `UpdMach-${Date.now()}` },
      'UPDATE: Edit machine'
    );
  }

  // Create machine (required: name, warrantyExpiry, locationId)
  if (testLocationId) {
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const newMach = await request(
      'POST',
      '/machines',
      {
        name: `TestMach-${Date.now()}`,
        warrantyExpiry: futureDate,
        locationId: testLocationId,
      },
      'CREATE: New machine'
    );
    if (newMach.success && newMach.data?.id) {
      await request('DELETE', `/machines/${newMach.data.id}`, null, 'DELETE: Remove machine');
    }
  }

  // ============ INVENTORY ============
  console.log('\n📋 INVENTORY');
  await request('GET', '/inventory/locations', null, 'READ: Get inventory locations');
  await request('GET', '/inventory/alerts', null, 'READ: Get stock alerts');

  // ============ QUALITY CONTROL CRUD ============
  console.log('\n📋 QUALITY CONTROL CRUD');
  const cpList = await request('GET', '/quality/checkpoints', null, 'READ: Get checkpoints');
  if (cpList.success && cpList.data?.length > 0) {
    const cpId = cpList.data[0].id;
    await request('GET', `/quality/checkpoints/${cpId}`, null, 'READ: Get single checkpoint');
    await request(
      'PUT',
      `/quality/checkpoints/${cpId}`,
      { name: `UpdCP-${Date.now()}` },
      'UPDATE: Edit checkpoint'
    );
  }

  const defList = await request('GET', '/quality/defects', null, 'READ: Get defects');
  if (defList.success && defList.data?.length > 0) {
    const defId = defList.data[0].id;
    await request('GET', `/quality/defects/${defId}`, null, 'READ: Get single defect');
    await request(
      'PUT',
      `/quality/defects/${defId}`,
      { name: `UpdDef-${Date.now()}` },
      'UPDATE: Edit defect'
    );
  }

  // ============ TEXTILE OPERATIONS CRUD ============
  console.log('\n📋 TEXTILE OPERATIONS CRUD');

  // Fabrics
  const fabList = await request('GET', '/textile/fabrics', null, 'READ: Get fabrics');
  if (fabList.success && fabList.data?.length > 0) {
    const fabId = fabList.data[0].id;
    await request('GET', `/textile/fabrics/${fabId}`, null, 'READ: Get single fabric');
    await request(
      'PUT',
      `/textile/fabrics/${fabId}`,
      { name: `UpdFab-${Date.now()}` },
      'UPDATE: Edit fabric'
    );
  }

  // Yarns
  const yarnList = await request('GET', '/textile/yarns', null, 'READ: Get yarns');
  if (yarnList.success && yarnList.data?.length > 0) {
    const yarnId = yarnList.data[0].id;
    await request('GET', `/textile/yarns/${yarnId}`, null, 'READ: Get single yarn');
    await request(
      'PUT',
      `/textile/yarns/${yarnId}`,
      { name: `UpdYarn-${Date.now()}` },
      'UPDATE: Edit yarn'
    );
  }

  // Dyeing
  const dyeList = await request('GET', '/textile/dyeing', null, 'READ: Get dyeing');
  if (dyeList.success && dyeList.data?.length > 0) {
    const dyeId = dyeList.data[0].id;
    await request('GET', `/textile/dyeing/${dyeId}`, null, 'READ: Get single dyeing');
    await request(
      'PUT',
      `/textile/dyeing/${dyeId}`,
      { notes: `Updated ${Date.now()}` },
      'UPDATE: Edit dyeing'
    );
  }

  // Garments
  const garList = await request('GET', '/textile/garments', null, 'READ: Get garments');
  if (garList.success && garList.data?.length > 0) {
    const garId = garList.data[0].id;
    await request('GET', `/textile/garments/${garId}`, null, 'READ: Get single garment');
    await request(
      'PUT',
      `/textile/garments/${garId}`,
      { notes: `Updated ${Date.now()}` },
      'UPDATE: Edit garment'
    );
  }

  // Designs
  const desList = await request('GET', '/textile/designs', null, 'READ: Get designs');
  if (desList.success && desList.data?.length > 0) {
    const desId = desList.data[0].id;
    await request('GET', `/textile/designs/${desId}`, null, 'READ: Get single design');
    await request(
      'PUT',
      `/textile/designs/${desId}`,
      { name: `UpdDes-${Date.now()}` },
      'UPDATE: Edit design'
    );
  }

  // ============ DASHBOARD ============
  console.log('\n📋 DASHBOARD');
  await request('GET', '/analytics/dashboard', null, 'READ: Get dashboard');

  // ============ REPORTS ============
  console.log('\n📋 REPORTS');
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await request(
    'GET',
    `/reports/profit-loss?startDate=${thirtyDaysAgo}&endDate=${today}`,
    null,
    'Profit & Loss'
  );
  await request('GET', `/reports/balance-sheet?asOfDate=${today}`, null, 'Balance Sheet');
  await request(
    'GET',
    `/reports/cash-flow?startDate=${thirtyDaysAgo}&endDate=${today}`,
    null,
    'Cash Flow'
  );
  await request(
    'GET',
    `/reports/machine-utilization?startDate=${thirtyDaysAgo}&endDate=${today}`,
    null,
    'Machine Utilization'
  );
  await request(
    'GET',
    `/reports/production-efficiency?startDate=${thirtyDaysAgo}&endDate=${today}`,
    null,
    'Production Efficiency'
  );
  await request(
    'GET',
    `/reports/quality-metrics?startDate=${thirtyDaysAgo}&endDate=${today}`,
    null,
    'Quality Metrics'
  );
  await request('GET', '/reports/inventory-summary', null, 'Inventory Summary');
  await request('GET', '/reports/stock-valuation', null, 'Stock Valuation');
  await request(
    'GET',
    `/reports/sales-summary?startDate=${thirtyDaysAgo}&endDate=${today}`,
    null,
    'Sales Summary'
  );
  await request(
    'GET',
    `/reports/top-selling-products?startDate=${thirtyDaysAgo}&endDate=${today}&limit=10`,
    null,
    'Top Products'
  );

  // ============ SUMMARY ============
  console.log('\n' + '='.repeat(60));
  console.log('📊 CRUD TEST RESULTS');
  console.log('='.repeat(60));
  const total = results.passed.length + results.failed.length;
  const pct = ((results.passed.length / total) * 100).toFixed(1);
  console.log(`✅ Passed: ${results.passed.length}/${total} (${pct}%)`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ FAILURES:');
    results.failed.forEach(f => console.log(`  ${f}`));
  }

  console.log('\n✅ PASSED:');
  results.passed.forEach(p => console.log(`  ${p}`));
}

runTests().catch(console.error);
