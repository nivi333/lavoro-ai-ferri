import { Router } from 'express';
import { supplierController } from '../../controllers/supplierController';
import { requireRole } from '../../middleware/tenantIsolation';

const router = Router({ mergeParams: true });

/**
 * Supplier Management Routes
 * Mounted at /companies/:tenantId/suppliers
 */

// Get all suppliers
router.get('/', supplierController.getSuppliers.bind(supplierController));

// Create new supplier
router.post('/',
    requireRole(['OWNER', 'ADMIN', 'MANAGER']),
    supplierController.createSupplier.bind(supplierController)
);

// Get supplier details
router.get('/:id', supplierController.getSupplierById.bind(supplierController));

// Update supplier
router.put('/:id',
    requireRole(['OWNER', 'ADMIN', 'MANAGER']),
    supplierController.updateSupplier.bind(supplierController)
);

// Delete supplier
router.delete('/:id',
    requireRole(['OWNER', 'ADMIN']),
    supplierController.deleteSupplier.bind(supplierController)
);

export default router;
