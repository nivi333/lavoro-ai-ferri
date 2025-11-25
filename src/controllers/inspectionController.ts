import { Request, Response } from 'express';
import Joi from 'joi';
import { inspectionService } from '../services/inspectionService';
import { logger } from '../utils/logger';

// Validation Schemas
const createInspectionSchema = Joi.object({
  inspectionType: Joi.string().valid('INCOMING_MATERIAL', 'IN_PROCESS', 'FINAL_PRODUCT', 'RANDOM_CHECK').required(),
  referenceType: Joi.string().valid('PRODUCT', 'ORDER', 'BATCH').required(),
  referenceId: Joi.string().required(),
  locationId: Joi.string().optional(),
  inspectorId: Joi.string().optional(),
  inspectorName: Joi.string().optional(),
  templateId: Joi.string().optional(),
  scheduledDate: Joi.date().optional(),
  inspectionDate: Joi.date().optional(),
  nextInspectionDate: Joi.date().optional(),
  inspectorNotes: Joi.string().max(1000).optional(),
  recommendations: Joi.string().max(1000).optional(),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CONDITIONAL').optional(),
  qualityScore: Joi.number().min(0).max(100).optional(),
  isActive: Joi.boolean().optional(),
});

const updateInspectionSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CONDITIONAL').optional(),
  startedAt: Joi.date().optional(),
  completedAt: Joi.date().optional(),
  overallResult: Joi.string().valid('PASS', 'FAIL', 'CONDITIONAL').optional(),
  qualityScore: Joi.number().min(0).max(100).optional(),
  inspectorNotes: Joi.string().max(1000).optional(),
  recommendations: Joi.string().max(1000).optional(),
  inspectorName: Joi.string().optional(),
  inspectionDate: Joi.date().optional(),
  nextInspectionDate: Joi.date().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const completeInspectionSchema = Joi.object({
  result: Joi.string().valid('PASS', 'FAIL', 'CONDITIONAL').required(),
  qualityScore: Joi.number().min(0).max(100).required(),
  notes: Joi.string().max(1000).optional(),
  recommendations: Joi.string().max(1000).optional(),
});

const updateCheckpointSchema = Joi.object({
  result: Joi.string().required(),
  notes: Joi.string().max(500).optional(),
  photos: Joi.array().items(Joi.string()).optional(),
});

const createTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  category: Joi.string().valid('INCOMING', 'IN_PROCESS', 'FINAL', 'RANDOM', 'CUSTOM').required(),
  applicableTo: Joi.array().items(Joi.string()).min(1).required(),
  passingScore: Joi.number().min(0).max(100).optional(),
  checkpoints: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().optional(),
      evaluationType: Joi.string().valid('PASS_FAIL', 'RATING', 'MEASUREMENT').required(),
      isRequired: Joi.boolean().optional(),
      orderIndex: Joi.number().required(),
    })
  ).min(1).required(),
});

export class InspectionController {
  /**
   * Create a new inspection
   */
  async createInspection(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createInspectionSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const companyId = (req as any).tenantId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required',
        });
        return;
      }

      const inspection = await inspectionService.createInspection(companyId, value);

      logger.info('Inspection created', {
        service: 'inspection',
        inspectionId: inspection.id,
        companyId,
      });

      res.status(201).json({
        success: true,
        message: 'Inspection created successfully',
        data: inspection,
      });
    } catch (err: any) {
      logger.error('Error creating inspection', {
        service: 'inspection',
        error: err.message,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to create inspection',
        error: err.message,
      });
    }
  }

  /**
   * Get all inspections
   */
  async getInspections(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).tenantId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required',
        });
        return;
      }

      const filters: any = {};
      if (req.query.inspectionType) filters.inspectionType = req.query.inspectionType;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.inspectorId) filters.inspectorId = req.query.inspectorId;
      if (req.query.referenceType) filters.referenceType = req.query.referenceType;
      if (req.query.referenceId) filters.referenceId = req.query.referenceId;
      if (req.query.search) filters.search = req.query.search;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const inspections = await inspectionService.getInspections(companyId, filters);

      res.status(200).json({
        success: true,
        data: inspections,
        total: inspections.length,
      });
    } catch (err: any) {
      logger.error('Error fetching inspections', {
        service: 'inspection',
        error: err.message,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inspections',
        error: err.message,
      });
    }
  }

  /**
   * Get inspection by ID
   */
  async getInspectionById(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).tenantId;
      const { inspectionId } = req.params;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required',
        });
        return;
      }

      const inspection = await inspectionService.getInspectionById(companyId, inspectionId);

      res.status(200).json({
        success: true,
        data: inspection,
      });
    } catch (err: any) {
      logger.error('Error fetching inspection', {
        service: 'inspection',
        error: err.message,
      });
      res.status(err.message === 'Inspection not found' ? 404 : 500).json({
        success: false,
        message: err.message || 'Failed to fetch inspection',
      });
    }
  }

  /**
   * Update inspection
   */
  async updateInspection(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateInspectionSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const companyId = (req as any).tenantId;
      const { inspectionId } = req.params;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required',
        });
        return;
      }

      const inspection = await inspectionService.updateInspection(companyId, inspectionId, value);

      logger.info('Inspection updated', {
        service: 'inspection',
        inspectionId,
        companyId,
      });

      res.status(200).json({
        success: true,
        message: 'Inspection updated successfully',
        data: inspection,
      });
    } catch (err: any) {
      logger.error('Error updating inspection', {
        service: 'inspection',
        error: err.message,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update inspection',
        error: err.message,
      });
    }
  }

  /**
   * Complete inspection
   */
  async completeInspection(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = completeInspectionSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const companyId = (req as any).tenantId;
      const { inspectionId } = req.params;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required',
        });
        return;
      }

      const inspection = await inspectionService.completeInspection(
        companyId,
        inspectionId,
        value.result,
        value.qualityScore,
        value.notes,
        value.recommendations
      );

      logger.info('Inspection completed', {
        service: 'inspection',
        inspectionId,
        result: value.result,
        companyId,
      });

      res.status(200).json({
        success: true,
        message: 'Inspection completed successfully',
        data: inspection,
      });
    } catch (err: any) {
      logger.error('Error completing inspection', {
        service: 'inspection',
        error: err.message,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to complete inspection',
        error: err.message,
      });
    }
  }

  /**
   * Update checkpoint
   */
  async updateCheckpoint(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateCheckpointSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const companyId = (req as any).tenantId;
      const { checkpointId } = req.params;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required',
        });
        return;
      }

      const checkpoint = await inspectionService.updateCheckpoint(
        companyId,
        checkpointId,
        value.result,
        value.notes,
        value.photos
      );

      res.status(200).json({
        success: true,
        message: 'Checkpoint updated successfully',
        data: checkpoint,
      });
    } catch (err: any) {
      logger.error('Error updating checkpoint', {
        service: 'inspection',
        error: err.message,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update checkpoint',
        error: err.message,
      });
    }
  }

  /**
   * Delete inspection
   */
  async deleteInspection(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).tenantId;
      const { inspectionId } = req.params;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required',
        });
        return;
      }

      await inspectionService.deleteInspection(companyId, inspectionId);

      logger.info('Inspection deleted', {
        service: 'inspection',
        inspectionId,
        companyId,
      });

      res.status(200).json({
        success: true,
        message: 'Inspection deleted successfully',
      });
    } catch (err: any) {
      logger.error('Error deleting inspection', {
        service: 'inspection',
        error: err.message,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to delete inspection',
        error: err.message,
      });
    }
  }

  /**
   * Create inspection template
   */
  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createTemplateSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const companyId = (req as any).tenantId;
      const userId = (req as any).userId;

      if (!companyId || !userId) {
        res.status(400).json({
          success: false,
          message: 'Company ID and User ID are required',
        });
        return;
      }

      const template = await inspectionService.createTemplate(companyId, userId, value);

      logger.info('Inspection template created', {
        service: 'inspection',
        templateId: template.id,
        companyId,
      });

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template,
      });
    } catch (err: any) {
      logger.error('Error creating template', {
        service: 'inspection',
        error: err.message,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to create template',
        error: err.message,
      });
    }
  }

  /**
   * Get all templates
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).tenantId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required',
        });
        return;
      }

      const category = req.query.category as string | undefined;
      const templates = await inspectionService.getTemplates(companyId, category);

      res.status(200).json({
        success: true,
        data: templates,
        total: templates.length,
      });
    } catch (err: any) {
      logger.error('Error fetching templates', {
        service: 'inspection',
        error: err.message,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates',
        error: err.message,
      });
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).tenantId;
      const { templateId } = req.params;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required',
        });
        return;
      }

      const template = await inspectionService.getTemplateById(companyId, templateId);

      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (err: any) {
      logger.error('Error fetching template', {
        service: 'inspection',
        error: err.message,
      });
      res.status(err.message === 'Template not found' ? 404 : 500).json({
        success: false,
        message: err.message || 'Failed to fetch template',
      });
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).tenantId;
      const { templateId } = req.params;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required',
        });
        return;
      }

      await inspectionService.deleteTemplate(companyId, templateId);

      logger.info('Template deleted', {
        service: 'inspection',
        templateId,
        companyId,
      });

      res.status(200).json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (err: any) {
      logger.error('Error deleting template', {
        service: 'inspection',
        error: err.message,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to delete template',
        error: err.message,
      });
    }
  }

  /**
   * Get inspection metrics
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).tenantId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required',
        });
        return;
      }

      const periodStart = req.query.periodStart ? new Date(req.query.periodStart as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const periodEnd = req.query.periodEnd ? new Date(req.query.periodEnd as string) : new Date();

      const metrics = await inspectionService.getInspectionMetrics(companyId, periodStart, periodEnd);

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (err: any) {
      logger.error('Error fetching metrics', {
        service: 'inspection',
        error: err.message,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch metrics',
        error: err.message,
      });
    }
  }
}

export const inspectionController = new InspectionController();
