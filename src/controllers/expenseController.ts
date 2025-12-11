import { Request, Response } from 'express';
import Joi from 'joi';
import { expenseService } from '../services/expenseService';

const createExpenseSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  category: Joi.string()
    .valid(
      'RENT',
      'UTILITIES',
      'SALARIES',
      'EQUIPMENT',
      'SUPPLIES',
      'MAINTENANCE',
      'TRAVEL',
      'MARKETING',
      'INSURANCE',
      'TAXES',
      'RAW_MATERIALS',
      'SHIPPING',
      'PROFESSIONAL_SERVICES',
      'MISCELLANEOUS'
    )
    .required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().max(10).optional(),
  expenseDate: Joi.date().required(),
  locationId: Joi.string().optional(),
  employeeId: Joi.string().optional(),
  employeeName: Joi.string().max(255).optional(),
  paymentMethod: Joi.string()
    .valid('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'OTHER')
    .optional(),
  paymentDate: Joi.date().optional(),
  receiptUrl: Joi.string().uri().optional(),
  attachments: Joi.array().items(Joi.string().uri()).optional(),
  notes: Joi.string().max(1000).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isRecurring: Joi.boolean().optional(),
  recurringPeriod: Joi.string().valid('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY').optional(),
});

const updateExpenseSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).allow(null, '').optional(),
  category: Joi.string()
    .valid(
      'RENT',
      'UTILITIES',
      'SALARIES',
      'EQUIPMENT',
      'SUPPLIES',
      'MAINTENANCE',
      'TRAVEL',
      'MARKETING',
      'INSURANCE',
      'TAXES',
      'RAW_MATERIALS',
      'SHIPPING',
      'PROFESSIONAL_SERVICES',
      'MISCELLANEOUS'
    )
    .optional(),
  amount: Joi.number().positive().optional(),
  currency: Joi.string().max(10).optional(),
  expenseDate: Joi.date().optional(),
  locationId: Joi.string().allow(null, '').optional(),
  employeeId: Joi.string().allow(null, '').optional(),
  employeeName: Joi.string().max(255).allow(null, '').optional(),
  paymentMethod: Joi.string()
    .valid('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CARD', 'OTHER')
    .allow(null)
    .optional(),
  paymentDate: Joi.date().allow(null).optional(),
  receiptUrl: Joi.string().uri().allow(null, '').optional(),
  attachments: Joi.array().items(Joi.string().uri()).optional(),
  notes: Joi.string().max(1000).allow(null, '').optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isRecurring: Joi.boolean().optional(),
  recurringPeriod: Joi.string().valid('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY').allow(null).optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED').required(),
  reason: Joi.string().max(500).optional(),
});

export class ExpenseController {
  async createExpense(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createExpenseSchema.validate(req.body);
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

      const expense = await expenseService.createExpense(tenantId, value);
      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: expense,
      });
    } catch (error: any) {
      console.error('Error creating expense:', error);
      if (error.message.includes('Invalid') || error.message.includes('Missing')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to create expense',
      });
    }
  }

  async getExpenses(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const filters: any = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.employeeId) filters.employeeId = req.query.employeeId as string;
      if (req.query.employeeName) filters.employeeName = req.query.employeeName as string;
      if (req.query.locationId) filters.locationId = req.query.locationId as string;
      if (req.query.fromDate) filters.fromDate = new Date(req.query.fromDate as string);
      if (req.query.toDate) filters.toDate = new Date(req.query.toDate as string);
      if (req.query.minAmount) filters.minAmount = parseFloat(req.query.minAmount as string);
      if (req.query.maxAmount) filters.maxAmount = parseFloat(req.query.maxAmount as string);

      const expenses = await expenseService.getExpenses(tenantId, filters);
      res.status(200).json({
        success: true,
        data: expenses,
      });
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch expenses',
      });
    }
  }

  async getExpenseById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { expenseId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!expenseId) {
        res.status(400).json({ success: false, message: 'expenseId is required' });
        return;
      }

      const expense = await expenseService.getExpenseById(tenantId, expenseId);
      res.status(200).json({
        success: true,
        data: expense,
      });
    } catch (error: any) {
      console.error('Error fetching expense:', error);
      if (error.message === 'Expense not found') {
        res.status(404).json({ success: false, message: 'Expense not found' });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch expense',
      });
    }
  }

  async updateExpense(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateExpenseSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId } = req;
      const { expenseId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!expenseId) {
        res.status(400).json({ success: false, message: 'expenseId is required' });
        return;
      }

      const expense = await expenseService.updateExpense(tenantId, expenseId, value);
      res.status(200).json({
        success: true,
        message: 'Expense updated successfully',
        data: expense,
      });
    } catch (error: any) {
      console.error('Error updating expense:', error);
      if (error.message === 'Expense not found') {
        res.status(404).json({ success: false, message: 'Expense not found' });
        return;
      }
      if (error.message.includes('Cannot update') || error.message.includes('Invalid')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to update expense',
      });
    }
  }

  async updateExpenseStatus(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateStatusSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const { tenantId, userId } = req;
      const { expenseId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!expenseId) {
        res.status(400).json({ success: false, message: 'expenseId is required' });
        return;
      }

      const expense = await expenseService.updateExpenseStatus(
        tenantId,
        expenseId,
        value.status,
        userId,
        value.reason
      );
      res.status(200).json({
        success: true,
        message: `Expense status updated to ${value.status}`,
        data: expense,
      });
    } catch (error: any) {
      console.error('Error updating expense status:', error);
      if (error.message === 'Expense not found') {
        res.status(404).json({ success: false, message: 'Expense not found' });
        return;
      }
      if (error.message.includes('Cannot transition')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to update expense status',
      });
    }
  }

  async deleteExpense(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      const { expenseId } = req.params;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      if (!expenseId) {
        res.status(400).json({ success: false, message: 'expenseId is required' });
        return;
      }

      const result = await expenseService.deleteExpense(tenantId, expenseId);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      if (error.message === 'Expense not found') {
        res.status(404).json({ success: false, message: 'Expense not found' });
        return;
      }
      if (error.message.includes('Cannot delete')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to delete expense',
      });
    }
  }

  async getExpenseStats(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;

      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

      const stats = await expenseService.getExpenseStats(tenantId, fromDate, toDate);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching expense stats:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to fetch expense statistics',
      });
    }
  }
}

export const expenseController = new ExpenseController();
