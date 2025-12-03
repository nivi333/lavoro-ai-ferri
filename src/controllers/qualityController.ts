import { Request, Response } from 'express';
import Joi from 'joi';
import { qualityService } from '../services/qualityService';
import { logger } from '../utils/logger';
import { CheckpointType, QCStatus, DefectCategory, DefectSeverity, ResolutionStatus, ComplianceType, ComplianceStatus } from '@prisma/client';

// Validation Schemas

const createCheckpointSchema = Joi.object({
  checkpointType: Joi.string().valid(...Object.values(CheckpointType)).required(),
  checkpointName: Joi.string().min(1).max(255).required(),
  inspectorName: Joi.string().min(1).max(255).required(),
  inspectionDate: Joi.date().required(),
  orderId: Joi.string().optional().allow('', null),
  locationId: Joi.string().optional().allow('', null),
  productId: Joi.string().optional().allow('', null),
  batchNumber: Joi.string().optional().allow('', null),
  totalBatch: Joi.number().integer().min(1).optional().allow(null),
  lotNumber: Joi.string().optional().allow('', null),
  sampleSize: Joi.number().integer().min(1).optional().allow(null),
  testedQuantity: Joi.number().integer().min(1).optional().allow(null),
  overallScore: Joi.number().min(0).max(100).optional().allow(null),
  notes: Joi.string().max(1000).optional().allow('', null),
  isActive: Joi.boolean().optional().default(true),
});

const updateCheckpointSchema = Joi.object({
  checkpointName: Joi.string().min(1).max(255).optional(),
  inspectorName: Joi.string().min(1).max(255).optional().allow('', null),
  inspectionDate: Joi.date().optional().allow(null),
  status: Joi.string().valid(...Object.values(QCStatus)).optional().allow(null),
  overallScore: Joi.number().min(0).max(100).optional().allow(null),
  notes: Joi.string().max(1000).optional().allow('', null),
  isActive: Joi.boolean().optional(),
});

const createDefectSchema = Joi.object({
  checkpointId: Joi.string().required(),
  productId: Joi.string().optional().allow('', null),
  defectCategory: Joi.string().valid(...Object.values(DefectCategory)).required(),
  defectType: Joi.string().min(1).max(255).required(),
  severity: Joi.string().valid(...Object.values(DefectSeverity)).required(),
  quantity: Joi.number().integer().min(1).required(),
  affectedItems: Joi.number().integer().min(1).optional().allow(null),
  batchNumber: Joi.string().optional().allow('', null),
  lotNumber: Joi.string().optional().allow('', null),
  description: Joi.string().max(1000).optional().allow('', null),
  imageUrl: Joi.string().uri().optional().allow('', null),
  isActive: Joi.boolean().optional().default(true),
});

const resolveDefectSchema = Joi.object({
  resolvedBy: Joi.string().min(1).max(255).required(),
  resolutionNotes: Joi.string().max(1000).optional().allow('', null),
});

const createMetricSchema = Joi.object({
  checkpointId: Joi.string().required(),
  metricName: Joi.string().min(1).max(255).required(),
  metricValue: Joi.number().required(),
  unitOfMeasure: Joi.string().min(1).max(50).required(),
  minThreshold: Joi.number().optional().allow(null),
  maxThreshold: Joi.number().optional().allow(null),
  notes: Joi.string().max(500).optional().allow('', null),
});

const createComplianceReportSchema = Joi.object({
  reportType: Joi.string().valid(...Object.values(ComplianceType)).required(),
  reportDate: Joi.date().required(),
  auditorName: Joi.string().min(1).max(255).required(),
  certification: Joi.string().max(255).optional().allow('', null),
  validityPeriod: Joi.string().max(100).optional().allow('', null),
  status: Joi.string().valid(...Object.values(ComplianceStatus)).required(),
  findings: Joi.string().max(2000).optional().allow('', null),
  recommendations: Joi.string().max(2000).optional().allow('', null),
  documentUrl: Joi.string().uri().optional().allow('', null),
  isActive: Joi.boolean().optional().default(true),
});

const updateComplianceReportSchema = Joi.object({
  reportType: Joi.string().valid(...Object.values(ComplianceType)).optional().allow(null),
  reportDate: Joi.date().optional().allow(null),
  auditorName: Joi.string().min(1).max(255).optional().allow('', null),
  certification: Joi.string().max(255).optional().allow('', null),
  validityPeriod: Joi.string().max(100).optional().allow('', null),
  status: Joi.string().valid(...Object.values(ComplianceStatus)).optional().allow(null),
  findings: Joi.string().max(2000).optional().allow('', null),
  recommendations: Joi.string().max(2000).optional().allow('', null),
  documentUrl: Joi.string().uri().optional().allow('', null),
  isActive: Joi.boolean().optional(),
});

export class QualityController {
  // Create Quality Checkpoint
  async createCheckpoint(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createCheckpointSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const tenantId = req.tenantId!;
      const checkpoint = await qualityService.createCheckpoint(tenantId, value);

      res.status(201).json({
        success: true,
        message: 'Quality checkpoint created successfully',
        data: checkpoint,
      });
    } catch (error: any) {
      logger.error('Error creating quality checkpoint:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create quality checkpoint',
      });
    }
  }

  // Get Quality Checkpoints
  async getCheckpoints(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { checkpointType, status, startDate, endDate } = req.query;

      const filters: any = {};
      if (checkpointType) filters.checkpointType = checkpointType as CheckpointType;
      if (status) filters.status = status as QCStatus;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const checkpoints = await qualityService.getCheckpoints(tenantId, filters);

      res.json({
        success: true,
        data: checkpoints,
      });
    } catch (error: any) {
      logger.error('Error fetching quality checkpoints:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch quality checkpoints',
      });
    }
  }

  // Get Checkpoint by ID
  async getCheckpointById(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const checkpoint = await qualityService.getCheckpointById(tenantId, id);

      res.json({
        success: true,
        data: checkpoint,
      });
    } catch (error: any) {
      logger.error('Error fetching quality checkpoint:', error);
      const statusCode = error.message === 'Checkpoint not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch quality checkpoint',
      });
    }
  }

  // Update Checkpoint
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

      const tenantId = req.tenantId!;
      const { id } = req.params;

      const checkpoint = await qualityService.updateCheckpoint(tenantId, id, value);

      res.json({
        success: true,
        message: 'Quality checkpoint updated successfully',
        data: checkpoint,
      });
    } catch (error: any) {
      logger.error('Error updating quality checkpoint:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update quality checkpoint',
      });
    }
  }

  // Delete Checkpoint
  async deleteCheckpoint(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      await qualityService.deleteCheckpoint(tenantId, id);

      res.json({
        success: true,
        message: 'Quality checkpoint deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting quality checkpoint:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete quality checkpoint',
      });
    }
  }

  // Create Defect
  async createDefect(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createDefectSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const tenantId = req.tenantId!;
      const defect = await qualityService.createDefect(tenantId, value);

      res.status(201).json({
        success: true,
        message: 'Quality defect created successfully',
        data: defect,
      });
    } catch (error: any) {
      logger.error('Error creating quality defect:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create quality defect',
      });
    }
  }

  // Get Defects
  async getDefects(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { defectCategory, severity, resolutionStatus } = req.query;

      const filters: any = {};
      if (defectCategory) filters.defectCategory = defectCategory as DefectCategory;
      if (severity) filters.severity = severity as DefectSeverity;
      if (resolutionStatus) filters.resolutionStatus = resolutionStatus as ResolutionStatus;

      const defects = await qualityService.getDefects(tenantId, filters);

      res.json({
        success: true,
        data: defects,
      });
    } catch (error: any) {
      logger.error('Error fetching quality defects:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch quality defects',
      });
    }
  }

  // Resolve Defect
  async resolveDefect(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = resolveDefectSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const tenantId = req.tenantId!;
      const { id } = req.params;

      const defect = await qualityService.resolveDefect(
        tenantId,
        id,
        value.resolvedBy,
        value.resolutionNotes
      );

      res.json({
        success: true,
        message: 'Quality defect resolved successfully',
        data: defect,
      });
    } catch (error: any) {
      logger.error('Error resolving quality defect:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to resolve quality defect',
      });
    }
  }

  // Delete Defect
  async deleteDefect(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      await qualityService.deleteDefect(tenantId, id);

      res.json({
        success: true,
        message: 'Quality defect deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting quality defect:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete quality defect',
      });
    }
  }

  // Create Metric
  async createMetric(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createMetricSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const tenantId = req.tenantId!;
      const metric = await qualityService.createMetric(tenantId, value);

      res.status(201).json({
        success: true,
        message: 'Quality metric created successfully',
        data: metric,
      });
    } catch (error: any) {
      logger.error('Error creating quality metric:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create quality metric',
      });
    }
  }

  // Get Metrics by Checkpoint
  async getMetricsByCheckpoint(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { checkpointId } = req.params;

      const metrics = await qualityService.getMetricsByCheckpoint(tenantId, checkpointId);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      logger.error('Error fetching quality metrics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch quality metrics',
      });
    }
  }

  // Delete Metric
  async deleteMetric(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      await qualityService.deleteMetric(tenantId, id);

      res.json({
        success: true,
        message: 'Quality metric deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting quality metric:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete quality metric',
      });
    }
  }

  // Create Compliance Report
  async createComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createComplianceReportSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const tenantId = req.tenantId!;
      const report = await qualityService.createComplianceReport(tenantId, value);

      res.status(201).json({
        success: true,
        message: 'Compliance report created successfully',
        data: report,
      });
    } catch (error: any) {
      logger.error('Error creating compliance report:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create compliance report',
      });
    }
  }

  // Get Compliance Reports
  async getComplianceReports(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { reportType, status } = req.query;

      const filters: any = {};
      if (reportType) filters.reportType = reportType as ComplianceType;
      if (status) filters.status = status as ComplianceStatus;

      const reports = await qualityService.getComplianceReports(tenantId, filters);

      res.json({
        success: true,
        data: reports,
      });
    } catch (error: any) {
      logger.error('Error fetching compliance reports:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch compliance reports',
      });
    }
  }

  // Update Compliance Report
  async updateComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateComplianceReportSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const tenantId = req.tenantId!;
      const { id } = req.params;

      const report = await qualityService.updateComplianceReport(tenantId, id, value);

      res.json({
        success: true,
        message: 'Compliance report updated successfully',
        data: report,
      });
    } catch (error: any) {
      logger.error('Error updating compliance report:', error);
      const statusCode = error.message === 'Report not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update compliance report',
      });
    }
  }

  // Delete Compliance Report
  async deleteComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      await qualityService.deleteComplianceReport(tenantId, id);

      res.json({
        success: true,
        message: 'Compliance report deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting compliance report:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete compliance report',
      });
    }
  }
}

export const qualityController = new QualityController();
