import { Router } from 'express';
import { locationController } from '../../controllers/locationController';

const router = Router();

/**
 * Location Management Routes
 * All routes require authentication (handled by tenantIsolationMiddleware in parent router)
 */

// Get all locations for the company
router.get('/', locationController.getLocations.bind(locationController));

// Create new location
router.post('/', locationController.createLocation.bind(locationController));

// Get location by ID
router.get('/:locationId', locationController.getLocationById.bind(locationController));

// Update location
router.put('/:locationId', locationController.updateLocation.bind(locationController));

// Delete location
router.delete('/:locationId', locationController.deleteLocation.bind(locationController));

// Set default location
router.patch('/:locationId/set-default', locationController.setDefaultLocation.bind(locationController));

export default router;
