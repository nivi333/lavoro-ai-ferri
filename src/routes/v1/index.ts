import { Router } from 'express';
import authRoutes from './authRoutes';
import healthRoutes from './healthRoutes';
import companyRoutes from './companyRoutes';
import locationRoutes from './locationRoutes';
import orderRoutes from './orderRoutes';
import purchaseOrderRoutes from './purchaseOrderRoutes';
import financialDocumentRoutes from './financialDocumentRoutes';
import invoiceRoutes from './invoiceRoutes';
import billRoutes from './billRoutes';

import qualityRoutes from './qualityRoutes';
import inspectionRoutes from './inspectionRoutes';
import productRoutes from './productRoutes';
import textileRoutes from './textileRoutes';
import inventoryRoutes from './inventoryRoutes';
import machineRoutes from './machineRoutes';
import customerRoutes from './customerRoutes';
import supplierRoutes from './supplierRoutes';
import userRoutes from '../userRoutes';
import analyticsRoutes from './analyticsRoutes';
import reportRoutes from '../reportRoutes';
import expenseRoutes from './expenseRoutes';
import paymentRoutes from './paymentRoutes';
import pettyCashRoutes from './pettyCashRoutes';
// import productionRoutes from './productionRoutes';
import { tenantIsolationMiddleware } from '../../middleware/tenantIsolation';
import { subscriptionController } from '../../controllers/subscriptionController';
import { subscriptionRoutes } from './subscriptionRoutes';
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
      companies: '/companies',
      locations: '/locations',
      orders: '/orders',
      purchaseOrders: '/purchase-orders',
      invoices: '/invoices',
      bills: '/bills',
      financialDocuments: '/financial-documents',
      quality: '/quality',
      inspections: '/inspections',
      products: '/products',
      textile: '/textile',
      users: '/users',
      inventory: '/inventory',
      machines: '/machines',
      analytics: '/analytics',
      reports: '/reports',
      expenses: '/expenses',
      payments: '/payments',
      pettyCash: '/petty-cash',
      production: '/production (coming soon)',
    },
    documentation: '/docs',
  });
});

// Public routes (no authentication required)
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);

// Public webhook routes
router.post('/webhooks/stripe', subscriptionController.handleWebhook);

// Protected routes (authentication required)
// Apply authentication middleware for all protected routes
router.use(tenantIsolationMiddleware);
router.use(userRateLimit);

// Protected routes
router.use('/companies/:tenantId/customers', customerRoutes);
router.use('/companies/:tenantId/suppliers', supplierRoutes);
router.use('/companies', companyRoutes);
router.use('/locations', locationRoutes);
router.use('/orders', orderRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/financial-documents', financialDocumentRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/bills', billRoutes);
router.use('/quality', qualityRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/products', productRoutes);
router.use('/textile', textileRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/machines', machineRoutes);
router.use('/users', userRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/expenses', expenseRoutes);
router.use('/payments', paymentRoutes);
router.use('/petty-cash', pettyCashRoutes);
router.use('/companies/:tenantId/customers', customerRoutes);
// router.use('/production', productionRoutes);
router.use('/subscriptions', subscriptionRoutes);

export default router;
