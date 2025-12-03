import { Request, Response } from 'express';
import Joi from 'joi';
import { purchaseOrderService } from '../services/purchaseOrderService';
import { logger } from '../utils/logger';
import { ListPurchaseOrderFilters } from '../types';

const createPurchaseOrderSchema = Joi.object({
  supplierId: Joi.string().uuid().optional().allow(null),
  supplierName: Joi.string().min(1).max(255).required(),
  supplierCode: Joi.string().max(100).optional().allow('', null),
  priority: Joi.string().valid('URGENT', 'HIGH', 'NORMAL', 'LOW').optional().allow(null),
  poDate: Joi.date().required(),
  expectedDeliveryDate: Joi.date().min(Joi.ref('poDate')).optional().allow(null),
  currency: Joi.string().max(10).optional().allow('', null),
  paymentTerms: Joi.string().max(100).optional().allow('', null),
  referenceNumber: Joi.string().max(255).optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
  termsConditions: Joi.string().max(2000).optional().allow('', null),
  locationId: Joi.string().optional().allow('', null),
  deliveryAddress: Joi.string().max(500).optional().allow('', null),
  shippingMethod: Joi.string().max(255).optional().allow('', null),
  incoterms: Joi.string().max(100).optional().allow('', null),
  shippingCharges: Joi.number().min(0).optional().allow(null),
  items: Joi.array()
    .items(
      Joi.object({
        lineNumber: Joi.number().integer().min(1).optional().allow(null),
        productId: Joi.string().uuid().optional().allow(null),
        itemCode: Joi.string().min(1).max(255).required(),
        description: Joi.string().max(500).allow('', null).optional(),
        quantity: Joi.number().greater(0).required(),
        unitOfMeasure: Joi.string().min(1).max(50).required(),
        unitCost: Joi.number().min(0).required(),
        discountPercent: Joi.number().min(0).max(100).optional().allow(null),
        taxRate: Joi.number().min(0).max(100).optional().allow(null),
        expectedDelivery: Joi.date().optional().allow(null),
        notes: Joi.string().max(500).allow('', null).optional(),
      }),
    )
    .min(1)
    .required(),
});

const updatePurchaseOrderSchema = Joi.object({
  supplierId: Joi.string().uuid().allow(null).optional(),
  supplierName: Joi.string().min(1).max(255).optional(),
  supplierCode: Joi.string().max(100).allow(null).optional(),
  priority: Joi.string().valid('URGENT', 'HIGH', 'NORMAL', 'LOW').optional(),
  poDate: Joi.date().optional(),
  expectedDeliveryDate: Joi.date().min(Joi.ref('poDate')).allow(null).optional(),
  currency: Joi.string().max(10).optional(),
  paymentTerms: Joi.string().max(100).allow(null).optional(),
  referenceNumber: Joi.string().max(255).allow(null).optional(),
  notes: Joi.string().max(1000).allow(null).optional(),
  termsConditions: Joi.string().max(2000).allow(null).optional(),
  locationId: Joi.string().allow(null).optional(),
  deliveryAddress: Joi.string().max(500).allow(null).optional(),
  shippingMethod: Joi.string().max(255).allow(null).optional(),
  incoterms: Joi.string().max(100).allow(null).optional(),
  shippingCharges: Joi.number().min(0).allow(null).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        lineNumber: Joi.number().integer().min(1).optional(),
        productId: Joi.string().uuid().allow(null).optional(),
        itemCode: Joi.string().min(1).max(255).required(),
        description: Joi.string().max(500).allow('', null).optional(),
        quantity: Joi.number().greater(0).required(),
        unitOfMeasure: Joi.string().min(1).max(50).required(),
        unitCost: Joi.number().min(0).required(),
        discountPercent: Joi.number().min(0).max(100).optional(),
        taxRate: Joi.number().min(0).max(100).optional(),
        expectedDelivery: Joi.date().allow(null).optional(),
        notes: Joi.string().max(500).allow('', null).optional(),
      }),
    )
    .min(1)
    .optional(),
}).min(1);

const updatePOStatusSchema = Joi.object({
  status: Joi.string()
    .valid('DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')
    .required(),
  expectedDeliveryDate: Joi.date().optional(),
  shippingMethod: Joi.string().max(255).optional(),
});

export class PurchaseOrderController {
  async createPurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createPurchaseOrderSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant context is required',
        });
        return;
      }

      const po = await purchaseOrderService.createPurchaseOrder(tenantId, value);

      res.status(201).json({
        success: true,
        message: 'Purchase Order created successfully',
        data: po,
      });
    } catch (error: any) {
      logger.error('Error creating purchase order:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to create purchase order',
      });
    }
  }

  async getPurchaseOrders(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant context is required',
        });
        return;
      }

      const filters: ListPurchaseOrderFilters = {};

      const { status, priority, from, to, supplierName, supplierId } = req.query;

      if (typeof status === 'string' && status.trim().length > 0) {
        filters.status = status;
      }

      if (typeof priority === 'string' && priority.trim().length > 0) {
        filters.priority = priority;
      }

      if (typeof supplierId === 'string' && supplierId.trim().length > 0) {
        filters.supplierId = supplierId;
      }

      if (typeof from === 'string') {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) {
          filters.fromDate = fromDate;
        }
      }

      if (typeof to === 'string') {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) {
          filters.toDate = toDate;
        }
      }

      if (typeof supplierName === 'string' && supplierName.trim().length > 0) {
        filters.supplierName = supplierName;
      }

      const pos = await purchaseOrderService.getPurchaseOrders(tenantId, filters);

      res.status(200).json({
        success: true,
        data: pos,
      });
    } catch (error: any) {
      logger.error('Error fetching purchase orders:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch purchase orders',
      });
    }
  }

  async getPurchaseOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { poId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant context is required',
        });
        return;
      }

      if (!poId) {
        res.status(400).json({
          success: false,
          message: 'poId is required',
        });
        return;
      }

      const po = await purchaseOrderService.getPurchaseOrderById(tenantId, poId);

      res.status(200).json({
        success: true,
        data: po,
      });
    } catch (error: any) {
      logger.error('Error fetching purchase order by id:', error);

      if (error.message === 'Purchase Order not found') {
        res.status(404).json({
          success: false,
          message: 'Purchase Order not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch purchase order',
      });
    }
  }

  async updatePurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updatePurchaseOrderSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      const { poId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant context is required',
        });
        return;
      }

      if (!poId) {
        res.status(400).json({
          success: false,
          message: 'poId is required',
        });
        return;
      }

      const po = await purchaseOrderService.updatePurchaseOrder(tenantId, poId, value);

      res.status(200).json({
        success: true,
        message: 'Purchase Order updated successfully',
        data: po,
      });
    } catch (error: any) {
      logger.error('Error updating purchase order:', error);

      if (error.message === 'Purchase Order not found') {
        res.status(404).json({
          success: false,
          message: 'Purchase Order not found',
        });
        return;
      }

      if (error.message === 'Cannot update a PO that is received or cancelled') {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to update purchase order',
      });
    }
  }

  async updatePOStatus(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updatePOStatusSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      const { poId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant context is required',
        });
        return;
      }

      if (!poId) {
        res.status(400).json({
          success: false,
          message: 'poId is required',
        });
        return;
      }

      const { status, expectedDeliveryDate, shippingMethod } = value;

      const po = await purchaseOrderService.updatePOStatus(tenantId, poId, status as any, {
        expectedDeliveryDate,
        shippingMethod,
      });

      res.status(200).json({
        success: true,
        message: 'Purchase Order status updated successfully',
        data: po,
      });
    } catch (error: any) {
      logger.error('Error updating purchase order status:', error);

      if (error.message === 'Purchase Order not found') {
        res.status(404).json({
          success: false,
          message: 'Purchase Order not found',
        });
        return;
      }

      if (error.message === 'Invalid status transition') {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to update purchase order status',
      });
    }
  }

  async deletePurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { poId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant context is required',
        });
        return;
      }

      if (!poId) {
        res.status(400).json({
          success: false,
          message: 'poId is required',
        });
        return;
      }

      await purchaseOrderService.deletePurchaseOrder(tenantId, poId);

      res.status(200).json({
        success: true,
        message: 'Purchase Order deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting purchase order:', error);

      if (error.message === 'Purchase Order not found') {
        res.status(404).json({
          success: false,
          message: 'Purchase Order not found',
        });
        return;
      }

      if (error.message === 'Only DRAFT purchase orders can be deleted') {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to delete purchase order',
      });
    }
  }
}

export const purchaseOrderController = new PurchaseOrderController();
