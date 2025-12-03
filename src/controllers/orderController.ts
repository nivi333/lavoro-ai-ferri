import { Request, Response } from 'express';
import Joi from 'joi';
import { orderService } from '../services/orderService';
import { logger } from '../utils/logger';
import { ListOrderFilters } from '../types';

const createOrderSchema = Joi.object({
  customerId: Joi.string().uuid().optional().allow(null),
  customerName: Joi.string().min(1).max(255).required(),
  customerCode: Joi.string().max(100).optional().allow('', null),
  priority: Joi.string().valid('URGENT', 'HIGH', 'NORMAL', 'LOW').optional().allow(null),
  orderDate: Joi.date().required(),
  deliveryDate: Joi.date().min(Joi.ref('orderDate')).optional().allow(null),
  expectedDeliveryDate: Joi.date().min(Joi.ref('orderDate')).optional().allow(null),
  currency: Joi.string().max(10).optional().allow('', null),
  paymentTerms: Joi.string().max(100).optional().allow('', null),
  referenceNumber: Joi.string().max(255).optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
  customerNotes: Joi.string().max(1000).optional().allow('', null),
  locationId: Joi.string().optional().allow('', null),
  shippingAddress: Joi.string().max(500).optional().allow('', null),
  shippingCarrier: Joi.string().max(255).optional().allow('', null),
  trackingNumber: Joi.string().max(255).optional().allow('', null),
  shippingMethod: Joi.string().max(255).optional().allow('', null),
  deliveryWindowStart: Joi.date().optional().allow(null),
  deliveryWindowEnd: Joi.date().min(Joi.ref('deliveryWindowStart')).optional().allow(null),
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
        unitPrice: Joi.number().min(0).required(),
        discountPercent: Joi.number().min(0).max(100).optional().allow(null),
        taxRate: Joi.number().min(0).max(100).optional().allow(null),
        notes: Joi.string().max(500).allow('', null).optional(),
      }),
    )
    .min(1)
    .required(),
});

const updateOrderSchema = Joi.object({
  customerId: Joi.string().uuid().allow(null).optional(),
  customerName: Joi.string().min(1).max(255).optional(),
  customerCode: Joi.string().max(100).allow(null).optional(),
  priority: Joi.string().valid('URGENT', 'HIGH', 'NORMAL', 'LOW').optional(),
  orderDate: Joi.date().optional(),
  deliveryDate: Joi.date().min(Joi.ref('orderDate')).allow(null).optional(),
  expectedDeliveryDate: Joi.date().min(Joi.ref('orderDate')).allow(null).optional(),
  currency: Joi.string().max(10).optional(),
  paymentTerms: Joi.string().max(100).allow(null).optional(),
  referenceNumber: Joi.string().max(255).allow(null).optional(),
  notes: Joi.string().max(1000).allow(null).optional(),
  customerNotes: Joi.string().max(1000).allow(null).optional(),
  locationId: Joi.string().allow(null).optional(),
  shippingAddress: Joi.string().max(500).allow(null).optional(),
  shippingCarrier: Joi.string().max(255).allow(null).optional(),
  trackingNumber: Joi.string().max(255).allow(null).optional(),
  shippingMethod: Joi.string().max(255).allow(null).optional(),
  deliveryWindowStart: Joi.date().allow(null).optional(),
  deliveryWindowEnd: Joi.date().min(Joi.ref('deliveryWindowStart')).allow(null).optional(),
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
        unitPrice: Joi.number().min(0).required(),
        discountPercent: Joi.number().min(0).max(100).optional(),
        taxRate: Joi.number().min(0).max(100).optional(),
        notes: Joi.string().max(500).allow('', null).optional(),
      }),
    )
    .min(1)
    .optional(),
}).min(1);

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED')
    .required(),
  deliveryDate: Joi.date().optional(),
  shippingCarrier: Joi.string().max(255).optional(),
  trackingNumber: Joi.string().max(255).optional(),
  shippingMethod: Joi.string().max(255).optional(),
  deliveryWindowStart: Joi.date().optional(),
  deliveryWindowEnd: Joi.date().min(Joi.ref('deliveryWindowStart')).optional(),
});

export class OrderController {
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createOrderSchema.validate(req.body);
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

      const order = await orderService.createOrder(tenantId, value);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order,
      });
    } catch (error: any) {
      logger.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to create order',
      });
    }
  }

  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant context is required',
        });
        return;
      }

      const filters: ListOrderFilters = {};

      const { status, priority, from, to, customerName, customerId } = req.query;

      if (typeof status === 'string' && status.trim().length > 0) {
        filters.status = status;
      }

      if (typeof priority === 'string' && priority.trim().length > 0) {
        filters.priority = priority;
      }

      if (typeof customerId === 'string' && customerId.trim().length > 0) {
        filters.customerId = customerId;
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

      if (typeof customerName === 'string' && customerName.trim().length > 0) {
        filters.customerName = customerName;
      }

      const orders = await orderService.getOrders(tenantId, filters);

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error: any) {
      logger.error('Error fetching orders:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch orders',
      });
    }
  }

  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { orderId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant context is required',
        });
        return;
      }

      if (!orderId) {
        res.status(400).json({
          success: false,
          message: 'orderId is required',
        });
        return;
      }

      const order = await orderService.getOrderById(tenantId, orderId);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Error fetching order by id:', error);

      if (error.message === 'Order not found') {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch order',
      });
    }
  }

  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateOrderSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      const { orderId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant context is required',
        });
        return;
      }

      if (!orderId) {
        res.status(400).json({
          success: false,
          message: 'orderId is required',
        });
        return;
      }

      const order = await orderService.updateOrder(tenantId, orderId, value);

      res.status(200).json({
        success: true,
        message: 'Order updated successfully',
        data: order,
      });
    } catch (error: any) {
      logger.error('Error updating order:', error);

      if (error.message === 'Order not found') {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }

      if (error.message === 'Cannot update an order that is delivered or cancelled') {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to update order',
      });
    }
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateOrderStatusSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      const { orderId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant context is required',
        });
        return;
      }

      if (!orderId) {
        res.status(400).json({
          success: false,
          message: 'orderId is required',
        });
        return;
      }

      const {
        status,
        deliveryDate,
        shippingCarrier,
        trackingNumber,
        shippingMethod,
        deliveryWindowStart,
        deliveryWindowEnd,
      } = value;

      const order = await orderService.updateOrderStatus(tenantId, orderId, status as any, {
        deliveryDate,
        shippingCarrier,
        trackingNumber,
        shippingMethod,
        deliveryWindowStart,
        deliveryWindowEnd,
      });

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: order,
      });
    } catch (error: any) {
      logger.error('Error updating order status:', error);

      if (error.message === 'Order not found') {
        res.status(404).json({
          success: false,
          message: 'Order not found',
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
        message: error?.message || 'Failed to update order status',
      });
    }
  }

  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { orderId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant context is required',
        });
        return;
      }

      if (!orderId) {
        res.status(400).json({
          success: false,
          message: 'orderId is required',
        });
        return;
      }

      await orderService.deleteOrder(tenantId, orderId);

      res.status(200).json({
        success: true,
        message: 'Order deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting order:', error);

      if (error.message === 'Order not found') {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to delete order',
      });
    }
  }
}

export const orderController = new OrderController();
