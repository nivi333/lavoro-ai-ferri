import { http, HttpResponse } from 'msw';

const API_BASE_URL = '/api/v1';

export const handlers = [
  // Auth endpoints - return unwrapped data for service tests
  http.post(`${API_BASE_URL}/auth/register`, () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: { id: 'user-123', email: 'test@example.com' },
    });
  }),

  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: { id: 'user-123', email: 'test@example.com' },
    });
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  http.post(`${API_BASE_URL}/auth/refresh`, () => {
    return HttpResponse.json({ accessToken: 'new-mock-access-token' });
  }),

  // Company endpoints
  http.get(`${API_BASE_URL}/companies`, () => {
    return HttpResponse.json([
      { id: 'company-123', name: 'Test Company', industry: 'TEXTILE_MANUFACTURING' },
    ]);
  }),

  http.post(`${API_BASE_URL}/companies`, () => {
    return HttpResponse.json({
      id: 'company-123',
      name: 'Test Company',
      industry: 'TEXTILE_MANUFACTURING',
    });
  }),

  http.post(`${API_BASE_URL}/companies/:id/switch`, () => {
    return HttpResponse.json({
      accessToken: 'new-company-access-token',
      refreshToken: 'new-company-refresh-token',
      tenantId: 'tenant-456',
    });
  }),

  http.put(`${API_BASE_URL}/companies/:id`, () => {
    return HttpResponse.json({
      id: 'company-123',
      name: 'Updated Company',
      industry: 'TEXTILE_MANUFACTURING',
    });
  }),

  // Product endpoints
  http.get(`${API_BASE_URL}/products`, () => {
    return HttpResponse.json([
      { id: 'prod-1', name: 'Product 1', sku: 'SKU-001', stock: 100 },
      { id: 'prod-2', name: 'Product 2', sku: 'SKU-002', stock: 50 },
    ]);
  }),

  http.post(`${API_BASE_URL}/products`, () => {
    return HttpResponse.json({
      id: 'prod-123',
      name: 'New Product',
      sku: 'SKU-NEW',
    });
  }),

  http.post(`${API_BASE_URL}/products/:id/stock-adjustment`, () => {
    return HttpResponse.json({
      success: true,
      product_id: 'prod-123',
      stock: 150,
    });
  }),

  // Machine endpoints
  http.get(`${API_BASE_URL}/machines`, () => {
    return HttpResponse.json([
      { machine_id: 'mach-1', name: 'Spinning Machine', status: 'IN_USE' },
      { machine_id: 'mach-2', name: 'Weaving Machine', status: 'UNDER_MAINTENANCE' },
    ]);
  }),

  http.post(`${API_BASE_URL}/machines`, () => {
    return HttpResponse.json({
      id: 'mach-123',
      machine_id: 'mach-123',
      name: 'Spinning Machine',
      status: 'IN_USE',
    });
  }),

  http.post(`${API_BASE_URL}/machines/maintenance/schedules`, () => {
    return HttpResponse.json({
      success: true,
      maintenance_id: 'maint-123',
      machine_id: 'mach-123',
      scheduled_date: '2024-02-01',
    });
  }),

  // Inventory endpoints
  http.get(`${API_BASE_URL}/inventory`, () => {
    return HttpResponse.json([
      { id: 'inv-1', product_id: 'prod-1', location_id: 'loc-1', quantity: 100 },
      { id: 'inv-2', product_id: 'prod-2', location_id: 'loc-2', quantity: 200 },
    ]);
  }),

  http.get(`${API_BASE_URL}/inventory/locations`, () => {
    return HttpResponse.json([
      { id: 'inv-1', product_id: 'prod-1', location_id: 'loc-1', quantity: 100 },
      { id: 'inv-2', product_id: 'prod-2', location_id: 'loc-2', quantity: 200 },
    ]);
  }),

  http.post(`${API_BASE_URL}/inventory/movements`, () => {
    return HttpResponse.json({
      success: true,
      movement_id: 'mov-123',
      product_id: 'prod-123',
      quantity: 50,
    });
  }),

  http.get(`${API_BASE_URL}/inventory/alerts`, () => {
    return HttpResponse.json([
      { alert_id: 'alert-1', product_id: 'prod-1', type: 'LOW_STOCK' },
    ]);
  }),

  // Default handler for unmatched requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json(
      { success: false, message: 'Not found' },
      { status: 404 }
    );
  }),
];
