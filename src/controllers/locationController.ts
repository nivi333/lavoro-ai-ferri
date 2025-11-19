import { Request, Response } from 'express';
import { locationService, createLocationSchema, updateLocationSchema } from '../services/locationService';

export class LocationController {
  async createLocation(req: Request, res: Response) {
    try {
      const { error, value } = createLocationSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      const userId = req.userId!;

      // Check if user has permission to create locations (OWNER, ADMIN, MANAGER)
      // This would be implemented based on your auth system

      const location = await locationService.createLocation(tenantId, value);

      res.status(201).json({
        success: true,
        message: 'Location created successfully',
        data: location,
      });
    } catch (error: any) {
      console.error('Error creating location:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create location',
      });
    }
  }

  async getLocations(req: Request, res: Response) {
    try {
      const { tenantId } = req;

      const locations = await locationService.getLocations(tenantId);

      res.status(200).json({
        success: true,
        data: locations,
      });
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch locations',
      });
    }
  }

  async getLocationById(req: Request, res: Response) {
    try {
      const { tenantId } = req;
      const { locationId } = req.params;

      const location = await locationService.getLocationById(locationId, tenantId);

      res.status(200).json({
        success: true,
        data: location,
      });
    } catch (error: any) {
      console.error('Error fetching location:', error);
      
      if (error.message === 'Location not found') {
        res.status(404).json({
          success: false,
          message: 'Location not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch location',
      });
    }
  }

  async updateLocation(req: Request, res: Response) {
    try {
      const { error, value } = updateLocationSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      const { locationId } = req.params;

      // Check if user has permission to update locations (OWNER, ADMIN)
      // This would be implemented based on your auth system

      const location = await locationService.updateLocation(locationId, tenantId, value);

      res.status(200).json({
        success: true,
        message: 'Location updated successfully',
        data: location,
      });
    } catch (error: any) {
      console.error('Error updating location:', error);
      
      if (error.message === 'Location not found') {
        res.status(404).json({
          success: false,
          message: 'Location not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update location',
      });
    }
  }

  async deleteLocation(req: Request, res: Response) {
    try {
      const { tenantId } = req;
      const { locationId } = req.params;

      // Check if user has permission to delete locations (OWNER, ADMIN)
      // This would be implemented based on your auth system

      const result = await locationService.deleteLocation(locationId, tenantId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Error deleting location:', error);
      
      if (error.message === 'Location not found') {
        res.status(404).json({
          success: false,
          message: 'Location not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete location',
      });
    }
  }

  async setDefaultLocation(req: Request, res: Response) {
    try {
      const { tenantId } = req;
      const { locationId } = req.params;

      // Check if user has permission to set default location (OWNER, ADMIN)
      // This would be implemented based on your auth system

      const location = await locationService.setDefaultLocation(locationId, tenantId);

      res.status(200).json({
        success: true,
        message: 'Default location updated successfully',
        data: location,
      });
    } catch (error: any) {
      console.error('Error setting default location:', error);
      
      if (error.message === 'Location not found') {
        res.status(404).json({
          success: false,
          message: 'Location not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to set default location',
      });
    }
  }
}

export const locationController = new LocationController();
