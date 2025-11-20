import { Router } from 'express';
import { qualityController } from '../../controllers/qualityController';
import { tenantIsolationMiddleware, requireRole } from '../../middleware/tenantIsolation';

const router = Router();

// Apply tenant isolation to all routes
router.use(tenantIsolationMiddleware);

// Quality Checkpoints Routes
router.post(
  '/checkpoints',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  (req, res) => qualityController.createCheckpoint(req, res)
);

router.get(
  '/checkpoints',
  (req, res) => qualityController.getCheckpoints(req, res)
);

router.get(
  '/checkpoints/:id',
  (req, res) => qualityController.getCheckpointById(req, res)
);

router.put(
  '/checkpoints/:id',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  (req, res) => qualityController.updateCheckpoint(req, res)
);

router.delete(
  '/checkpoints/:id',
  requireRole(['OWNER', 'ADMIN']),
  (req, res) => qualityController.deleteCheckpoint(req, res)
);

// Quality Defects Routes
router.post(
  '/defects',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  (req, res) => qualityController.createDefect(req, res)
);

router.get(
  '/defects',
  (req, res) => qualityController.getDefects(req, res)
);

router.patch(
  '/defects/:id/resolve',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  (req, res) => qualityController.resolveDefect(req, res)
);

router.delete(
  '/defects/:id',
  requireRole(['OWNER', 'ADMIN']),
  (req, res) => qualityController.deleteDefect(req, res)
);

// Quality Metrics Routes
router.post(
  '/metrics',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  (req, res) => qualityController.createMetric(req, res)
);

router.get(
  '/metrics/:checkpointId',
  (req, res) => qualityController.getMetricsByCheckpoint(req, res)
);

router.delete(
  '/metrics/:id',
  requireRole(['OWNER', 'ADMIN']),
  (req, res) => qualityController.deleteMetric(req, res)
);

// Compliance Reports Routes
router.post(
  '/compliance',
  requireRole(['OWNER', 'ADMIN']),
  (req, res) => qualityController.createComplianceReport(req, res)
);

router.get(
  '/compliance',
  (req, res) => qualityController.getComplianceReports(req, res)
);

router.delete(
  '/compliance/:id',
  requireRole(['OWNER', 'ADMIN']),
  (req, res) => qualityController.deleteComplianceReport(req, res)
);

export default router;
