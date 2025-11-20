import { Router } from 'express';
import authRoutes from './authRoutes';
import healthRoutes from './healthRoutes';
import companyRoutes from './companyRoutes';
import locationRoutes from './locationRoutes';
import orderRoutes from './orderRoutes';
import financialDocumentRoutes from './financialDocumentRoutes';
import qualityRoutes from './qualityRoutes';
// import inventoryRoutes from './inventoryRoutes';
// import productionRoutes from './productionRoutes';
import { tenantIsolationMiddleware } from '../../middleware/tenantIsolation';
import { userRateLimit } from '../../middleware/rateLimiter';

const router = Router();

// API Version information
router.get('/', (req, res) => {
  res.json({
    version: 'v1',
    name: 'Lavoro AI Ferri API',
    description: 'Textile Manufacturing ERP API - Version 1',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/auth',
      health: '/health',
      // Future endpoints will be added here
      companies: '/companies',
      locations: '/locations',
      orders: '/orders',
      financialDocuments: '/financial-documents',
      quality: '/quality',
      inventory: '/inventory (coming soon)',
      production: '/production (coming soon)',
      reports: '/reports (coming soon)',
    },
    documentation: '/docs',
  });
});

// Public routes (no authentication required)
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);

// Protected routes (authentication required)
// Apply authentication middleware for all protected routes
router.use(tenantIsolationMiddleware);
router.use(userRateLimit);

// Protected routes
router.use('/companies', companyRoutes);
router.use('/locations', locationRoutes);
router.use('/orders', orderRoutes);
router.use('/financial-documents', financialDocumentRoutes);
router.use('/quality', qualityRoutes);
// router.use('/inventory', inventoryRoutes);
// router.use('/production', productionRoutes);
// router.use('/reports', reportRoutes);

export default router;
