import {
  PrismaClient,
  StockMovementType,
  ReservationType,
  ReservationStatus,
  AlertType,
  AlertStatus,
} from '@prisma/client';
import { globalPrisma } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

const prisma = globalPrisma;

// ============================================
// INTERFACES
// ============================================

export interface LocationInventoryData {
  productId: string;
  locationId: string;
  stockQuantity: number;
  reservedQuantity?: number;
  reorderLevel?: number;
  maxStockLevel?: number;
}

export interface StockMovementData {
  productId: string;
  fromLocationId?: string;
  toLocationId?: string;
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdBy: string;
}

export interface StockReservationData {
  productId: string;
  locationId: string;
  orderId?: string;
  reservedQuantity: number;
  reservationType: ReservationType;
  expiresAt?: Date;
  notes?: string;
  createdBy: string;
}

export interface InventoryFilters {
  locationId?: string;
  productId?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  search?: string;
}

export interface StockAlert {
  id: string;
  alertId: string;
  productId: string;
  locationId: string;
  alertType: AlertType;
  currentStock: number;
  thresholdLevel: number;
  status: AlertStatus;
  createdAt: Date;
  product?: {
    name: string;
    product_code: string;
    sku: string;
  };
  location?: {
    name: string;
    locationId: string;
  };
}

// ============================================
// INVENTORY SERVICE CLASS
// ============================================

class InventoryService {
  private prisma = prisma;

  /**
   * Generate unique inventory code for company
   */
  private async generateInventoryCode(companyId: string): Promise<string> {
    try {
      const lastInventory = await this.prisma.location_inventory.findFirst({
        where: { company_id: companyId },
        orderBy: { inventory_code: 'desc' },
        select: { inventory_code: true },
      });

      if (!lastInventory) {
        return 'INV001';
      }

      const numericPart = parseInt(lastInventory.inventory_code.substring(3), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `INV${next.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating inventory code:', error);
      return `INV${Date.now().toString().slice(-3)}`;
    }
  }

  /**
   * Get inventory for a specific location or all locations
   */
  async getLocationInventory(companyId: string, filters: InventoryFilters = {}) {
    try {
      const whereClause: any = {
        company_id: companyId,
      };

      if (filters.locationId) {
        whereClause.location_id = filters.locationId;
      }

      if (filters.productId) {
        whereClause.product_id = filters.productId;
      }

      if (filters.lowStock) {
        whereClause.available_quantity = {
          lte: whereClause.reorder_level || 0,
        };
      }

      if (filters.outOfStock) {
        whereClause.available_quantity = {
          lte: 0,
        };
      }

      const inventory = await this.prisma.location_inventory.findMany({
        where: whereClause,
        include: {
          product: {
            select: {
              id: true,
              product_id: true,
              product_code: true,
              sku: true,
              name: true,
              description: true,
              unit_of_measure: true,
              cost_price: true,
              selling_price: true,
              image_url: true,
              is_active: true,
            },
          },
          location: {
            select: {
              id: true,
              location_id: true,
              name: true,
              is_default: true,
              is_headquarters: true,
            },
          },
        },
        orderBy: [{ location: { name: 'asc' } }, { product: { name: 'asc' } }],
      });

      return inventory.map(item => ({
        id: item.id,
        inventoryCode: item.inventory_code,
        productId: item.product_id,
        locationId: item.location_id,
        stockQuantity: Number(item.stock_quantity),
        reservedQuantity: Number(item.reserved_quantity),
        availableQuantity: Number(item.available_quantity),
        reorderLevel: item.reorder_level ? Number(item.reorder_level) : null,
        maxStockLevel: item.max_stock_level ? Number(item.max_stock_level) : null,
        lastUpdated: item.last_updated,
        updatedBy: item.updated_by,
        product: item.product,
        location: item.location,
      }));
    } catch (error) {
      console.error('Error fetching location inventory:', error);
      throw new Error('Failed to fetch inventory data');
    }
  }

  /**
   * Update inventory for a specific product at a location
   */
  async updateLocationInventory(companyId: string, data: LocationInventoryData, updatedBy: string) {
    try {
      const availableQuantity = data.stockQuantity - (data.reservedQuantity || 0);

      // Check if inventory exists
      const existingInventory = await this.prisma.location_inventory.findUnique({
        where: {
          product_id_location_id: {
            product_id: data.productId,
            location_id: data.locationId,
          },
        },
      });

      let inventory;
      if (existingInventory) {
        // Update existing inventory
        inventory = await this.prisma.location_inventory.update({
          where: {
            product_id_location_id: {
              product_id: data.productId,
              location_id: data.locationId,
            },
          },
          data: {
            stock_quantity: data.stockQuantity,
            reserved_quantity: data.reservedQuantity || 0,
            available_quantity: availableQuantity,
            reorder_level: data.reorderLevel,
            max_stock_level: data.maxStockLevel,
            last_updated: new Date(),
            updated_by: updatedBy,
          },
          include: {
            product: true,
            location: true,
          },
        });
      } else {
        // Create new inventory with generated code
        const inventoryCode = await this.generateInventoryCode(companyId);
        inventory = await this.prisma.location_inventory.create({
          data: {
            inventory_code: inventoryCode,
            product_id: data.productId,
            location_id: data.locationId,
            company_id: companyId,
            stock_quantity: data.stockQuantity,
            reserved_quantity: data.reservedQuantity || 0,
            available_quantity: availableQuantity,
            reorder_level: data.reorderLevel,
            max_stock_level: data.maxStockLevel,
            updated_by: updatedBy,
          },
          include: {
            product: true,
            location: true,
          },
        });
      }

      // Check for low stock alerts
      await this.checkAndCreateStockAlerts(companyId, data.productId, data.locationId);

      return {
        id: inventory.id,
        inventoryCode: inventory.inventory_code,
        productId: inventory.product_id,
        locationId: inventory.location_id,
        stockQuantity: Number(inventory.stock_quantity),
        reservedQuantity: Number(inventory.reserved_quantity),
        availableQuantity: Number(inventory.available_quantity),
        reorderLevel: inventory.reorder_level ? Number(inventory.reorder_level) : null,
        maxStockLevel: inventory.max_stock_level ? Number(inventory.max_stock_level) : null,
        lastUpdated: inventory.last_updated,
        updatedBy: inventory.updated_by,
        product: inventory.product,
        location: inventory.location,
      };
    } catch (error) {
      console.error('Error updating location inventory:', error);
      throw new Error('Failed to update inventory');
    }
  }

  /**
   * Record stock movement
   */
  async recordStockMovement(companyId: string, data: StockMovementData) {
    try {
      const movementId = await this.generateMovementId(companyId);
      const totalCost = data.unitCost ? data.quantity * data.unitCost : null;

      const movement = await this.prisma.stock_movements.create({
        data: {
          movement_id: movementId,
          product_id: data.productId,
          company_id: companyId,
          from_location_id: data.fromLocationId,
          to_location_id: data.toLocationId,
          movement_type: data.movementType,
          quantity: data.quantity,
          unit_cost: data.unitCost,
          total_cost: totalCost,
          reference_type: data.referenceType,
          reference_id: data.referenceId,
          notes: data.notes,
          created_by: data.createdBy,
        },
        include: {
          from_location: true,
          to_location: true,
        },
      });

      // Update inventory quantities based on movement type
      await this.updateInventoryFromMovement(companyId, data);

      return {
        id: movement.id,
        movementId: movement.movement_id,
        productId: movement.product_id,
        fromLocationId: movement.from_location_id,
        toLocationId: movement.to_location_id,
        movementType: movement.movement_type,
        quantity: Number(movement.quantity),
        unitCost: movement.unit_cost ? Number(movement.unit_cost) : null,
        totalCost: movement.total_cost ? Number(movement.total_cost) : null,
        referenceType: movement.reference_type,
        referenceId: movement.reference_id,
        notes: movement.notes,
        createdBy: movement.created_by,
        createdAt: movement.created_at,
        fromLocation: movement.from_location,
        toLocation: movement.to_location,
      };
    } catch (error) {
      console.error('Error recording stock movement:', error);
      throw new Error('Failed to record stock movement');
    }
  }

  /**
   * Create stock reservation
   */
  async createStockReservation(companyId: string, data: StockReservationData) {
    try {
      // Check if enough stock is available
      const inventory = await this.prisma.location_inventory.findUnique({
        where: {
          product_id_location_id: {
            product_id: data.productId,
            location_id: data.locationId,
          },
        },
      });

      if (!inventory || Number(inventory.available_quantity) < data.reservedQuantity) {
        throw new Error('Insufficient stock available for reservation');
      }

      const reservationId = await this.generateReservationId(companyId);

      const reservation = await this.prisma.stock_reservations.create({
        data: {
          reservation_id: reservationId,
          product_id: data.productId,
          location_id: data.locationId,
          company_id: companyId,
          order_id: data.orderId,
          reserved_quantity: data.reservedQuantity,
          reservation_type: data.reservationType,
          expires_at: data.expiresAt,
          notes: data.notes,
          created_by: data.createdBy,
        },
        include: {
          product: true,
          location: true,
        },
      });

      // Update inventory reserved quantity
      await this.prisma.location_inventory.update({
        where: {
          product_id_location_id: {
            product_id: data.productId,
            location_id: data.locationId,
          },
        },
        data: {
          reserved_quantity: {
            increment: data.reservedQuantity,
          },
          available_quantity: {
            decrement: data.reservedQuantity,
          },
        },
      });

      return {
        id: reservation.id,
        reservationId: reservation.reservation_id,
        productId: reservation.product_id,
        locationId: reservation.location_id,
        orderId: reservation.order_id,
        reservedQuantity: Number(reservation.reserved_quantity),
        reservationType: reservation.reservation_type,
        status: reservation.status,
        expiresAt: reservation.expires_at,
        notes: reservation.notes,
        createdBy: reservation.created_by,
        createdAt: reservation.created_at,
        updatedAt: reservation.updated_at,
        product: reservation.product,
        location: reservation.location,
      };
    } catch (error) {
      console.error('Error creating stock reservation:', error);
      throw error;
    }
  }

  /**
   * Release stock reservation
   */
  async releaseStockReservation(companyId: string, reservationId: string, releasedBy: string) {
    try {
      const reservation = await this.prisma.stock_reservations.findFirst({
        where: {
          company_id: companyId,
          reservation_id: reservationId,
          status: ReservationStatus.ACTIVE,
        },
      });

      if (!reservation) {
        throw new Error('Active reservation not found');
      }

      // Update reservation status
      await this.prisma.stock_reservations.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.CANCELLED,
          updated_at: new Date(),
        },
      });

      // Update inventory quantities
      await this.prisma.location_inventory.update({
        where: {
          product_id_location_id: {
            product_id: reservation.product_id,
            location_id: reservation.location_id,
          },
        },
        data: {
          reserved_quantity: {
            decrement: Number(reservation.reserved_quantity),
          },
          available_quantity: {
            increment: Number(reservation.reserved_quantity),
          },
        },
      });

      return { success: true, message: 'Stock reservation released successfully' };
    } catch (error) {
      console.error('Error releasing stock reservation:', error);
      throw error;
    }
  }

  /**
   * Get stock alerts
   */
  async getStockAlerts(companyId: string, status?: AlertStatus): Promise<StockAlert[]> {
    try {
      const whereClause: any = { company_id: companyId };
      if (status) {
        whereClause.status = status;
      }

      const alerts = await this.prisma.stock_alerts.findMany({
        where: whereClause,
        include: {
          location: {
            select: {
              name: true,
              location_id: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      // Get product details separately (since we don't have direct relation)
      const alertsWithProducts = await Promise.all(
        alerts.map(async alert => {
          const product = await this.prisma.products.findFirst({
            where: { id: alert.product_id },
            select: {
              name: true,
              product_code: true,
              sku: true,
            },
          });

          return {
            id: alert.id,
            alertId: alert.alert_id,
            productId: alert.product_id,
            locationId: alert.location_id,
            alertType: alert.alert_type,
            currentStock: Number(alert.current_stock),
            thresholdLevel: Number(alert.threshold_level),
            status: alert.status,
            createdAt: alert.created_at,
            product,
            location: {
              name: alert.location.name,
              locationId: alert.location.location_id,
            },
          };
        })
      );

      return alertsWithProducts;
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
      throw new Error('Failed to fetch stock alerts');
    }
  }

  /**
   * Acknowledge stock alert
   */
  async acknowledgeStockAlert(companyId: string, alertId: string, acknowledgedBy: string) {
    try {
      const alert = await this.prisma.stock_alerts.findFirst({
        where: {
          company_id: companyId,
          alert_id: alertId,
        },
      });

      if (!alert) {
        throw new Error('Stock alert not found');
      }

      await this.prisma.stock_alerts.update({
        where: { id: alert.id },
        data: {
          status: AlertStatus.ACKNOWLEDGED,
          acknowledged_by: acknowledgedBy,
          acknowledged_at: new Date(),
        },
      });

      return { success: true, message: 'Stock alert acknowledged successfully' };
    } catch (error) {
      console.error('Error acknowledging stock alert:', error);
      throw error;
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async generateMovementId(companyId: string): Promise<string> {
    try {
      const lastMovement = await this.prisma.stock_movements.findFirst({
        where: { company_id: companyId },
        orderBy: { movement_id: 'desc' },
        select: { movement_id: true },
      });

      if (!lastMovement) {
        return 'MOV001';
      }

      const numericPart = parseInt(lastMovement.movement_id.substring(3), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `MOV${next.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating movement ID:', error);
      return `MOV${Date.now().toString().slice(-3)}`;
    }
  }

  private async generateReservationId(companyId: string): Promise<string> {
    try {
      const lastReservation = await this.prisma.stock_reservations.findFirst({
        where: { company_id: companyId },
        orderBy: { reservation_id: 'desc' },
        select: { reservation_id: true },
      });

      if (!lastReservation) {
        return 'RES001';
      }

      const numericPart = parseInt(lastReservation.reservation_id.substring(3), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `RES${next.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating reservation ID:', error);
      return `RES${Date.now().toString().slice(-3)}`;
    }
  }

  private async generateAlertId(companyId: string): Promise<string> {
    try {
      const lastAlert = await this.prisma.stock_alerts.findFirst({
        where: { company_id: companyId },
        orderBy: { alert_id: 'desc' },
        select: { alert_id: true },
      });

      if (!lastAlert) {
        return 'ALT001';
      }

      const numericPart = parseInt(lastAlert.alert_id.substring(3), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `ALT${next.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating alert ID:', error);
      return `ALT${Date.now().toString().slice(-3)}`;
    }
  }

  private async updateInventoryFromMovement(companyId: string, data: StockMovementData) {
    try {
      switch (data.movementType) {
        case StockMovementType.PURCHASE:
        case StockMovementType.TRANSFER_IN:
        case StockMovementType.ADJUSTMENT_IN:
        case StockMovementType.PRODUCTION_IN:
        case StockMovementType.RETURN_IN:
          if (data.toLocationId) {
            await this.adjustLocationStock(
              companyId,
              data.productId,
              data.toLocationId,
              data.quantity,
              'ADD'
            );
          }
          break;

        case StockMovementType.SALE:
        case StockMovementType.TRANSFER_OUT:
        case StockMovementType.ADJUSTMENT_OUT:
        case StockMovementType.PRODUCTION_OUT:
        case StockMovementType.RETURN_OUT:
        case StockMovementType.DAMAGE:
          if (data.fromLocationId) {
            await this.adjustLocationStock(
              companyId,
              data.productId,
              data.fromLocationId,
              data.quantity,
              'SUBTRACT'
            );
          }
          break;
      }
    } catch (error) {
      console.error('Error updating inventory from movement:', error);
      throw error;
    }
  }

  private async adjustLocationStock(
    companyId: string,
    productId: string,
    locationId: string,
    quantity: number,
    operation: 'ADD' | 'SUBTRACT'
  ) {
    const increment = operation === 'ADD' ? quantity : -quantity;

    await this.prisma.location_inventory.upsert({
      where: {
        product_id_location_id: {
          product_id: productId,
          location_id: locationId,
        },
      },
      update: {
        stock_quantity: { increment },
        available_quantity: { increment },
        last_updated: new Date(),
      },
      create: {
        product_id: productId,
        location_id: locationId,
        company_id: companyId,
        stock_quantity: Math.max(0, quantity),
        reserved_quantity: 0,
        available_quantity: Math.max(0, quantity),
      } as any,
    });
  }

  private async checkAndCreateStockAlerts(
    companyId: string,
    productId: string,
    locationId: string
  ) {
    try {
      const inventory = await this.prisma.location_inventory.findUnique({
        where: {
          product_id_location_id: {
            product_id: productId,
            location_id: locationId,
          },
        },
      });

      if (!inventory || !inventory.reorder_level) {
        return;
      }

      const currentStock = Number(inventory.available_quantity);
      const reorderLevel = Number(inventory.reorder_level);

      // Check if stock is below reorder level
      if (currentStock <= reorderLevel) {
        const alertType = currentStock === 0 ? AlertType.OUT_OF_STOCK : AlertType.LOW_STOCK;

        // Check if alert already exists
        const existingAlert = await this.prisma.stock_alerts.findFirst({
          where: {
            company_id: companyId,
            product_id: productId,
            location_id: locationId,
            alert_type: alertType,
            status: AlertStatus.ACTIVE,
          },
        });

        if (!existingAlert) {
          const alertId = await this.generateAlertId(companyId);

          await this.prisma.stock_alerts.create({
            data: {
              alert_id: alertId,
              product_id: productId,
              location_id: locationId,
              company_id: companyId,
              alert_type: alertType,
              current_stock: currentStock,
              threshold_level: reorderLevel,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error checking stock alerts:', error);
      // Don't throw error here as it's a background operation
    }
  }

  /**
   * Delete inventory record
   */
  async deleteInventory(inventoryId: string): Promise<void> {
    try {
      await this.prisma.location_inventory.delete({
        where: { id: inventoryId },
      });
    } catch (error) {
      console.error('Error deleting inventory:', error);
      throw error;
    }
  }
}

export const inventoryService = new InventoryService();
