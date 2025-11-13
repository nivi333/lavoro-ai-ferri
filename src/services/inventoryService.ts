import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { databaseManager } from '../database/connection';

export interface CreateInventoryItemData {
  locationId: string;
  name: string;
  sku: string;
  description?: string;
  category: 'RAW_MATERIAL' | 'WORK_IN_PROGRESS' | 'FINISHED_GOODS' | 'CONSUMABLES' | 'PACKAGING';
  subCategory?: string;
  fiberType?: string;
  yarnCount?: string;
  gsm?: number;
  fabricType?: string;
  color?: string;
  width?: number;
  weight?: number;
  uom?: string;
  currentStock: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  unitCost: number;
  primarySupplierId?: string;
  supplierSku?: string;
  batchNumber?: string;
  lotNumber?: string;
  expiryDate?: Date;
  qualityStatus?: string;
}

export interface UpdateInventoryItemData extends Partial<CreateInventoryItemData> {
  id: string;
}

export interface StockMovementData {
  itemId: string;
  fromLocationId?: string;
  toLocationId?: string;
  movementType: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  batchNumber?: string;
  lotNumber?: string;
  notes?: string;
  performedBy: string;
}

export class InventoryService {
  private getTenantPrisma(tenantId: string): PrismaClient {
    return databaseManager.getTenantPrisma(tenantId);
  }

  async createInventoryItem(tenantId: string, userId: string, data: CreateInventoryItemData) {
    try {
      const prisma = this.getTenantPrisma(tenantId);

      // Calculate available stock
      const availableStock = data.currentStock;

      const item = await prisma.tenantInventoryItem.create({
        data: {
          tenantId,
          locationId: data.locationId,
          name: data.name,
          sku: data.sku,
          description: data.description,
          category: data.category,
          subCategory: data.subCategory,
          fiberType: data.fiberType,
          yarnCount: data.yarnCount,
          gsm: data.gsm,
          fabricType: data.fabricType,
          color: data.color,
          width: data.width,
          weight: data.weight,
          uom: data.uom || 'METER',
          currentStock: data.currentStock,
          reservedStock: 0,
          availableStock: availableStock,
          minStockLevel: data.minStockLevel || 0,
          maxStockLevel: data.maxStockLevel,
          reorderPoint: data.reorderPoint || 0,
          unitCost: data.unitCost,
          averageCost: data.unitCost,
          primarySupplierId: data.primarySupplierId,
          supplierSku: data.supplierSku,
          batchNumber: data.batchNumber,
          lotNumber: data.lotNumber,
          expiryDate: data.expiryDate,
          qualityStatus: data.qualityStatus || 'PENDING',
        },
        include: {
          location: true,
          primarySupplier: true,
        },
      });

      logger.info(`Inventory item created: ${item.name} (${item.sku}) by user ${userId}`);
      return item;
    } catch (error) {
      logger.error('Error creating inventory item:', error);
      throw error;
    }
  }

  async updateInventoryItem(tenantId: string, userId: string, data: UpdateInventoryItemData) {
    try {
      const prisma = this.getTenantPrisma(tenantId);

      const existingItem = await prisma.tenantInventoryItem.findUnique({
        where: { id: data.id },
      });

      if (!existingItem) {
        throw new Error('Inventory item not found');
      }

      // Calculate available stock
      const currentStock = data.currentStock ?? existingItem.currentStock;
      const reservedStock = existingItem.reservedStock;
      const availableStock = currentStock - reservedStock;

      const item = await prisma.tenantInventoryItem.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          subCategory: data.subCategory,
          fiberType: data.fiberType,
          yarnCount: data.yarnCount,
          gsm: data.gsm,
          fabricType: data.fabricType,
          color: data.color,
          width: data.width,
          weight: data.weight,
          uom: data.uom,
          currentStock: currentStock,
          availableStock: availableStock,
          minStockLevel: data.minStockLevel,
          maxStockLevel: data.maxStockLevel,
          reorderPoint: data.reorderPoint,
          unitCost: data.unitCost,
          primarySupplierId: data.primarySupplierId,
          supplierSku: data.supplierSku,
          batchNumber: data.batchNumber,
          lotNumber: data.lotNumber,
          expiryDate: data.expiryDate,
          qualityStatus: data.qualityStatus,
        },
        include: {
          location: true,
          primarySupplier: true,
        },
      });

      logger.info(`Inventory item updated: ${item.name} (${item.sku}) by user ${userId}`);
      return item;
    } catch (error) {
      logger.error('Error updating inventory item:', error);
      throw error;
    }
  }

  async getInventoryItems(tenantId: string, filters?: {
    locationId?: string;
    category?: string;
    search?: string;
    lowStock?: boolean;
  }) {
    try {
      const prisma = this.getTenantPrisma(tenantId);

      const where: any = {};

      if (filters?.locationId) {
        where.locationId = filters.locationId;
      }

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters?.lowStock) {
        where.currentStock = {
          lte: prisma.tenantInventoryItem.fields.minStockLevel,
        };
      }

      const items = await prisma.tenantInventoryItem.findMany({
        where,
        include: {
          location: true,
          primarySupplier: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      return items;
    } catch (error) {
      logger.error('Error fetching inventory items:', error);
      throw error;
    }
  }

  async getInventoryItemById(tenantId: string, itemId: string) {
    try {
      const prisma = this.getTenantPrisma(tenantId);

      const item = await prisma.tenantInventoryItem.findUnique({
        where: { id: itemId },
        include: {
          location: true,
          primarySupplier: true,
          stockMovements: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!item) {
        throw new Error('Inventory item not found');
      }

      return item;
    } catch (error) {
      logger.error('Error fetching inventory item:', error);
      throw error;
    }
  }

  async deleteInventoryItem(tenantId: string, userId: string, itemId: string) {
    try {
      const prisma = this.getTenantPrisma(tenantId);

      const item = await prisma.tenantInventoryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new Error('Inventory item not found');
      }

      // Check if item has any stock movements or is referenced elsewhere
      const stockMovementsCount = await prisma.tenantStockMovement.count({
        where: { itemId },
      });

      if (stockMovementsCount > 0) {
        throw new Error('Cannot delete item with existing stock movements');
      }

      await prisma.tenantInventoryItem.update({
        where: { id: itemId },
        data: { isActive: false },
      });

      logger.info(`Inventory item deactivated: ${item.name} (${item.sku}) by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  async recordStockMovement(tenantId: string, userId: string, data: StockMovementData) {
    try {
      const prisma = this.getTenantPrisma(tenantId);

      const result = await prisma.$transaction(async (tx) => {
        // Create stock movement record
        const movement = await tx.tenantStockMovement.create({
          data: {
            tenantId,
            itemId: data.itemId,
            fromLocationId: data.fromLocationId,
            toLocationId: data.toLocationId,
            movementType: data.movementType,
            quantity: data.quantity,
            unitCost: data.unitCost || 0,
            referenceType: data.referenceType,
            referenceId: data.referenceId,
            batchNumber: data.batchNumber,
            lotNumber: data.lotNumber,
            notes: data.notes,
            performedBy: data.performedBy,
          },
        });

        // Update inventory item stock levels
        const item = await tx.tenantInventoryItem.findUnique({
          where: { id: data.itemId },
        });

        if (!item) {
          throw new Error('Inventory item not found');
        }

        let newStock = item.currentStock;
        let newReservedStock = item.reservedStock;

        switch (data.movementType) {
          case 'RECEIPT':
            newStock += data.quantity;
            break;
          case 'ISSUE':
            newStock -= data.quantity;
            break;
          case 'TRANSFER':
            // For transfers, stock stays the same but location changes
            // This would need additional logic for location-based inventory
            break;
          case 'ADJUSTMENT':
            newStock = data.quantity; // Absolute adjustment
            break;
          case 'RETURN':
            newStock += data.quantity;
            break;
        }

        // Ensure stock doesn't go negative
        if (newStock < 0) {
          throw new Error('Insufficient stock for this operation');
        }

        const availableStock = newStock - newReservedStock;

        await tx.tenantInventoryItem.update({
          where: { id: data.itemId },
          data: {
            currentStock: newStock,
            availableStock: availableStock,
            averageCost: data.unitCost ? ((item.averageCost * item.currentStock + data.unitCost * data.quantity) / newStock) : item.averageCost,
            lastPurchasePrice: data.movementType === 'RECEIPT' ? data.unitCost : item.lastPurchasePrice,
            lastPurchaseDate: data.movementType === 'RECEIPT' ? new Date() : item.lastPurchaseDate,
          },
        });

        return movement;
      });

      logger.info(`Stock movement recorded: ${data.movementType} ${data.quantity} units for item ${data.itemId} by user ${userId}`);
      return result;
    } catch (error) {
      logger.error('Error recording stock movement:', error);
      throw error;
    }
  }

  async getStockMovements(tenantId: string, itemId?: string, filters?: {
    movementType?: string;
    fromDate?: Date;
    toDate?: Date;
    performedBy?: string;
  }) {
    try {
      const prisma = this.getTenantPrisma(tenantId);

      const where: any = {};

      if (itemId) {
        where.itemId = itemId;
      }

      if (filters?.movementType) {
        where.movementType = filters.movementType;
      }

      if (filters?.performedBy) {
        where.performedBy = filters.performedBy;
      }

      if (filters?.fromDate || filters?.toDate) {
        where.createdAt = {};
        if (filters.fromDate) {
          where.createdAt.gte = filters.fromDate;
        }
        if (filters.toDate) {
          where.createdAt.lte = filters.toDate;
        }
      }

      const movements = await prisma.tenantStockMovement.findMany({
        where,
        include: {
          item: true,
          fromLocation: true,
          toLocation: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return movements;
    } catch (error) {
      logger.error('Error fetching stock movements:', error);
      throw error;
    }
  }

  async getLowStockAlerts(tenantId: string) {
    try {
      const prisma = this.getTenantPrisma(tenantId);

      const lowStockItems = await prisma.tenantInventoryItem.findMany({
        where: {
          isActive: true,
          currentStock: {
            lte: prisma.tenantInventoryItem.fields.minStockLevel,
          },
        },
        include: {
          location: true,
          primarySupplier: true,
        },
        orderBy: { currentStock: 'asc' },
      });

      return lowStockItems;
    } catch (error) {
      logger.error('Error fetching low stock alerts:', error);
      throw error;
    }
  }

  async getInventorySummary(tenantId: string, locationId?: string) {
    try {
      const prisma = this.getTenantPrisma(tenantId);

      const where: any = { isActive: true };
      if (locationId) {
        where.locationId = locationId;
      }

      const summary = await prisma.tenantInventoryItem.aggregate({
        where,
        _count: { id: true },
        _sum: {
          currentStock: true,
          availableStock: true,
          unitCost: true,
        },
      });

      const lowStockCount = await prisma.tenantInventoryItem.count({
        where: {
          ...where,
          currentStock: {
            lte: prisma.tenantInventoryItem.fields.minStockLevel,
          },
        },
      });

      return {
        totalItems: summary._count.id,
        totalStockValue: (summary._sum.currentStock || 0) * (summary._sum.unitCost || 0),
        totalStockQuantity: summary._sum.currentStock || 0,
        availableStockQuantity: summary._sum.availableStock || 0,
        lowStockItemsCount: lowStockCount,
      };
    } catch (error) {
      logger.error('Error fetching inventory summary:', error);
      throw error;
    }
  }
}

export const inventoryService = new InventoryService();
