import { Router } from 'express';
import { companyController } from '../../controllers/companyController';
import { requireRole } from '../../middleware/tenantIsolation';

const router = Router();

/**
 * Company Management Routes
 * All routes require authentication (handled by tenantIsolationMiddleware in parent router)
 */

// Check slug availability (authenticated users only)
router.get('/check-slug', companyController.checkSlugAvailability.bind(companyController));

// Get all companies for authenticated user
router.get('/', companyController.getUserCompanies.bind(companyController));

// Create new company (any authenticated user can create)
router.post('/', companyController.createCompany.bind(companyController));

// Get company details by ID
router.get('/:tenantId', companyController.getCompanyById.bind(companyController));

// Get company logo by ID
router.get('/:tenantId/logo', companyController.getCompanyLogo.bind(companyController));

// Switch company context
router.post('/:tenantId/switch', companyController.switchCompany.bind(companyController));

// Update company details (OWNER/ADMIN only)
router.put('/:tenantId', 
  requireRole(['OWNER', 'ADMIN']), 
  companyController.updateCompany.bind(companyController)
);

// Invite user to company (OWNER/ADMIN only)
router.post('/:tenantId/invite', 
  requireRole(['OWNER', 'ADMIN']), 
  companyController.inviteUser.bind(companyController)
);

// Delete company (OWNER only)
router.delete('/:tenantId',
  requireRole(['OWNER']),
  companyController.deleteCompany.bind(companyController)
);

export default router;
