import { Request, Response } from 'express';
import Joi from 'joi';
import { invoiceService } from '../services/invoiceService';

// Joi Schemas
const invoiceItemSchema = Joi.object({
  productId: Joi.string().optional(),
  itemCode: Joi.string().required(),
  description: Joi.string().optional().allow('', null),
  quantity: Joi.number().positive().required(),
  unitOfMeasure: Joi.string().required(),
  unitPrice: Joi.number().min(0).required(),
  discountPercent: Joi.number().min(0).max(100).optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  notes: Joi.string().optional().allow('', null),
});

const createInvoiceSchema = Joi.object({
  customerId: Joi.string().optional(),
  customerName: Joi.string().required(),
  customerCode: Joi.string().optional().allow('', null),
  orderId: Joi.string().optional().allow('', null),
  locationId: Joi.string().required(),
  invoiceNumber: Joi.string().optional().allow('', null),
  invoiceDate: Joi.date().required(),
  dueDate: Joi.date().required(),
  paymentTerms: Joi.string()
    .valid('IMMEDIATE', 'NET_15', 'NET_30', 'NET_60', 'NET_90', 'ADVANCE', 'COD', 'CREDIT')
    .optional(),
  currency: Joi.string().optional(),
  shippingCharges: Joi.number().min(0).optional(),
  notes: Joi.string().optional().allow('', null),
  termsConditions: Joi.string().optional().allow('', null),
  bankDetails: Joi.string().optional().allow('', null),
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
});

const createInvoiceFromOrderSchema = Joi.object({
  orderId: Joi.string().required(),
  locationId: Joi.string().optional(),
  invoiceNumber: Joi.string().optional().allow('', null),
  invoiceDate: Joi.date().optional(),
  dueDate: Joi.date().optional(),
  paymentTerms: Joi.string()
    .valid('IMMEDIATE', 'NET_15', 'NET_30', 'NET_60', 'NET_90', 'ADVANCE', 'COD', 'CREDIT')
    .optional(),
  currency: Joi.string().optional(),
  shippingCharges: Joi.number().min(0).optional(),
  notes: Joi.string().optional().allow('', null),
  termsConditions: Joi.string().optional().allow('', null),
  bankDetails: Joi.string().optional().allow('', null),
});

const updateInvoiceSchema = Joi.object({
  customerId: Joi.string().optional().allow('', null),
  customerName: Joi.string().optional(),
  customerCode: Joi.string().optional().allow('', null),
  orderId: Joi.string().optional().allow('', null),
  locationId: Joi.string().optional(),
  invoiceNumber: Joi.string().optional().allow('', null),
  invoiceDate: Joi.date().optional(),
  dueDate: Joi.date().optional(),
  paymentTerms: Joi.string()
    .valid('IMMEDIATE', 'NET_15', 'NET_30', 'NET_60', 'NET_90', 'ADVANCE', 'COD', 'CREDIT')
    .optional(),
  currency: Joi.string().optional(),
  shippingCharges: Joi.number().min(0).optional(),
  amountPaid: Joi.number().min(0).optional(),
  paymentMethod: Joi.string()
    .valid('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'OTHER')
    .optional()
    .allow(null),
  paymentDate: Joi.date().optional().allow(null),
  transactionRef: Joi.string().optional().allow('', null),
  notes: Joi.string().optional().allow('', null),
  termsConditions: Joi.string().optional().allow('', null),
  bankDetails: Joi.string().optional().allow('', null),
  items: Joi.array().items(invoiceItemSchema).min(1).optional(),
});

const updateInvoiceStatusSchema = Joi.object({
  status: Joi.string()
    .valid('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')
    .required(),
});

export class InvoiceController {
  async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createInvoiceSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const invoice = await invoiceService.createInvoice(tenantId, value);
      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice,
      });
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      if (
        error.message.includes('Invalid') ||
        error.message.includes('required') ||
        error.message.includes('Product is required')
      ) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to create invoice',
      });
    }
  }

  async createInvoiceFromOrder(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createInvoiceFromOrderSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { orderId, ...rest } = value;
      const invoice = await invoiceService.createInvoiceFromOrder(tenantId, orderId, rest);
      res.status(201).json({
        success: true,
        message: 'Invoice created from order successfully',
        data: invoice,
      });
    } catch (error: any) {
      console.error('Error creating invoice from order:', error);
      if (error.message === 'Order not found') {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }
      if (error.message.includes('Invalid') || error.message.includes('Cannot create')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to create invoice from order',
      });
    }
  }

  async getInvoices(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const filters: any = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.customerId) filters.customerId = req.query.customerId as string;
      if (req.query.customerName) filters.customerName = req.query.customerName as string;
      if (req.query.orderId) filters.orderId = req.query.orderId as string;
      if (req.query.locationId) filters.locationId = req.query.locationId as string;
      if (req.query.fromDate) filters.fromDate = new Date(req.query.fromDate as string);
      if (req.query.toDate) filters.toDate = new Date(req.query.toDate as string);

      const invoices = await invoiceService.getInvoices(tenantId, filters);
      res.status(200).json({
        success: true,
        data: invoices,
      });
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch invoices',
      });
    }
  }

  async getInvoiceById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { invoiceId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!invoiceId) {
        res.status(400).json({ success: false, message: 'invoiceId is required' });
        return;
      }

      const invoice = await invoiceService.getInvoiceById(tenantId, invoiceId);
      res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      if (error.message === 'Invoice not found') {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch invoice',
      });
    }
  }

  async updateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateInvoiceSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      const { invoiceId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!invoiceId) {
        res.status(400).json({ success: false, message: 'invoiceId is required' });
        return;
      }

      const invoice = await invoiceService.updateInvoice(tenantId, invoiceId, value);
      res.status(200).json({
        success: true,
        message: 'Invoice updated successfully',
        data: invoice,
      });
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      if (error.message === 'Invoice not found') {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }
      if (
        error.message.includes('Invalid') ||
        error.message.includes('Cannot modify') ||
        error.message.includes('Product is required')
      ) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to update invoice',
      });
    }
  }

  async updateInvoiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateInvoiceStatusSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      const { invoiceId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!invoiceId) {
        res.status(400).json({ success: false, message: 'invoiceId is required' });
        return;
      }

      const invoice = await invoiceService.updateInvoiceStatus(tenantId, invoiceId, value.status);
      res.status(200).json({
        success: true,
        message: 'Invoice status updated successfully',
        data: invoice,
      });
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      if (error.message === 'Invoice not found') {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }
      if (error.message.includes('Invalid status transition')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to update invoice status',
      });
    }
  }

  async deleteInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { invoiceId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!invoiceId) {
        res.status(400).json({ success: false, message: 'invoiceId is required' });
        return;
      }

      await invoiceService.deleteInvoice(tenantId, invoiceId);
      res.status(200).json({
        success: true,
        message: 'Invoice deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      if (error.message === 'Invoice not found') {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }
      if (error.message.includes('Cannot delete')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to delete invoice',
      });
    }
  }
}

export const invoiceController = new InvoiceController();
