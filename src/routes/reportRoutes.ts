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
router.get(
  '/gst',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getGSTReport
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

// Production Efficiency Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required)
router.get(
  '/production-efficiency',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getProductionEfficiencyReport
);

// Machine Utilization Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required), locationId (optional)
router.get(
  '/machine-utilization',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getMachineUtilizationReport
);

// Quality Metrics Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required)
router.get(
  '/quality-metrics',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getQualityMetricsReport
);

// Inventory Movement Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required), locationId (optional)
router.get(
  '/inventory-movement',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getInventoryMovementReport
);

// Production Planning Report (OWNER, ADMIN, MANAGER can view)
// Query params: startDate, endDate (required)
router.get(
  '/production-planning',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  reportController.getProductionPlanningReport
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

export default router;
