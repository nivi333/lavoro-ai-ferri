import { Request, Response } from 'express';
import Joi from 'joi';
import { paymentService } from '../services/paymentService';

const recordPaymentSchema = Joi.object({
  referenceType: Joi.string().valid('INVOICE', 'BILL', 'EXPENSE').required(),
  referenceId: Joi.string().min(1).required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().max(10).optional(),
  paymentDate: Joi.date().required(),
  paymentMethod: Joi.string()
    .valid('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'OTHER')
    .required(),
  transactionRef: Joi.string().max(100).optional(),
  bankName: Joi.string().max(100).optional(),
  chequeNumber: Joi.string().max(50).optional(),
  chequeDate: Joi.date().optional(),
  upiId: Joi.string().max(100).optional(),
  notes: Joi.string().max(500).optional(),
  receiptUrl: Joi.string().uri().optional(),
});

export class PaymentController {
  async recordPayment(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = recordPaymentSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId, userId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      let payment;
      if (value.referenceType === 'INVOICE') {
        payment = await paymentService.recordInvoicePayment(tenantId, value, userId);
      } else if (value.referenceType === 'BILL') {
        payment = await paymentService.recordBillPayment(tenantId, value, userId);
      } else {
        res.status(400).json({ success: false, message: 'Unsupported reference type' });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: payment,
      });
    } catch (error: any) {
      console.error('Error recording payment:', error);
      if (
        error.message.includes('not found') ||
        error.message.includes('exceeds') ||
        error.message.includes('Cannot record') ||
        error.message.includes('already')
      ) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to record payment',
      });
    }
  }

  async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const filters: any = {};
      if (req.query.paymentType) filters.paymentType = req.query.paymentType as string;
      if (req.query.referenceType) filters.referenceType = req.query.referenceType as string;
      if (req.query.partyType) filters.partyType = req.query.partyType as string;
      if (req.query.partyId) filters.partyId = req.query.partyId as string;
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.paymentMethod) filters.paymentMethod = req.query.paymentMethod as string;
      if (req.query.fromDate) filters.fromDate = new Date(req.query.fromDate as string);
      if (req.query.toDate) filters.toDate = new Date(req.query.toDate as string);

      const payments = await paymentService.getPayments(tenantId, filters);
      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch payments',
      });
    }
  }

  async getPaymentById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { paymentId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!paymentId) {
        res.status(400).json({ success: false, message: 'paymentId is required' });
        return;
      }

      const payment = await paymentService.getPaymentById(tenantId, paymentId);
      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      console.error('Error fetching payment:', error);
      if (error.message === 'Payment not found') {
        res.status(404).json({ success: false, message: 'Payment not found' });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch payment',
      });
    }
  }

  async getPaymentsByReference(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { referenceType, referenceId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!referenceType || !referenceId) {
        res.status(400).json({ success: false, message: 'referenceType and referenceId are required' });
        return;
      }

      const payments = await paymentService.getPaymentsByReference(tenantId, referenceType, referenceId);
      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      console.error('Error fetching payments by reference:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch payments',
      });
    }
  }

  async cancelPayment(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req;
      const { paymentId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!paymentId) {
        res.status(400).json({ success: false, message: 'paymentId is required' });
        return;
      }

      const payment = await paymentService.cancelPayment(tenantId, paymentId, userId);
      res.status(200).json({
        success: true,
        message: 'Payment cancelled successfully',
        data: payment,
      });
    } catch (error: any) {
      console.error('Error cancelling payment:', error);
      if (error.message === 'Payment not found') {
        res.status(404).json({ success: false, message: 'Payment not found' });
        return;
      }
      if (error.message.includes('already cancelled')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to cancel payment',
      });
    }
  }
}

export const paymentController = new PaymentController();
