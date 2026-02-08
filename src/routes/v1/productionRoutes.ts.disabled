import { Router } from 'express';
import { productionController } from '../../controllers/productionController';
import { tenantIsolationMiddleware } from '../../middleware/tenantIsolation';

const router = Router();

// Apply authentication middleware to all production routes
router.use(tenantIsolationMiddleware);

// Production Orders CRUD
router.post('/orders', productionController.createProductionOrder.bind(productionController));
router.get('/orders', productionController.getProductionOrders.bind(productionController));
router.get('/orders/:id', productionController.getProductionOrderById.bind(productionController));
router.put('/orders/:id', productionController.updateProductionOrder.bind(productionController));
router.delete('/orders/:id', productionController.deleteProductionOrder.bind(productionController));

// Work Orders CRUD
router.post('/work-orders', productionController.createWorkOrder.bind(productionController));
router.get('/work-orders', productionController.getWorkOrders.bind(productionController));
router.get('/orders/:productionOrderId/work-orders', productionController.getWorkOrders.bind(productionController));
router.put('/work-orders/:id', productionController.updateWorkOrder.bind(productionController));

// Production Analytics
router.get('/summary', productionController.getProductionSummary.bind(productionController));

// Reference Data
router.get('/statuses', productionController.getProductionStatuses.bind(productionController));
router.get('/priorities', productionController.getPriorityLevels.bind(productionController));
router.get('/operation-types', productionController.getOperationTypes.bind(productionController));
router.get('/textile-operations', productionController.getTextileOperations.bind(productionController));

export default router;
