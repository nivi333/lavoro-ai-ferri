import { Router } from 'express';
import { inventoryController } from '../../controllers/inventoryController';
import { tenantIsolationMiddleware } from '../../middleware/tenantIsolation';

const router = Router();

// Apply authentication middleware to all inventory routes
router.use(tenantIsolationMiddleware);

// Inventory Items CRUD
router.post('/items', inventoryController.createInventoryItem.bind(inventoryController));
router.get('/items', inventoryController.getInventoryItems.bind(inventoryController));
router.get('/items/:id', inventoryController.getInventoryItemById.bind(inventoryController));
router.put('/items/:id', inventoryController.updateInventoryItem.bind(inventoryController));
router.delete('/items/:id', inventoryController.deleteInventoryItem.bind(inventoryController));

// Stock Movements
router.post('/movements', inventoryController.recordStockMovement.bind(inventoryController));
router.get('/movements', inventoryController.getStockMovements.bind(inventoryController));
router.get('/items/:itemId/movements', inventoryController.getStockMovements.bind(inventoryController));

// Inventory Analytics
router.get('/alerts/low-stock', inventoryController.getLowStockAlerts.bind(inventoryController));
router.get('/summary', inventoryController.getInventorySummary.bind(inventoryController));

// Reference Data
router.get('/categories', inventoryController.getInventoryCategories.bind(inventoryController));
router.get('/movement-types', inventoryController.getStockMovementTypes.bind(inventoryController));
router.get('/specifications/textile', inventoryController.getTextileSpecifications.bind(inventoryController));

export default router;
