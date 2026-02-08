import { Request, Response } from 'express';
import { productionService } from '../services/productionService';
import { logger } from '../utils/logger';
import Joi from 'joi';
import { CreateProductionOrderData, UpdateProductionOrderData, CreateWorkOrderData, UpdateWorkOrderData } from '../services/productionService';

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      tenantId?: string;
    }
  }
}

// Validation schemas
const createProductionOrderSchema = Joi.object({
  orderNumber: Joi.string().min(1).max(50).required(),
  customerId: Joi.string().optional(),
  customerName: Joi.string().max(255).optional(),
  productName: Joi.string().min(1).max(255).required(),
  productDescription: Joi.string().max(1000).optional(),
  fiberType: Joi.string().max(100).optional(),
  yarnCount: Joi.string().max(50).optional(),
  gsm: Joi.number().min(1).max(10000).optional(),
  fabricType: Joi.string().max(100).optional(),
  color: Joi.string().max(100).optional(),
  width: Joi.number().min(1).max(5000).optional(),
  quantity: Joi.number().min(0.01).required(),
  uom: Joi.string().min(1).max(20).required(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').required(),
  plannedStartDate: Joi.date().required(),
  plannedEndDate: Joi.date().min(Joi.ref('plannedStartDate')).required(),
  actualStartDate: Joi.date().optional(),
  actualEndDate: Joi.date().optional(),
  status: Joi.string().valid('PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD').required(),
  notes: Joi.string().max(1000).optional(),
  specialInstructions: Joi.string().max(1000).optional(),
});

const updateProductionOrderSchema = Joi.object({
  id: Joi.string().required(),
  orderNumber: Joi.string().min(1).max(50).optional(),
  customerId: Joi.string().optional(),
  customerName: Joi.string().max(255).optional(),
  productName: Joi.string().min(1).max(255).optional(),
  productDescription: Joi.string().max(1000).optional(),
  fiberType: Joi.string().max(100).optional(),
  yarnCount: Joi.string().max(50).optional(),
  gsm: Joi.number().min(1).max(10000).optional(),
  fabricType: Joi.string().max(100).optional(),
  color: Joi.string().max(100).optional(),
  width: Joi.number().min(1).max(5000).optional(),
  quantity: Joi.number().min(0.01).optional(),
  uom: Joi.string().min(1).max(20).optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
  plannedStartDate: Joi.date().optional(),
  plannedEndDate: Joi.date().optional(),
  actualStartDate: Joi.date().optional(),
  actualEndDate: Joi.date().optional(),
  status: Joi.string().valid('PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD').optional(),
  notes: Joi.string().max(1000).optional(),
  specialInstructions: Joi.string().max(1000).optional(),
});

const createWorkOrderSchema = Joi.object({
  productionOrderId: Joi.string().required(),
  operationType: Joi.string().min(1).max(50).required(),
  operationName: Joi.string().min(1).max(255).required(),
  sequence: Joi.number().integer().min(1).required(),
  machineId: Joi.string().optional(),
  operatorId: Joi.string().optional(),
  plannedStartDate: Joi.date().required(),
  plannedEndDate: Joi.date().min(Joi.ref('plannedStartDate')).required(),
  plannedQuantity: Joi.number().min(0.01).required(),
  actualStartDate: Joi.date().optional(),
  actualEndDate: Joi.date().optional(),
  actualQuantity: Joi.number().min(0).optional(),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD').required(),
  qualityCheckpoints: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().max(1000).optional(),
});

const updateWorkOrderSchema = Joi.object({
  id: Joi.string().required(),
  operationType: Joi.string().min(1).max(50).optional(),
  operationName: Joi.string().min(1).max(255).optional(),
  sequence: Joi.number().integer().min(1).optional(),
  machineId: Joi.string().optional(),
  operatorId: Joi.string().optional(),
  plannedStartDate: Joi.date().optional(),
  plannedEndDate: Joi.date().optional(),
  plannedQuantity: Joi.number().min(0.01).optional(),
  actualStartDate: Joi.date().optional(),
  actualEndDate: Joi.date().optional(),
  actualQuantity: Joi.number().min(0).optional(),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD').optional(),
  qualityCheckpoints: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().max(1000).optional(),
});

export class ProductionController {
  // Production Orders CRUD
  async createProductionOrder(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;

      // Validate input
      const { error, value } = createProductionOrderSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const data: CreateProductionOrderData = value;
      const order = await productionService.createProductionOrder(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Production order created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating production order:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create production order',
      });
    }
  }

  async getProductionOrders(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        customerId: req.query.customerId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const orders = await productionService.getProductionOrders(tenantId, filters);

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error: any) {
      logger.error('Error fetching production orders:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch production orders',
      });
    }
  }

  async getProductionOrderById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const orderId = req.params.id;

      const order = await productionService.getProductionOrderById(tenantId, orderId);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Error fetching production order:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to fetch production order',
      });
    }
  }

  async updateProductionOrder(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;

      // Validate input
      const { error, value } = updateProductionOrderSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const data: UpdateProductionOrderData = value;
      const order = await productionService.updateProductionOrder(tenantId, userId, data);

      res.status(200).json({
        success: true,
        data: order,
        message: 'Production order updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating production order:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update production order',
      });
    }
  }

  async deleteProductionOrder(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const orderId = req.params.id;

      await productionService.deleteProductionOrder(tenantId, orderId);

      res.status(200).json({
        success: true,
        message: 'Production order deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting production order:', error);
      const statusCode = error.message.includes('existing work orders') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to delete production order',
      });
    }
  }

  // Work Orders CRUD
  async createWorkOrder(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;

      // Validate input
      const { error, value } = createWorkOrderSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const data: CreateWorkOrderData = value;
      const workOrder = await productionService.createWorkOrder(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: workOrder,
        message: 'Work order created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating work order:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create work order',
      });
    }
  }

  async getWorkOrders(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const filters = {
        productionOrderId: req.query.productionOrderId as string,
        status: req.query.status as string,
        operatorId: req.query.operatorId as string,
      };

      const workOrders = await productionService.getWorkOrders(tenantId, filters);

      res.status(200).json({
        success: true,
        data: workOrders,
      });
    } catch (error: any) {
      logger.error('Error fetching work orders:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch work orders',
      });
    }
  }

  async updateWorkOrder(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;

      // Validate input
      const { error, value } = updateWorkOrderSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const data: UpdateWorkOrderData = value;
      const workOrder = await productionService.updateWorkOrder(tenantId, userId, data);

      res.status(200).json({
        success: true,
        data: workOrder,
        message: 'Work order updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating work order:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update work order',
      });
    }
  }

  // Analytics
  async getProductionSummary(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const dateRange = req.query.startDate && req.query.endDate ? {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string),
      } : undefined;

      const summary = await productionService.getProductionSummary(tenantId, dateRange);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      logger.error('Error fetching production summary:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch production summary',
      });
    }
  }

  // Reference Data
  async getProductionStatuses(req: Request, res: Response) {
    try {
      const statuses = await productionService.getProductionStatuses();

      res.status(200).json({
        success: true,
        data: statuses,
      });
    } catch (error: any) {
      logger.error('Error fetching production statuses:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch production statuses',
      });
    }
  }

  async getPriorityLevels(req: Request, res: Response) {
    try {
      const priorities = await productionService.getPriorityLevels();

      res.status(200).json({
        success: true,
        data: priorities,
      });
    } catch (error: any) {
      logger.error('Error fetching priority levels:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch priority levels',
      });
    }
  }

  async getOperationTypes(req: Request, res: Response) {
    try {
      const operations = await productionService.getOperationTypes();

      res.status(200).json({
        success: true,
        data: operations,
      });
    } catch (error: any) {
      logger.error('Error fetching operation types:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch operation types',
      });
    }
  }

  async getTextileOperations(req: Request, res: Response) {
    try {
      const operations = await productionService.getTextileOperations();

      res.status(200).json({
        success: true,
        data: operations,
      });
    } catch (error: any) {
      logger.error('Error fetching textile operations:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch textile operations',
      });
    }
  }
}

export const productionController = new ProductionController();
