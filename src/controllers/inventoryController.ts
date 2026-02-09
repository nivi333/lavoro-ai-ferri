import { Request, Response } from 'express';
import {
  inventoryService,
  LocationInventoryData,
  StockMovementData,
  StockReservationData,
  InventoryFilters,
} from '../services/inventoryService';
import { logger } from '../utils/logger';
import { StockMovementType, ReservationType, AlertStatus } from '@prisma/client';

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
      userRole?: string;
    }
  }
}

export class InventoryController {
  // Get location inventory
  async getLocationInventory(req: Request, res: Response) {
    try {
      const companyId = req.tenantId!;

      const filters: InventoryFilters = {
        locationId: req.query.locationId as string,
        productId: req.query.productId as string,
        lowStock: req.query.lowStock === 'true',
        outOfStock: req.query.outOfStock === 'true',
        search: req.query.search as string,
      };

      const inventory = await inventoryService.getLocationInventory(companyId, filters);

      res.json({
        success: true,
        data: inventory,
        count: inventory.length,
      });
    } catch (error: any) {
      logger.error('Error fetching location inventory:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch inventory',
      });
    }
  }

  // Update location inventory
  async updateLocationInventory(req: Request, res: Response) {
    try {
      const companyId = req.tenantId!;
      const userId = req.userId!;

      const data: LocationInventoryData = req.body;

      // Validate required fields
      if (!data.productId || !data.locationId || data.stockQuantity === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: productId, locationId, stockQuantity',
        });
      }

      const inventory = await inventoryService.updateLocationInventory(companyId, data, userId);

      res.json({
        success: true,
        data: inventory,
        message: 'Inventory updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating inventory:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update inventory',
      });
    }
  }

  // Record stock movement
  async recordStockMovement(req: Request, res: Response) {
    try {
      const companyId = req.tenantId!;
      const userId = req.userId!;

      const data: StockMovementData = {
        ...req.body,
        createdBy: userId,
      };

      // Validate required fields
      if (!data.productId || !data.movementType || data.quantity === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: productId, movementType, quantity',
        });
      }

      // Validate movement type
      if (!Object.values(StockMovementType || {}).includes(data.movementType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid movement type',
        });
      }

      const movement = await inventoryService.recordStockMovement(companyId, data);

      res.status(201).json({
        success: true,
        data: movement,
        message: 'Stock movement recorded successfully',
      });
    } catch (error: any) {
      logger.error('Error recording stock movement:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to record stock movement',
      });
    }
  }

  // Create stock reservation
  async createStockReservation(req: Request, res: Response) {
    try {
      const companyId = req.tenantId!;
      const userId = req.userId!;

      const data: StockReservationData = {
        ...req.body,
        createdBy: userId,
      };

      // Validate required fields
      if (
        !data.productId ||
        !data.locationId ||
        data.reservedQuantity === undefined ||
        !data.reservationType
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Missing required fields: productId, locationId, reservedQuantity, reservationType',
        });
      }

      // Validate reservation type
      if (!Object.values(ReservationType || {}).includes(data.reservationType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid reservation type',
        });
      }

      const reservation = await inventoryService.createStockReservation(companyId, data);

      res.status(201).json({
        success: true,
        data: reservation,
        message: 'Stock reservation created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating stock reservation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create stock reservation',
      });
    }
  }

  // Release stock reservation
  async releaseStockReservation(req: Request, res: Response) {
    try {
      const companyId = req.tenantId!;
      const userId = req.userId!;
      const { reservationId } = req.params;

      const result = await inventoryService.releaseStockReservation(
        companyId,
        reservationId,
        userId
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Error releasing stock reservation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to release stock reservation',
      });
    }
  }

  // Get stock alerts
  async getStockAlerts(req: Request, res: Response) {
    try {
      const companyId = req.tenantId!;
      const status = req.query.status as AlertStatus | undefined;

      const alerts = await inventoryService.getStockAlerts(companyId, status);

      res.json({
        success: true,
        data: alerts,
        count: alerts.length,
      });
    } catch (error: any) {
      logger.error('Error fetching stock alerts:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch stock alerts',
      });
    }
  }

  // Acknowledge stock alert
  async acknowledgeStockAlert(req: Request, res: Response) {
    try {
      const companyId = req.tenantId!;
      const userId = req.userId!;
      const { alertId } = req.params;

      const result = await inventoryService.acknowledgeStockAlert(companyId, alertId, userId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error('Error acknowledging stock alert:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to acknowledge stock alert',
      });
    }
  }

  // Get stock movement types enum
  async getStockMovementTypes(req: Request, res: Response) {
    try {
      const movementTypes = Object.values(StockMovementType || {}).map(type => ({
        value: type,
        label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      }));

      res.json({
        success: true,
        data: movementTypes,
      });
    } catch (error: any) {
      logger.error('Error fetching stock movement types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock movement types',
      });
    }
  }

  // Get reservation types enum
  async getReservationTypes(req: Request, res: Response) {
    try {
      const reservationTypes = Object.values(ReservationType || {}).map(type => ({
        value: type,
        label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      }));

      res.json({
        success: true,
        data: reservationTypes,
      });
    } catch (error: any) {
      logger.error('Error fetching reservation types:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch reservation types',
      });
    }
  }

  // Delete inventory
  async deleteInventory(req: Request, res: Response) {
    try {
      const { inventoryId } = req.params;

      if (!inventoryId) {
        return res.status(400).json({
          success: false,
          error: 'Inventory ID is required',
        });
      }

      await inventoryService.deleteInventory(inventoryId);

      res.json({
        success: true,
        message: 'Inventory deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting inventory:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete inventory',
      });
    }
  }
}

export const inventoryController = new InventoryController();
