import { Request, Response } from 'express';
import Joi from 'joi';
import { machineService } from '../services/machineService';
import { logger } from '../utils/logger';

// Validation schemas
const createMachineSchema = Joi.object({
  name: Joi.string().required().min(1).max(200),
  machineType: Joi.string().optional().allow(null, '').max(100),
  model: Joi.string().optional().allow(null, '').max(100),
  manufacturer: Joi.string().optional().allow(null, '').max(100),
  serialNumber: Joi.string().optional().allow(null, '').max(100),
  purchaseDate: Joi.date().optional().allow(null),
  warrantyExpiry: Joi.date().optional().allow(null),
  specifications: Joi.alternatives().try(Joi.object(), Joi.string()).optional().allow(null, ''),
  imageUrl: Joi.string().optional().allow(null, ''),
  locationId: Joi.string().uuid().optional().allow(null, ''),
  currentOperatorId: Joi.string().uuid().optional().allow(null, ''),
  operationalStatus: Joi.string().valid('FREE', 'BUSY', 'RESERVED', 'UNAVAILABLE').optional(),
  status: Joi.string().valid('NEW', 'IN_USE', 'UNDER_MAINTENANCE', 'UNDER_REPAIR', 'IDLE', 'DECOMMISSIONED').optional(),
  qrCode: Joi.string().optional().allow(null, '').max(255),
  isActive: Joi.boolean().optional(),
});

const updateMachineSchema = Joi.object({
  name: Joi.string().optional().min(1).max(200),
  machineType: Joi.string().optional().allow(null, '').max(100),
  model: Joi.string().optional().allow(null, '').max(100),
  manufacturer: Joi.string().optional().allow(null, '').max(100),
  serialNumber: Joi.string().optional().allow(null, '').max(100),
  purchaseDate: Joi.date().optional().allow(null),
  warrantyExpiry: Joi.date().optional().allow(null),
  specifications: Joi.alternatives().try(Joi.object(), Joi.string()).optional().allow(null, ''),
  imageUrl: Joi.string().optional().allow(null, ''),
  locationId: Joi.string().uuid().optional().allow(null, ''),
  currentOperatorId: Joi.string().uuid().optional().allow(null, ''),
  operationalStatus: Joi.string().valid('FREE', 'BUSY', 'RESERVED', 'UNAVAILABLE').optional(),
  status: Joi.string().valid('NEW', 'IN_USE', 'UNDER_MAINTENANCE', 'UNDER_REPAIR', 'IDLE', 'DECOMMISSIONED').optional(),
  qrCode: Joi.string().optional().allow(null, '').max(255),
  isActive: Joi.boolean().optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('NEW', 'IN_USE', 'UNDER_MAINTENANCE', 'UNDER_REPAIR', 'IDLE', 'DECOMMISSIONED').required(),
  reason: Joi.string().optional().max(500),
});

const createBreakdownSchema = Joi.object({
  machineId: Joi.string().uuid().required(),
  severity: Joi.string().valid('CRITICAL', 'HIGH', 'MEDIUM', 'LOW').required(),
  title: Joi.string().required().min(1).max(200),
  description: Joi.string().required().min(1),
  breakdownTime: Joi.date().optional(),
  priority: Joi.string().valid('URGENT', 'HIGH', 'MEDIUM', 'LOW').optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
});

const updateBreakdownSchema = Joi.object({
  assignedTechnician: Joi.string().uuid().optional(),
  rootCause: Joi.string().optional(),
  resolutionNotes: Joi.string().optional(),
  partsUsed: Joi.object().optional(),
  laborHours: Joi.number().min(0).optional(),
  repairCost: Joi.number().min(0).optional(),
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED').optional(),
  priority: Joi.string().valid('URGENT', 'HIGH', 'MEDIUM', 'LOW').optional(),
});

const createMaintenanceScheduleSchema = Joi.object({
  machineId: Joi.string().uuid().required(),
  maintenanceType: Joi.string().valid('DAILY_CHECK', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'EMERGENCY').required(),
  title: Joi.string().required().min(1).max(200),
  description: Joi.string().optional(),
  frequencyDays: Joi.number().integer().min(1).optional(),
  nextDue: Joi.date().required(),
  estimatedHours: Joi.number().min(0).optional(),
  assignedTechnician: Joi.string().uuid().optional(),
  checklist: Joi.object().optional(),
  partsRequired: Joi.object().optional(),
});

const createMaintenanceRecordSchema = Joi.object({
  machineId: Joi.string().uuid().required(),
  scheduleId: Joi.string().uuid().optional(),
  maintenanceType: Joi.string().valid('DAILY_CHECK', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'EMERGENCY').required(),
  performedBy: Joi.string().uuid().optional(),
  performedDate: Joi.date().required(),
  durationHours: Joi.number().min(0).optional(),
  tasksCompleted: Joi.object().optional(),
  partsUsed: Joi.object().optional(),
  cost: Joi.number().min(0).optional(),
  notes: Joi.string().optional(),
  nextMaintenanceDate: Joi.date().optional(),
});

class MachineController {
  // Create machine
  createMachine = async (req: Request, res: Response) => {
    try {
      const { error, value } = createMachineSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details[0].message,
        });
      }

      const companyId = req.tenantId;
      const userId = req.userId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const machine = await machineService.createMachine(companyId, value);

      res.status(201).json({
        success: true,
        message: 'Machine created successfully',
        data: machine,
      });
    } catch (error) {
      logger.error('Error in createMachine:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create machine',
      });
    }
  };

  // Get machines
  getMachines = async (req: Request, res: Response) => {
    try {
      const companyId = req.tenantId;
      const userId = req.userId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const filters = {
        locationId: req.query.locationId as string,
        machineType: req.query.machineType as string,
        status: req.query.status as any,
        search: req.query.search as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      };

      const machines = await machineService.getMachines(companyId, filters);

      res.json({
        success: true,
        data: machines,
      });
    } catch (error) {
      logger.error('Error in getMachines:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch machines',
      });
    }
  };

  // Get machine by ID
  getMachineById = async (req: Request, res: Response) => {
    try {
      const companyId = req.tenantId;
      const userId = req.userId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const { id } = req.params;
      const machine = await machineService.getMachineById(companyId, id);

      res.json({
        success: true,
        data: machine,
      });
    } catch (error) {
      logger.error('Error in getMachineById:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch machine',
      });
    }
  };

  // Update machine
  updateMachine = async (req: Request, res: Response) => {
    try {
      const { error, value } = updateMachineSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details[0].message,
        });
      }

      const companyId = req.tenantId;
      const userId = req.userId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const { id } = req.params;
      const machine = await machineService.updateMachine(companyId, id, value);

      res.json({
        success: true,
        message: 'Machine updated successfully',
        data: machine,
      });
    } catch (error) {
      logger.error('Error in updateMachine:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update machine',
      });
    }
  };

  // Update machine status
  updateMachineStatus = async (req: Request, res: Response) => {
    try {
      const { error, value } = updateStatusSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details[0].message,
        });
      }

      const companyId = req.tenantId;
      const userId = req.userId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const { id } = req.params;
      const { status, reason } = value;
      const changedBy = userId;

      const machine = await machineService.updateMachineStatus(companyId, id, status, reason, changedBy);

      res.json({
        success: true,
        message: 'Machine status updated successfully',
        data: machine,
      });
    } catch (error) {
      logger.error('Error in updateMachineStatus:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update machine status',
      });
    }
  };

  // Create breakdown report
  createBreakdownReport = async (req: Request, res: Response) => {
    try {
      const { error, value } = createBreakdownSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details[0].message,
        });
      }

      const companyId = req.tenantId;
      const userId = req.userId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const reportedBy = userId;
      const breakdown = await machineService.createBreakdownReport(companyId, {
        ...value,
        reportedBy,
      });

      res.status(201).json({
        success: true,
        message: 'Breakdown report created successfully',
        data: breakdown,
      });
    } catch (error) {
      logger.error('Error in createBreakdownReport:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create breakdown report',
      });
    }
  };

  // Get breakdown reports
  getBreakdownReports = async (req: Request, res: Response) => {
    try {
      const companyId = req.tenantId;
      const userId = req.userId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const filters = {
        machineId: req.query.machineId as string,
        status: req.query.status as any,
        severity: req.query.severity as any,
      };

      const breakdowns = await machineService.getBreakdownReports(companyId, filters);

      res.json({
        success: true,
        data: breakdowns,
      });
    } catch (error) {
      logger.error('Error in getBreakdownReports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch breakdown reports',
      });
    }
  };

  // Update breakdown report
  updateBreakdownReport = async (req: Request, res: Response) => {
    try {
      const { error, value } = updateBreakdownSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details[0].message,
        });
      }

      const companyId = req.tenantId;
      const userId = req.userId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const { id } = req.params;
      const breakdown = await machineService.updateBreakdownReport(companyId, id, value);

      res.json({
        success: true,
        message: 'Breakdown report updated successfully',
        data: breakdown,
      });
    } catch (error) {
      logger.error('Error in updateBreakdownReport:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update breakdown report',
      });
    }
  };

  // Create maintenance schedule
  createMaintenanceSchedule = async (req: Request, res: Response) => {
    try {
      const { error, value } = createMaintenanceScheduleSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details[0].message,
        });
      }

      const companyId = req.tenantId;
      const userId = req.userId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const schedule = await machineService.createMaintenanceSchedule(companyId, value);

      res.status(201).json({
        success: true,
        message: 'Maintenance schedule created successfully',
        data: schedule,
      });
    } catch (error) {
      logger.error('Error in createMaintenanceSchedule:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create maintenance schedule',
      });
    }
  };

  // Get maintenance schedules
  getMaintenanceSchedules = async (req: Request, res: Response) => {
    try {
      const companyId = req.tenantId;
      const userId = req.userId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const filters = {
        machineId: req.query.machineId as string,
        dueWithinDays: req.query.dueWithinDays ? parseInt(req.query.dueWithinDays as string) : undefined,
      };

      const schedules = await machineService.getMaintenanceSchedules(companyId, filters);

      res.json({
        success: true,
        data: schedules,
      });
    } catch (error) {
      logger.error('Error in getMaintenanceSchedules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch maintenance schedules',
      });
    }
  };

  // Create maintenance record
  createMaintenanceRecord = async (req: Request, res: Response) => {
    try {
      const { error, value } = createMaintenanceRecordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details[0].message,
        });
      }

      const companyId = req.tenantId;
      const userId = req.userId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const performedBy = userId;
      const record = await machineService.createMaintenanceRecord(companyId, {
        ...value,
        performedBy,
      });

      res.status(201).json({
        success: true,
        message: 'Maintenance record created successfully',
        data: record,
      });
    } catch (error) {
      logger.error('Error in createMaintenanceRecord:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create maintenance record',
      });
    }
  };

  // Get machine analytics
  getMachineAnalytics = async (req: Request, res: Response) => {
    try {
      const companyId = req.tenantId;
      const userId = req.userId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const analytics = await machineService.getMachineAnalytics(companyId);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error in getMachineAnalytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch machine analytics',
      });
    }
  };

  // Delete machine (soft delete)
  deleteMachine = async (req: Request, res: Response) => {
    try {
      const companyId = req.tenantId;
      const userId = req.userId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const { id } = req.params;
      const result = await machineService.deleteMachine(companyId, id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Error in deleteMachine:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Machine not found') {
          return res.status(404).json({
            success: false,
            message: 'Machine not found',
          });
        }
        if (error.message.includes('Cannot delete')) {
          return res.status(400).json({
            success: false,
            message: error.message,
          });
        }
      }
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete machine',
      });
    }
  };
}

export const machineController = new MachineController();
