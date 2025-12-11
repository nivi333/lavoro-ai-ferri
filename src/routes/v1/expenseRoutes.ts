import { Router } from 'express';
import { expenseController } from '../../controllers/expenseController';
import { requireRole } from '../../middleware/tenantIsolation';

const router = Router();

/**
 * Expense Routes
 * All routes require authentication (handled by tenantIsolationMiddleware in parent router)
 */

// Get expense statistics
router.get(
  '/stats',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  expenseController.getExpenseStats.bind(expenseController)
);

// List expenses
router.get(
  '/',
  requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']),
  expenseController.getExpenses.bind(expenseController)
);

// Create expense
router.post(
  '/',
  requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']),
  expenseController.createExpense.bind(expenseController)
);

// Get expense by ID
router.get(
  '/:expenseId',
  requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']),
  expenseController.getExpenseById.bind(expenseController)
);

// Update expense
router.put(
  '/:expenseId',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  expenseController.updateExpense.bind(expenseController)
);

// Update expense status (approve/reject/pay)
router.patch(
  '/:expenseId/status',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  expenseController.updateExpenseStatus.bind(expenseController)
);

// Delete expense
router.delete(
  '/:expenseId',
  requireRole(['OWNER', 'ADMIN']),
  expenseController.deleteExpense.bind(expenseController)
);

export default router;
