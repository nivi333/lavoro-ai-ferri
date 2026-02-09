#!/usr/bin/env node
/**
 * Comprehensive API Seed Test v2
 * Tests all CRUD operations with correct route paths
 */

const BASE_URL = 'http://localhost:5001/api/v1';

let authTokens = null;
let testCompanyId = null;
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
      return { success: true, data: data.data || data };
    } else {
      results.failed.push(`❌ ${description}: ${data.message || 'Unknown error'}`);
      return { success: false, error: data };
    }
  } catch (error) {
    results.failed.push(`❌ ${description}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Comprehensive API Test v2...\n');

  // ============ AUTH ============
  console.log('📋 AUTHENTICATION');
  const loginResult = await request(
    'POST',
    '/auth/login',
    { emailOrPhone: 'testuser@lavoro.com', password: 'Test@123' },
    'Login'
  );
  if (!loginResult.success) {
    console.log('❌ Cannot authenticate');
    return;
  }
  authTokens = loginResult.data.tokens;
  console.log('  🔐 Logged in');

  await request(
    'POST',
    '/auth/refresh',
    { refreshToken: authTokens.refreshToken },
    'Refresh token'
  );

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
  await request('GET', `/companies/${testCompanyId}`, null, 'Get company details');

  // ============ LOCATIONS ============
  console.log('\n📋 LOCATIONS');
  await request('GET', '/locations', null, 'Get locations');

  // ============ CUSTOMERS (nested under company) ============
  console.log('\n📋 CUSTOMERS');
  await request('GET', `/companies/${testCompanyId}/customers`, null, 'Get customers');

  // ============ SUPPLIERS (nested under company) ============
  console.log('\n📋 SUPPLIERS');
  await request('GET', `/companies/${testCompanyId}/suppliers`, null, 'Get suppliers');

  // ============ PRODUCTS ============
  console.log('\n📋 PRODUCTS');
  const products = await request('GET', '/products', null, 'Get products');
  if (products.success && products.data?.length > 0) {
    await request('GET', `/products/${products.data[0].id}`, null, 'Get single product');
  }

  // ============ ORDERS ============
  console.log('\n📋 ORDERS');
  const orders = await request('GET', '/orders', null, 'Get orders');
  if (orders.success && orders.data?.length > 0) {
    await request('GET', `/orders/${orders.data[0].id}`, null, 'Get single order');
  }

  // ============ PURCHASE ORDERS ============
  console.log('\n📋 PURCHASE ORDERS');
  const pos = await request('GET', '/purchase-orders', null, 'Get POs');
  if (pos.success && pos.data?.length > 0) {
    await request('GET', `/purchase-orders/${pos.data[0].id}`, null, 'Get single PO');
  }

  // ============ INVOICES ============
  console.log('\n📋 INVOICES');
  const invoices = await request('GET', '/invoices', null, 'Get invoices');
  if (invoices.success && invoices.data?.length > 0) {
    await request('GET', `/invoices/${invoices.data[0].id}`, null, 'Get single invoice');
  }

  // ============ BILLS ============
  console.log('\n📋 BILLS');
  const bills = await request('GET', '/bills', null, 'Get bills');
  if (bills.success && bills.data?.length > 0) {
    await request('GET', `/bills/${bills.data[0].id}`, null, 'Get single bill');
  }

  // ============ MACHINES ============
  console.log('\n📋 MACHINES');
  const machines = await request('GET', '/machines', null, 'Get machines');
  if (machines.success && machines.data?.length > 0) {
    await request('GET', `/machines/${machines.data[0].id}`, null, 'Get single machine');
  }

  // ============ INVENTORY ============
  console.log('\n📋 INVENTORY');
  await request('GET', '/inventory/locations', null, 'Get inventory locations');
  await request('GET', '/inventory/alerts', null, 'Get stock alerts');

  // ============ QUALITY CONTROL ============
  console.log('\n📋 QUALITY CONTROL');
  await request('GET', '/quality/checkpoints', null, 'Get checkpoints');
  await request('GET', '/quality/defects', null, 'Get defects');
  await request('GET', '/inspections', null, 'Get inspections');

  // ============ TEXTILE OPERATIONS (correct paths) ============
  console.log('\n📋 TEXTILE OPERATIONS');
  await request('GET', '/textile/fabrics', null, 'Get fabrics');
  await request('GET', '/textile/yarns', null, 'Get yarns');
  await request('GET', '/textile/dyeing', null, 'Get dyeing');
  await request('GET', '/textile/garments', null, 'Get garments');
  await request('GET', '/textile/designs', null, 'Get designs');

  // ============ DASHBOARD ============
  console.log('\n📋 DASHBOARD');
  await request('GET', '/analytics/dashboard', null, 'Get dashboard');

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
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  const total = results.passed.length + results.failed.length;
  const pct = ((results.passed.length / total) * 100).toFixed(1);
  console.log(`✅ Passed: ${results.passed.length}/${total} (${pct}%)`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ FAILURES:');
    results.failed.forEach(f => console.log(`  ${f}`));
  }
}

runTests().catch(console.error);
