import { Request, Response } from 'express';
import Joi from 'joi';
import { BillService } from '../services/billService';

const billService = new BillService();

// Joi Schemas
const billItemSchema = Joi.object({
  productId: Joi.string().optional(),
  itemCode: Joi.string().required(),
  description: Joi.string().optional().allow('', null),
  quantity: Joi.number().positive().required(),
  unitOfMeasure: Joi.string().required(),
  unitCost: Joi.number().min(0).required(),
  discountPercent: Joi.number().min(0).max(100).optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  notes: Joi.string().optional().allow('', null),
});

const createBillSchema = Joi.object({
  supplierId: Joi.string().optional(),
  supplierName: Joi.string().required(),
  supplierCode: Joi.string().optional().allow('', null),
  purchaseOrderId: Joi.string().optional().allow('', null),
  locationId: Joi.string().required(),
  billNumber: Joi.string().optional().allow('', null),
  billDate: Joi.date().required(),
  dueDate: Joi.date().required(),
  paymentTerms: Joi.string()
    .valid('IMMEDIATE', 'NET_15', 'NET_30', 'NET_60', 'NET_90', 'ADVANCE', 'COD', 'CREDIT')
    .optional(),
  currency: Joi.string().optional(),
  shippingCharges: Joi.number().min(0).optional(),
  notes: Joi.string().optional().allow('', null),
  supplierInvoiceNo: Joi.string().optional().allow('', null),
  items: Joi.array().items(billItemSchema).min(1).required(),
});

const createBillFromPOSchema = Joi.object({
  purchaseOrderId: Joi.string().required(),
  locationId: Joi.string().optional(),
  billNumber: Joi.string().optional().allow('', null),
  billDate: Joi.date().optional(),
  dueDate: Joi.date().optional(),
  paymentTerms: Joi.string()
    .valid('IMMEDIATE', 'NET_15', 'NET_30', 'NET_60', 'NET_90', 'ADVANCE', 'COD', 'CREDIT')
    .optional(),
  currency: Joi.string().optional(),
  shippingCharges: Joi.number().min(0).optional(),
  notes: Joi.string().optional().allow('', null),
  supplierInvoiceNo: Joi.string().optional().allow('', null),
});

const updateBillSchema = Joi.object({
  supplierId: Joi.string().optional().allow('', null),
  supplierName: Joi.string().optional(),
  supplierCode: Joi.string().optional().allow('', null),
  locationId: Joi.string().optional(),
  billNumber: Joi.string().optional().allow('', null),
  billDate: Joi.date().optional(),
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
  supplierInvoiceNo: Joi.string().optional().allow('', null),
  items: Joi.array().items(billItemSchema).min(1).optional(),
});

const updateBillStatusSchema = Joi.object({
  status: Joi.string()
    .valid('DRAFT', 'RECEIVED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')
    .required(),
});

export class BillController {
  async createBill(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createBillSchema.validate(req.body);
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

      const bill = await billService.createBill(tenantId, value);
      res.status(201).json({
        success: true,
        message: 'Bill created successfully',
        data: bill,
      });
    } catch (error: any) {
      console.error('Error creating bill:', error);
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
        message: error?.message || 'Failed to create bill',
      });
    }
  }

  async createBillFromPurchaseOrder(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createBillFromPOSchema.validate(req.body);
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

      const { purchaseOrderId, ...rest } = value;
      const bill = await billService.createBillFromPurchaseOrder(tenantId, purchaseOrderId, rest);
      res.status(201).json({
        success: true,
        message: 'Bill created from purchase order successfully',
        data: bill,
      });
    } catch (error: any) {
      console.error('Error creating bill from PO:', error);
      if (error.message === 'Purchase order not found') {
        res.status(404).json({ success: false, message: 'Purchase order not found' });
        return;
      }
      if (error.message.includes('Invalid') || error.message.includes('Cannot create')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to create bill from purchase order',
      });
    }
  }

  async getBills(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const filters: any = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.supplierId) filters.supplierId = req.query.supplierId as string;
      if (req.query.supplierName) filters.supplierName = req.query.supplierName as string;
      if (req.query.purchaseOrderId) filters.purchaseOrderId = req.query.purchaseOrderId as string;
      if (req.query.locationId) filters.locationId = req.query.locationId as string;
      if (req.query.fromDate) filters.fromDate = new Date(req.query.fromDate as string);
      if (req.query.toDate) filters.toDate = new Date(req.query.toDate as string);

      const bills = await billService.getBills(tenantId, filters);
      res.status(200).json({
        success: true,
        data: bills,
      });
    } catch (error: any) {
      console.error('Error fetching bills:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch bills',
      });
    }
  }

  async getBillById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { billId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!billId) {
        res.status(400).json({ success: false, message: 'billId is required' });
        return;
      }

      const bill = await billService.getBillById(tenantId, billId);
      res.status(200).json({
        success: true,
        data: bill,
      });
    } catch (error: any) {
      console.error('Error fetching bill:', error);
      if (error.message === 'Bill not found') {
        res.status(404).json({ success: false, message: 'Bill not found' });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch bill',
      });
    }
  }

  async updateBill(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateBillSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      const { billId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!billId) {
        res.status(400).json({ success: false, message: 'billId is required' });
        return;
      }

      const bill = await billService.updateBill(tenantId, billId, value);
      res.status(200).json({
        success: true,
        message: 'Bill updated successfully',
        data: bill,
      });
    } catch (error: any) {
      console.error('Error updating bill:', error);
      if (error.message === 'Bill not found') {
        res.status(404).json({ success: false, message: 'Bill not found' });
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
        message: error?.message || 'Failed to update bill',
      });
    }
  }

  async updateBillStatus(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateBillStatusSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      const { billId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!billId) {
        res.status(400).json({ success: false, message: 'billId is required' });
        return;
      }

      const bill = await billService.updateBillStatus(tenantId, billId, value.status);
      res.status(200).json({
        success: true,
        message: 'Bill status updated successfully',
        data: bill,
      });
    } catch (error: any) {
      console.error('Error updating bill status:', error);
      if (error.message === 'Bill not found') {
        res.status(404).json({ success: false, message: 'Bill not found' });
        return;
      }
      if (error.message.includes('Invalid status transition')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to update bill status',
      });
    }
  }

  async deleteBill(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { billId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!billId) {
        res.status(400).json({ success: false, message: 'billId is required' });
        return;
      }

      await billService.deleteBill(tenantId, billId);
      res.status(200).json({
        success: true,
        message: 'Bill deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting bill:', error);
      if (error.message === 'Bill not found') {
        res.status(404).json({ success: false, message: 'Bill not found' });
        return;
      }
      if (error.message.includes('Cannot delete')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to delete bill',
      });
    }
  }
}

export const billController = new BillController();
