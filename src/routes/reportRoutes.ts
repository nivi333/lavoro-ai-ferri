import express from 'express';
import { reportController } from '../controllers/reportController';
import { tenantIsolationMiddleware, requireRole } from '../middleware/tenantIsolation';

const router = express.Router();

// All routes require authentication and tenant context
router.use(tenantIsolationMiddleware);

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
