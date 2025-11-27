import { Router } from 'express';
import { inventoryController } from '../../controllers/inventoryController';
import { requireRole } from '../../middleware/tenantIsolation';

const router = Router();

/**
 * @route   GET /api/v1/inventory/locations
 * @desc    Get location inventory with filters
 * @access  OWNER, ADMIN, MANAGER, EMPLOYEE
 */
router.get(
  '/locations',
  requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']),
  inventoryController.getLocationInventory
);

/**
 * @route   PUT /api/v1/inventory/locations
 * @desc    Update location inventory
 * @access  OWNER, ADMIN, MANAGER
 */
router.put(
  '/locations',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  inventoryController.updateLocationInventory
);

/**
 * @route   POST /api/v1/inventory/movements
 * @desc    Record stock movement
 * @access  OWNER, ADMIN, MANAGER
 */
router.post(
  '/movements',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  inventoryController.recordStockMovement
);

/**
 * @route   POST /api/v1/inventory/reservations
 * @desc    Create stock reservation
 * @access  OWNER, ADMIN, MANAGER
 */
router.post(
  '/reservations',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  inventoryController.createStockReservation
);

/**
 * @route   DELETE /api/v1/inventory/reservations/:reservationId
 * @desc    Release stock reservation
 * @access  OWNER, ADMIN, MANAGER
 */
router.delete(
  '/reservations/:reservationId',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  inventoryController.releaseStockReservation
);

/**
 * @route   GET /api/v1/inventory/alerts
 * @desc    Get stock alerts
 * @access  OWNER, ADMIN, MANAGER, EMPLOYEE
 */
router.get(
  '/alerts',
  requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']),
  inventoryController.getStockAlerts
);

/**
 * @route   PATCH /api/v1/inventory/alerts/:alertId/acknowledge
 * @desc    Acknowledge stock alert
 * @access  OWNER, ADMIN, MANAGER
 */
router.patch(
  '/alerts/:alertId/acknowledge',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  inventoryController.acknowledgeStockAlert
);

/**
 * @route   GET /api/v1/inventory/movement-types
 * @desc    Get stock movement types enum
 * @access  OWNER, ADMIN, MANAGER, EMPLOYEE
 */
router.get(
  '/movement-types',
  requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']),
  inventoryController.getStockMovementTypes
);

/**
 * @route   GET /api/v1/inventory/reservation-types
 * @desc    Get reservation types enum
 * @access  OWNER, ADMIN, MANAGER, EMPLOYEE
 */
router.get(
  '/reservation-types',
  requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']),
  inventoryController.getReservationTypes
);

export default router;
