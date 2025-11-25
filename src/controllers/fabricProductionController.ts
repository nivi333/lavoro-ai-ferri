import { Request, Response } from 'express';
import Joi from 'joi';
import fabricProductionService from '../services/fabricProductionService';

// Validation schemas
const createFabricProductionSchema = Joi.object({
  fabricType: Joi.string().valid(
    'COTTON', 'SILK', 'WOOL', 'POLYESTER', 'NYLON', 'LINEN', 'RAYON', 'SPANDEX', 'BLEND'
  ).required(),
  fabricName: Joi.string().min(2).max(100).required(),
  composition: Joi.string().min(2).max(200).required(),
  weightGsm: Joi.number().positive().required(),
  widthInches: Joi.number().positive().required(),
  color: Joi.string().min(2).max(50).required(),
  pattern: Joi.string().max(100).optional(),
  finishType: Joi.string().max(100).optional(),
  quantityMeters: Joi.number().positive().required(),
  productionDate: Joi.date().required(),
  batchNumber: Joi.string().min(2).max(50).required(),
  qualityGrade: Joi.string().valid('A_GRADE', 'B_GRADE', 'C_GRADE', 'REJECT').required(),
  locationId: Joi.string().uuid().optional(),
  notes: Joi.string().max(500).optional(),
  isActive: Joi.boolean().optional()
});

const updateFabricProductionSchema = Joi.object({
  fabricType: Joi.string().valid(
    'COTTON', 'SILK', 'WOOL', 'POLYESTER', 'NYLON', 'LINEN', 'RAYON', 'SPANDEX', 'BLEND'
  ).optional(),
  fabricName: Joi.string().min(2).max(100).optional(),
  composition: Joi.string().min(2).max(200).optional(),
  weightGsm: Joi.number().positive().optional(),
  widthInches: Joi.number().positive().optional(),
  color: Joi.string().min(2).max(50).optional(),
  pattern: Joi.string().max(100).optional(),
  finishType: Joi.string().max(100).optional(),
  quantityMeters: Joi.number().positive().optional(),
  productionDate: Joi.date().optional(),
  batchNumber: Joi.string().min(2).max(50).optional(),
  qualityGrade: Joi.string().valid('A_GRADE', 'B_GRADE', 'C_GRADE', 'REJECT').optional(),
  locationId: Joi.string().uuid().optional(),
  notes: Joi.string().max(500).optional(),
  isActive: Joi.boolean().optional()
});

const fabricProductionFiltersSchema = Joi.object({
  fabricType: Joi.string().optional(),
  qualityGrade: Joi.string().optional(),
  locationId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
  search: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

class FabricProductionController {
  // Create fabric production
  async createFabricProduction(req: Request, res: Response) {
    try {
      const { error, value } = createFabricProductionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
      }

      const fabricProduction = await fabricProductionService.createFabricProduction(tenantId, value);

      res.status(201).json({
        success: true,
        message: 'Fabric production created successfully',
        data: fabricProduction
      });
    } catch (error: any) {
      console.error('Error creating fabric production:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create fabric production'
      });
    }
  }

  // Get fabric productions with filters
  async getFabricProductions(req: Request, res: Response) {
    try {
      const { error, value } = fabricProductionFiltersSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
      }

      // Convert string dates to Date objects
      const filters = { ...value };
      if (filters.startDate) {
        filters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        filters.endDate = new Date(filters.endDate);
      }

      const fabricProductions = await fabricProductionService.getFabricProductions(tenantId, filters);

      res.status(200).json({
        success: true,
        message: 'Fabric productions retrieved successfully',
        data: fabricProductions
      });
    } catch (error: any) {
      console.error('Error fetching fabric productions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch fabric productions'
      });
    }
  }

  // Get fabric production by ID
  async getFabricProductionById(req: Request, res: Response) {
    try {
      const { fabricId } = req.params;
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
      }

      if (!fabricId) {
        return res.status(400).json({
          success: false,
          message: 'Fabric ID is required'
        });
      }

      const fabricProduction = await fabricProductionService.getFabricProductionById(tenantId, fabricId);

      res.status(200).json({
        success: true,
        message: 'Fabric production retrieved successfully',
        data: fabricProduction
      });
    } catch (error: any) {
      console.error('Error fetching fabric production:', error);
      if (error.message === 'Fabric production not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch fabric production'
      });
    }
  }

  // Update fabric production
  async updateFabricProduction(req: Request, res: Response) {
    try {
      const { fabricId } = req.params;
      const { error, value } = updateFabricProductionSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
      }

      if (!fabricId) {
        return res.status(400).json({
          success: false,
          message: 'Fabric ID is required'
        });
      }

      const fabricProduction = await fabricProductionService.updateFabricProduction(tenantId, fabricId, value);

      res.status(200).json({
        success: true,
        message: 'Fabric production updated successfully',
        data: fabricProduction
      });
    } catch (error: any) {
      console.error('Error updating fabric production:', error);
      if (error.message === 'Fabric production not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update fabric production'
      });
    }
  }

  // Delete fabric production
  async deleteFabricProduction(req: Request, res: Response) {
    try {
      const { fabricId } = req.params;
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
      }

      if (!fabricId) {
        return res.status(400).json({
          success: false,
          message: 'Fabric ID is required'
        });
      }

      await fabricProductionService.deleteFabricProduction(tenantId, fabricId);

      res.status(200).json({
        success: true,
        message: 'Fabric production deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting fabric production:', error);
      if (error.message === 'Fabric production not found') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete fabric production'
      });
    }
  }
}

export default new FabricProductionController();
