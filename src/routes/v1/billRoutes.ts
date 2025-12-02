import { Router } from 'express';
import { billController } from '../../controllers/billController';
import { requireRole } from '../../middleware/tenantIsolation';

const router = Router();

// List bills for current tenant
router.get('/', billController.getBills.bind(billController));

// Create new bill (OWNER/ADMIN/MANAGER)
router.post(
  '/',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  billController.createBill.bind(billController),
);

// Create bill from Purchase Order (OWNER/ADMIN/MANAGER)
router.post(
  '/from-purchase-order',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  billController.createBillFromPurchaseOrder.bind(billController),
);

// Get bill by ID
router.get('/:billId', billController.getBillById.bind(billController));

// Update bill (OWNER/ADMIN/MANAGER)
router.put(
  '/:billId',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  billController.updateBill.bind(billController),
);

// Update bill status (OWNER/ADMIN/MANAGER)
router.patch(
  '/:billId/status',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  billController.updateBillStatus.bind(billController),
);

// Delete bill (soft delete) (OWNER/ADMIN)
// Note: Only DRAFT bills can be deleted
router.delete(
  '/:billId',
  requireRole(['OWNER', 'ADMIN']),
  billController.deleteBill.bind(billController),
);

export default router;
