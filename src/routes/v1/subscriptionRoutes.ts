import { Router } from 'express';
import { subscriptionController } from '../../controllers/subscriptionController';
import { requireRole as authorize } from '../../middleware/tenantIsolation';

const router = Router();

// Protected routes
// Auth is handled by global middleware in index.ts

// Plans
router.get('/plans', subscriptionController.getSubscriptionPlans);

// Subscriptions
router.post('/', authorize(['ADMIN']), subscriptionController.createSubscription);
router.get('/current', subscriptionController.getCurrentSubscription);
router.put('/change', authorize(['ADMIN']), subscriptionController.changeSubscription);
router.post('/cancel', authorize(['ADMIN']), subscriptionController.cancelSubscription);

// Payment Management
router.post('/payment-intent', authorize(['ADMIN']), subscriptionController.createPaymentIntent);
router.get(
  '/payments',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  subscriptionController.getPaymentHistory
);
router.post('/portal', authorize(['ADMIN']), subscriptionController.createPortalSession);

// Analytics
router.get(
  '/analytics',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  subscriptionController.getSubscriptionAnalytics
);

export const subscriptionRoutes = router;
