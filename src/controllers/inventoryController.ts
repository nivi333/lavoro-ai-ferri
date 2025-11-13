import { Request, Response } from 'express';
import { inventoryService } from '../services/inventoryService';
import { logger } from '../utils/logger';
import { CreateInventoryItemData, UpdateInventoryItemData, StockMovementData } from '../services/inventoryService';

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export class InventoryController {
  // Create inventory item
  async createInventoryItem(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;

      const data: CreateInventoryItemData = req.body;

      // Validate required fields
      if (!data.locationId || !data.name || !data.sku || !data.category || data.unitCost === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: locationId, name, sku, category, unitCost'
        });
      }

      const item = await inventoryService.createInventoryItem(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: item,
        message: 'Inventory item created successfully'
      });
    } catch (error: any) {
      logger.error('Error creating inventory item:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create inventory item'
      });
    }
  }

  // Update inventory item
  async updateInventoryItem(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { id } = req.params;

      const data: UpdateInventoryItemData = {
        id,
        ...req.body
      };

      const item = await inventoryService.updateInventoryItem(tenantId, userId, data);

      res.json({
        success: true,
        data: item,
        message: 'Inventory item updated successfully'
      });
    } catch (error: any) {
      logger.error('Error updating inventory item:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update inventory item'
      });
    }
  }

  // Get inventory items
  async getInventoryItems(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const filters = {
        locationId: req.query.locationId as string,
        category: req.query.category as string,
        search: req.query.search as string,
        lowStock: req.query.lowStock === 'true',
      };

      const items = await inventoryService.getInventoryItems(tenantId, filters);

      res.json({
        success: true,
        data: items,
        count: items.length
      });
    } catch (error: any) {
      logger.error('Error fetching inventory items:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch inventory items'
      });
    }
  }

  // Get inventory item by ID
  async getInventoryItemById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const item = await inventoryService.getInventoryItemById(tenantId, id);

      res.json({
        success: true,
        data: item
      });
    } catch (error: any) {
      logger.error('Error fetching inventory item:', error);
      if (error.message === 'Inventory item not found') {
        res.status(404).json({
          success: false,
          error: 'Inventory item not found'
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to fetch inventory item'
        });
      }
    }
  }

  // Delete inventory item (soft delete)
  async deleteInventoryItem(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { id } = req.params;

      await inventoryService.deleteInventoryItem(tenantId, userId, id);

      res.json({
        success: true,
        message: 'Inventory item deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error deleting inventory item:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete inventory item'
      });
    }
  }

  // Record stock movement
  async recordStockMovement(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;

      const data: StockMovementData = {
        ...req.body,
        performedBy: userId
      };

      // Validate required fields
      if (!data.itemId || !data.movementType || data.quantity === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: itemId, movementType, quantity'
        });
      }

      const movement = await inventoryService.recordStockMovement(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: movement,
        message: 'Stock movement recorded successfully'
      });
    } catch (error: any) {
      logger.error('Error recording stock movement:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to record stock movement'
      });
    }
  }

  // Get stock movements
  async getStockMovements(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { itemId } = req.params;

      const filters = {
        movementType: req.query.movementType as string,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
        performedBy: req.query.performedBy as string,
      };

      const movements = await inventoryService.getStockMovements(tenantId, itemId, filters);

      res.json({
        success: true,
        data: movements,
        count: movements.length
      });
    } catch (error: any) {
      logger.error('Error fetching stock movements:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch stock movements'
      });
    }
  }

  // Get low stock alerts
  async getLowStockAlerts(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;

      const alerts = await inventoryService.getLowStockAlerts(tenantId);

      res.json({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error: any) {
      logger.error('Error fetching low stock alerts:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch low stock alerts'
      });
    }
  }

  // Get inventory summary
  async getInventorySummary(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { locationId } = req.query;

      const summary = await inventoryService.getInventorySummary(tenantId, locationId as string);

      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      logger.error('Error fetching inventory summary:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch inventory summary'
      });
    }
  }

  // Get inventory categories
  async getInventoryCategories(req: Request, res: Response) {
    try {
      const categories = [
        { value: 'RAW_MATERIAL', label: 'Raw Material' },
        { value: 'WORK_IN_PROGRESS', label: 'Work in Progress' },
        { value: 'FINISHED_GOODS', label: 'Finished Goods' },
        { value: 'CONSUMABLES', label: 'Consumables' },
        { value: 'PACKAGING', label: 'Packaging' },
      ];

      res.json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      logger.error('Error fetching inventory categories:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch inventory categories'
      });
    }
  }

  // Get stock movement types
  async getStockMovementTypes(req: Request, res: Response) {
    try {
      const movementTypes = [
        { value: 'RECEIPT', label: 'Receipt' },
        { value: 'ISSUE', label: 'Issue' },
        { value: 'TRANSFER', label: 'Transfer' },
        { value: 'ADJUSTMENT', label: 'Adjustment' },
        { value: 'RETURN', label: 'Return' },
      ];

      res.json({
        success: true,
        data: movementTypes
      });
    } catch (error: any) {
      logger.error('Error fetching stock movement types:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch stock movement types'
      });
    }
  }

  // Get textile-specific data
  async getTextileSpecifications(req: Request, res: Response) {
    try {
      const fiberTypes = [
        'Cotton', 'Silk', 'Wool', 'Polyester', 'Nylon', 'Acrylic', 'Rayon', 'Linen', 'Hemp', 'Bamboo'
      ];

      const fabricTypes = [
        'Woven', 'Knitted', 'Non-woven', 'Lace', 'Embroidery', 'Print'
      ];

      const colors = [
        'White', 'Black', 'Navy', 'Red', 'Green', 'Yellow', 'Blue', 'Purple', 'Pink', 'Gray', 'Brown', 'Beige'
      ];

      res.json({
        success: true,
        data: {
          fiberTypes,
          fabricTypes,
          colors
        }
      });
    } catch (error: any) {
      logger.error('Error fetching textile specifications:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch textile specifications'
      });
    }
  }
}

export const inventoryController = new InventoryController();
