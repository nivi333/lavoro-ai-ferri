import { Router } from 'express';
import { pettyCashController } from '../../controllers/pettyCashController';
import { requireRole } from '../../middleware/tenantIsolation';

const router = Router();

/**
 * Petty Cash Routes
 * All routes require authentication (handled by tenantIsolationMiddleware in parent router)
 */

// Get summary
router.get(
  '/summary',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  pettyCashController.getAccountSummary.bind(pettyCashController)
);

// Account routes
router.get(
  '/accounts',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  pettyCashController.getAccounts.bind(pettyCashController)
);

router.post(
  '/accounts',
  requireRole(['OWNER', 'ADMIN']),
  pettyCashController.createAccount.bind(pettyCashController)
);

router.get(
  '/accounts/:accountId',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  pettyCashController.getAccountById.bind(pettyCashController)
);

router.put(
  '/accounts/:accountId',
  requireRole(['OWNER', 'ADMIN']),
  pettyCashController.updateAccount.bind(pettyCashController)
);

// Transaction routes
router.get(
  '/transactions',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  pettyCashController.getTransactions.bind(pettyCashController)
);

router.post(
  '/transactions',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  pettyCashController.createTransaction.bind(pettyCashController)
);

router.get(
  '/transactions/:transactionId',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  pettyCashController.getTransactionById.bind(pettyCashController)
);

export default router;
