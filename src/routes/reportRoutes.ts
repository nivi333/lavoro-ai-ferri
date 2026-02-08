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


// Stock Valuation Report (OWNER, ADMIN, MANAGER can view)
// Query params: locationId (optional), asOfDate (optional)
router.get(
  '/stock-valuation',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getStockValuationReport
);



// Product Performance Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required), limit (optional, default: 10)
router.get(
  '/product-performance',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getProductPerformanceReport
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


export default router;
