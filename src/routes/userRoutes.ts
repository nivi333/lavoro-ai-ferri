import express from 'express';
import userController from '../controllers/userController';
import { tenantIsolationMiddleware, requireRole } from '../middleware/tenantIsolation';

const router = express.Router();

// All routes require authentication and tenant context
router.use(tenantIsolationMiddleware);

// Get all users for a company (OWNER, ADMIN, MANAGER can view)
router.get(
  '/',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  userController.getCompanyUsers
);

// Get user by ID (OWNER, ADMIN, MANAGER can view)
router.get(
  '/:userId',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  userController.getUserById
);

// Invite user to company (OWNER, ADMIN only)
router.post(
  '/invite',
  requireRole(['OWNER', 'ADMIN']),
  userController.inviteUser
);

// Bulk invite users (OWNER, ADMIN only)
router.post(
  '/invite/bulk',
  requireRole(['OWNER', 'ADMIN']),
  userController.bulkInviteUsers
);

// Update user (OWNER, ADMIN only)
router.put(
  '/:userId',
  requireRole(['OWNER', 'ADMIN']),
  userController.updateUser
);

// Bulk update users (OWNER, ADMIN only)
router.patch(
  '/bulk/update',
  requireRole(['OWNER', 'ADMIN']),
  userController.bulkUpdateUsers
);

// Remove user from company (OWNER, ADMIN only)
router.delete(
  '/:userId',
  requireRole(['OWNER', 'ADMIN']),
  userController.removeUser
);

// Bulk remove users (OWNER, ADMIN only)
router.delete(
  '/bulk/remove',
  requireRole(['OWNER', 'ADMIN']),
  userController.bulkRemoveUsers
);

// Get user activity (OWNER, ADMIN, MANAGER can view)
router.get(
  '/:userId/activity',
  requireRole(['OWNER', 'ADMIN', 'MANAGER']),
  userController.getUserActivity
);

export default router;
