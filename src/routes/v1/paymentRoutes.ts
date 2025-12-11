import { Router } from 'express';
import { paymentController } from '../../controllers/paymentController';
import { requireRole } from '../../middleware/tenantIsolation';

const router = Router();

/**
 * Payment Routes
 * All routes require authentication (handled by tenantIsolationMiddleware in parent router)
 */

// List payments
router.get(
  '/',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  paymentController.getPayments.bind(paymentController)
);

// Record payment (for invoices or bills)
router.post(
  '/',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  paymentController.recordPayment.bind(paymentController)
);

// Get payments by reference (invoice/bill)
router.get(
  '/reference/:referenceType/:referenceId',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  paymentController.getPaymentsByReference.bind(paymentController)
);

// Get payment by ID
router.get(
  '/:paymentId',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  paymentController.getPaymentById.bind(paymentController)
);

// Cancel payment
router.patch(
  '/:paymentId/cancel',
  requireRole(['OWNER', 'ADMIN']),
  paymentController.cancelPayment.bind(paymentController)
);

export default router;
