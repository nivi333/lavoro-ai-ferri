import express from 'express';
import fabricProductionController from '../../controllers/fabricProductionController';
import { tenantIsolationMiddleware, requireRole } from '../../middleware/tenantIsolation';

const router = express.Router();

// Apply tenant isolation middleware to all routes
router.use(tenantIsolationMiddleware);

// Fabric Production Routes
router.post('/', 
  requireRole(['OWNER', 'ADMIN', 'MANAGER']), 
  fabricProductionController.createFabricProduction
);

router.get('/', 
  requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']), 
  fabricProductionController.getFabricProductions
);

router.get('/:fabricId', 
  requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']), 
  fabricProductionController.getFabricProductionById
);

router.put('/:fabricId', 
  requireRole(['OWNER', 'ADMIN', 'MANAGER']), 
  fabricProductionController.updateFabricProduction
);

router.delete('/:fabricId', 
  requireRole(['OWNER', 'ADMIN']), 
  fabricProductionController.deleteFabricProduction
);

export default router;
