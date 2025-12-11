import { Request, Response } from 'express';
import Joi from 'joi';
import { pettyCashService } from '../services/pettyCashService';

const createAccountSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  currency: Joi.string().max(10).optional(),
  initialBalance: Joi.number().min(0).required(),
  maxLimit: Joi.number().positive().optional(),
  minBalance: Joi.number().min(0).optional(),
  locationId: Joi.string().optional(),
  custodianId: Joi.string().optional(),
  custodianName: Joi.string().max(100).optional(),
});

const updateAccountSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).allow(null, '').optional(),
  maxLimit: Joi.number().positive().allow(null).optional(),
  minBalance: Joi.number().min(0).allow(null).optional(),
  custodianId: Joi.string().allow(null, '').optional(),
  custodianName: Joi.string().max(100).allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
});

const createTransactionSchema = Joi.object({
  accountId: Joi.string().min(1).required(),
  transactionType: Joi.string().valid('REPLENISHMENT', 'DISBURSEMENT', 'ADJUSTMENT').required(),
  amount: Joi.number().positive().required(),
  transactionDate: Joi.date().required(),
  description: Joi.string().max(500).optional(),
  category: Joi.string().max(50).optional(),
  recipientName: Joi.string().max(100).optional(),
  receiptNumber: Joi.string().max(50).optional(),
  receiptUrl: Joi.string().uri().optional(),
  approvedBy: Joi.string().max(100).optional(),
  notes: Joi.string().max(500).optional(),
});

export class PettyCashController {
  async createAccount(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createAccountSchema.validate(req.body);
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

      const account = await pettyCashService.createAccount(tenantId, value);
      res.status(201).json({
        success: true,
        message: 'Petty cash account created successfully',
        data: account,
      });
    } catch (error: any) {
      console.error('Error creating petty cash account:', error);
      if (error.message.includes('Invalid') || error.message.includes('Missing')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to create petty cash account',
      });
    }
  }

  async getAccounts(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const locationId = req.query.locationId as string | undefined;
      const accounts = await pettyCashService.getAccounts(tenantId, locationId);
      res.status(200).json({
        success: true,
        data: accounts,
      });
    } catch (error: any) {
      console.error('Error fetching petty cash accounts:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch petty cash accounts',
      });
    }
  }

  async getAccountById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { accountId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!accountId) {
        res.status(400).json({ success: false, message: 'accountId is required' });
        return;
      }

      const account = await pettyCashService.getAccountById(tenantId, accountId);
      res.status(200).json({
        success: true,
        data: account,
      });
    } catch (error: any) {
      console.error('Error fetching petty cash account:', error);
      if (error.message.includes('not found')) {
        res.status(404).json({ success: false, message: 'Petty cash account not found' });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch petty cash account',
      });
    }
  }

  async updateAccount(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateAccountSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      const { accountId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!accountId) {
        res.status(400).json({ success: false, message: 'accountId is required' });
        return;
      }

      const account = await pettyCashService.updateAccount(tenantId, accountId, value);
      res.status(200).json({
        success: true,
        message: 'Petty cash account updated successfully',
        data: account,
      });
    } catch (error: any) {
      console.error('Error updating petty cash account:', error);
      if (error.message.includes('not found')) {
        res.status(404).json({ success: false, message: 'Petty cash account not found' });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to update petty cash account',
      });
    }
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createTransactionSchema.validate(req.body);
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

      const transaction = await pettyCashService.createTransaction(tenantId, value, userId);
      res.status(201).json({
        success: true,
        message: 'Transaction recorded successfully',
        data: transaction,
      });
    } catch (error: any) {
      console.error('Error creating petty cash transaction:', error);
      if (
        error.message.includes('not found') ||
        error.message.includes('Insufficient') ||
        error.message.includes('exceed') ||
        error.message.includes('negative')
      ) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to create transaction',
      });
    }
  }

  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const filters: any = {};
      if (req.query.accountId) filters.accountId = req.query.accountId as string;
      if (req.query.transactionType) filters.transactionType = req.query.transactionType as string;
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.fromDate) filters.fromDate = new Date(req.query.fromDate as string);
      if (req.query.toDate) filters.toDate = new Date(req.query.toDate as string);

      const transactions = await pettyCashService.getTransactions(tenantId, filters);
      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error: any) {
      console.error('Error fetching petty cash transactions:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch transactions',
      });
    }
  }

  async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { transactionId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!transactionId) {
        res.status(400).json({ success: false, message: 'transactionId is required' });
        return;
      }

      const transaction = await pettyCashService.getTransactionById(tenantId, transactionId);
      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error: any) {
      console.error('Error fetching petty cash transaction:', error);
      if (error.message.includes('not found')) {
        res.status(404).json({ success: false, message: 'Transaction not found' });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch transaction',
      });
    }
  }

  async getAccountSummary(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const accountId = req.query.accountId as string | undefined;
      const summary = await pettyCashService.getAccountSummary(tenantId, accountId);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Error fetching petty cash summary:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch summary',
      });
    }
  }
}

export const pettyCashController = new PettyCashController();
