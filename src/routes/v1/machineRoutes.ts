import { Router } from 'express';
import { machineController } from '../../controllers/machineController';
import { requireRole } from '../../middleware/tenantIsolation';

const router = Router();

// Machine Management Routes
router.post('/', requireRole(['OWNER', 'ADMIN', 'MANAGER']), machineController.createMachine);
router.get('/', requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']), machineController.getMachines);
router.get('/analytics', requireRole(['OWNER', 'ADMIN', 'MANAGER']), machineController.getMachineAnalytics);
router.get('/:id', requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']), machineController.getMachineById);
router.put('/:id', requireRole(['OWNER', 'ADMIN', 'MANAGER']), machineController.updateMachine);
router.patch('/:id/status', requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']), machineController.updateMachineStatus);

// Breakdown Management Routes
router.post('/breakdowns', requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']), machineController.createBreakdownReport);
router.get('/breakdowns', requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']), machineController.getBreakdownReports);
router.patch('/breakdowns/:id', requireRole(['OWNER', 'ADMIN', 'MANAGER']), machineController.updateBreakdownReport);

// Maintenance Management Routes
router.post('/maintenance/schedules', requireRole(['OWNER', 'ADMIN', 'MANAGER']), machineController.createMaintenanceSchedule);
router.get('/maintenance/schedules', requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']), machineController.getMaintenanceSchedules);
router.post('/maintenance/records', requireRole(['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']), machineController.createMaintenanceRecord);

export default router;
