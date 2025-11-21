import { Router } from 'express';
import * as textileController from '../../controllers/textileController';
import { tenantIsolationMiddleware, requireRole } from '../../middleware/tenantIsolation';

const router = Router();

// Apply tenant isolation to all routes
router.use(tenantIsolationMiddleware);

// ============================================
// FABRIC PRODUCTION ROUTES
// ============================================
router.post(
  '/fabrics',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  textileController.createFabric
);

router.get(
  '/fabrics',
  textileController.getFabrics
);

router.get(
  '/fabrics/:id',
  textileController.getFabricById
);

router.put(
  '/fabrics/:id',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  textileController.updateFabric
);

router.delete(
  '/fabrics/:id',
  requireRole(['OWNER', 'ADMIN']),
  textileController.deleteFabric
);

// ============================================
// YARN MANUFACTURING ROUTES
// ============================================
router.post(
  '/yarns',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  textileController.createYarn
);

router.get(
  '/yarns',
  textileController.getYarns
);

router.get(
  '/yarns/:id',
  textileController.getYarnById
);

router.put(
  '/yarns/:id',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  textileController.updateYarn
);

router.delete(
  '/yarns/:id',
  requireRole(['OWNER', 'ADMIN']),
  textileController.deleteYarn
);

// ============================================
// DYEING & FINISHING ROUTES
// ============================================
router.post(
  '/dyeing',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  textileController.createDyeing
);

router.get(
  '/dyeing',
  textileController.getDyeings
);

router.get(
  '/dyeing/:id',
  textileController.getDyeingById
);

router.put(
  '/dyeing/:id',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  textileController.updateDyeing
);

router.delete(
  '/dyeing/:id',
  requireRole(['OWNER', 'ADMIN']),
  textileController.deleteDyeing
);

// ============================================
// GARMENT MANUFACTURING ROUTES
// ============================================
router.post(
  '/garments',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  textileController.createGarment
);

router.get(
  '/garments',
  textileController.getGarments
);

router.get(
  '/garments/:id',
  textileController.getGarmentById
);

router.put(
  '/garments/:id',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  textileController.updateGarment
);

router.patch(
  '/garments/:id/stage',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  textileController.updateGarmentStage
);

router.delete(
  '/garments/:id',
  requireRole(['OWNER', 'ADMIN']),
  textileController.deleteGarment
);

// ============================================
// DESIGN & PATTERNS ROUTES
// ============================================
router.post(
  '/designs',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  textileController.createDesign
);

router.get(
  '/designs',
  textileController.getDesigns
);

router.get(
  '/designs/:id',
  textileController.getDesignById
);

router.put(
  '/designs/:id',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  textileController.updateDesign
);

router.patch(
  '/designs/:id/status',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  textileController.updateDesignStatus
);

router.delete(
  '/designs/:id',
  requireRole(['OWNER', 'ADMIN']),
  textileController.deleteDesign
);

export default router;
