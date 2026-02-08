import express from 'express';
import { reportController } from '../controllers/reportController';
import { tenantIsolationMiddleware, requireRole } from '../middleware/tenantIsolation';

const router = express.Router();

// All routes require authentication and tenant context
router.use(tenantIsolationMiddleware);

// Profit & Loss Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required)
router.get(
  '/profit-loss',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getProfitLossReport
);

// Balance Sheet Report (OWNER, ADMIN, MANAGER can view)
// Query params: asOfDate (optional, defaults to today)
router.get(
  '/balance-sheet',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getBalanceSheet
);

// Cash Flow Statement (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required)
router.get(
  '/cash-flow',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getCashFlowStatement
);

// Trial Balance Report (OWNER, ADMIN, MANAGER can view)
// Query params: asOfDate (optional, defaults to today)
router.get(
  '/trial-balance',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getTrialBalance
);

// GST Report (OWNER, ADMIN, MANAGER can view)
// Query params: period (required)
router.get('/gst', requireRole(['OWNER', 'ADMIN', 'MANAGER']), reportController.getGSTReport);

// Sales Summary Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required)
router.get(
  '/sales-summary',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getSalesSummary
);

// Inventory Summary Report (OWNER, ADMIN, MANAGER can view)
// Query params: locationId (optional)
router.get(
  '/inventory-summary',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getInventorySummary
);

// Accounts Receivable Aging Report (OWNER, ADMIN, MANAGER can view)
// Query params: asOfDate (optional, defaults to today)
router.get(
  '/ar-aging',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getARAgingReport
);

// Accounts Payable Aging Report (OWNER, ADMIN, MANAGER can view)
// Query params: asOfDate (optional, defaults to today)
router.get(
  '/ap-aging',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getAPAgingReport
);

// Expense Summary Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required)
router.get(
  '/expense-summary',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getExpenseSummary
);

// Low Stock Report (OWNER, ADMIN, MANAGER can view)
// Query params: locationId (optional)
router.get(
  '/low-stock',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getLowStockReport
);

// Stock Valuation Report (OWNER, ADMIN, MANAGER can view)
// Query params: locationId (optional), asOfDate (optional)
router.get(
  '/stock-valuation',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getStockValuationReport
);


// Inventory Movement Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required), locationId (optional)
router.get(
  '/inventory-movement',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getInventoryMovementReport
);


// Sales Trends Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required), groupBy (optional, default: month)
router.get(
  '/sales-trends',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getSalesTrendsReport
);

// Product Performance Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required), limit (optional, default: 10)
router.get(
  '/product-performance',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getProductPerformanceReport
);

// Customer Insights Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required)
router.get(
  '/customer-insights',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getCustomerInsightsReport
);

// Business Performance Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required)
router.get(
  '/business-performance',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getBusinessPerformanceReport
);

// Textile Analytics Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required), category (optional, default: all)
router.get(
  '/textile-analytics',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getTextileAnalyticsReport
);

// Stock Aging Report (OWNER, ADMIN, MANAGER can view)
// Query params: asOfDate (optional)
router.get(
  '/stock-aging',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getStockAgingReport
);

// Sales by Region Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required)
router.get(
  '/sales-by-region',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getSalesByRegionReport
);

// Top Selling Products Report (Alias for Product Performance)
// Query params: startDate, endDate (required), limit (optional)
router.get(
  '/top-selling-products',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getProductPerformanceReport
);

// Customer Purchase History Report (Alias for Customer Insights)
// Query params: startDate, endDate (required)
router.get(
  '/customer-purchase-history',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getCustomerInsightsReport
);

export default router;
