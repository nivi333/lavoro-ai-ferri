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

export default router;
