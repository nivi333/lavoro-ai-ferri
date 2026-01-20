import { PrismaClient, ExpenseStatus, ExpenseCategory, PaymentMethod } from '@prisma/client';
import { globalPrisma } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

const prisma = globalPrisma;

export interface CreateExpenseData {
  title: string;
  description?: string;
  category: string;
  amount: number;
  currency?: string;
  expenseDate: Date;
  locationId?: string;
  employeeId?: string;
  employeeName?: string;
  paymentMethod?: string;
  paymentDate?: Date;
  receiptUrl?: string;
  attachments?: string[];
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringPeriod?: string;
}

export interface UpdateExpenseData {
  title?: string;
  description?: string;
  category?: string;
  amount?: number;
  currency?: string;
  expenseDate?: Date;
  locationId?: string;
  employeeId?: string;
  employeeName?: string;
  paymentMethod?: string;
  paymentDate?: Date;
  receiptUrl?: string;
  attachments?: string[];
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringPeriod?: string;
}

export interface ListExpenseFilters {
  status?: string;
  category?: string;
  employeeId?: string;
  employeeName?: string;
  locationId?: string;
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export class ExpenseService {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }

  private async generateExpenseId(companyId: string): Promise<string> {
    const lastExpense = await this.prisma.expenses.findFirst({
      where: { company_id: companyId },
      orderBy: { expense_id: 'desc' },
      select: { expense_id: true },
    });

    let nextNumber = 1;
    if (lastExpense?.expense_id) {
      const match = lastExpense.expense_id.match(/EXP(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `EXP${String(nextNumber).padStart(4, '0')}`;
  }

  async createExpense(companyId: string, data: CreateExpenseData) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!data.title || !data.title.trim()) {
      throw new Error('Missing required field: title');
    }

    if (!data.category) {
      throw new Error('Missing required field: category');
    }

    if (data.amount === undefined || data.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!data.expenseDate) {
      throw new Error('Missing required field: expenseDate');
    }

    // Validate location if provided
    if (data.locationId) {
      const location = await this.prisma.company_locations.findFirst({
        where: { id: data.locationId, company_id: companyId, is_active: true },
      });
      if (!location) {
        throw new Error('Invalid locationId for this company');
      }
    }

    const expenseId = await this.generateExpenseId(companyId);

    const expense = await this.prisma.expenses.create({
      data: {
        id: uuidv4(),
        expense_id: expenseId,
        company_id: companyId,
        location_id: data.locationId || null,
        title: data.title.trim(),
        description: data.description || null,
        category: data.category as ExpenseCategory,
        amount: data.amount,
        currency: data.currency || 'INR',
        expense_date: new Date(data.expenseDate),
        status: ExpenseStatus.PENDING,
        employee_id: data.employeeId || null,
        employee_name: data.employeeName || null,
        payment_method: data.paymentMethod ? (data.paymentMethod as PaymentMethod) : null,
        payment_date: data.paymentDate ? new Date(data.paymentDate) : null,
        receipt_url: data.receiptUrl || null,
        attachments: data.attachments || [],
        notes: data.notes || null,
        tags: data.tags || [],
        is_recurring: data.isRecurring || false,
        recurring_period: data.recurringPeriod || null,
        is_active: true,
      },
    });

    return this.toDto(expense);
  }

  async getExpenses(companyId: string, filters?: ListExpenseFilters) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    const where: any = {
      company_id: companyId,
      is_active: true,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.employeeId) {
      where.employee_id = filters.employeeId;
    }

    if (filters?.employeeName) {
      where.employee_name = { contains: filters.employeeName, mode: 'insensitive' };
    }

    if (filters?.locationId) {
      where.location_id = filters.locationId;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.expense_date = {};
      if (filters.fromDate) {
        where.expense_date.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.expense_date.lte = new Date(filters.toDate);
      }
    }

    if (filters?.minAmount !== undefined || filters?.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) {
        where.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.amount.lte = filters.maxAmount;
      }
    }

    const expenses = await this.prisma.expenses.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return expenses.map(expense => this.toDto(expense));
  }

  async getExpenseById(companyId: string, expenseId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!expenseId || !expenseId.trim()) {
      throw new Error('Missing required field: expenseId');
    }

    const expense = await this.prisma.expenses.findFirst({
      where: {
        company_id: companyId,
        expense_id: expenseId,
        is_active: true,
      },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    return this.toDto(expense);
  }

  async updateExpense(companyId: string, expenseId: string, data: UpdateExpenseData) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!expenseId || !expenseId.trim()) {
      throw new Error('Missing required field: expenseId');
    }

    const expense = await this.prisma.expenses.findFirst({
      where: {
        company_id: companyId,
        expense_id: expenseId,
        is_active: true,
      },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    // Cannot update paid or cancelled expenses
    if (expense.status === ExpenseStatus.PAID || expense.status === ExpenseStatus.CANCELLED) {
      throw new Error(`Cannot update expense with status: ${expense.status}`);
    }

    // Validate location if provided
    if (data.locationId) {
      const location = await this.prisma.company_locations.findFirst({
        where: { id: data.locationId, company_id: companyId, is_active: true },
      });
      if (!location) {
        throw new Error('Invalid locationId for this company');
      }
    }

    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category as ExpenseCategory;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.expenseDate !== undefined) updateData.expense_date = new Date(data.expenseDate);
    if (data.locationId !== undefined) updateData.location_id = data.locationId;
    if (data.employeeId !== undefined) updateData.employee_id = data.employeeId;
    if (data.employeeName !== undefined) updateData.employee_name = data.employeeName;
    if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod as PaymentMethod;
    if (data.paymentDate !== undefined) updateData.payment_date = data.paymentDate ? new Date(data.paymentDate) : null;
    if (data.receiptUrl !== undefined) updateData.receipt_url = data.receiptUrl;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isRecurring !== undefined) updateData.is_recurring = data.isRecurring;
    if (data.recurringPeriod !== undefined) updateData.recurring_period = data.recurringPeriod;

    const updated = await this.prisma.expenses.update({
      where: { id: expense.id },
      data: updateData,
    });

    return this.toDto(updated);
  }

  async updateExpenseStatus(
    companyId: string,
    expenseId: string,
    status: string,
    userId?: string,
    reason?: string
  ) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!expenseId || !expenseId.trim()) {
      throw new Error('Missing required field: expenseId');
    }

    const expense = await this.prisma.expenses.findFirst({
      where: {
        company_id: companyId,
        expense_id: expenseId,
        is_active: true,
      },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
      APPROVED: ['PAID', 'CANCELLED'],
      REJECTED: ['PENDING'],
      PAID: [],
      CANCELLED: [],
    };

    const currentStatus = expense.status;
    const allowedStatuses = validTransitions[currentStatus] || [];

    if (!allowedStatuses.includes(status)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${status}`);
    }

    const updateData: any = {
      status: status as ExpenseStatus,
    };

    if (status === 'APPROVED') {
      updateData.approved_by = userId || null;
      updateData.approved_at = new Date();
    }

    if (status === 'REJECTED') {
      updateData.rejected_reason = reason || null;
    }

    const updated = await this.prisma.expenses.update({
      where: { id: expense.id },
      data: updateData,
    });

    return this.toDto(updated);
  }

  async deleteExpense(companyId: string, expenseId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!expenseId || !expenseId.trim()) {
      throw new Error('Missing required field: expenseId');
    }

    const expense = await this.prisma.expenses.findFirst({
      where: {
        company_id: companyId,
        expense_id: expenseId,
        is_active: true,
      },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    // Only PENDING expenses can be deleted
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new Error(`Cannot delete expense with status: ${expense.status}. Only PENDING expenses can be deleted.`);
    }

    await this.prisma.expenses.update({
      where: { id: expense.id },
      data: { is_active: false },
    });

    return { success: true, message: 'Expense deleted successfully' };
  }

  async getExpenseStats(companyId: string, fromDate?: Date, toDate?: Date) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    const where: any = {
      company_id: companyId,
      is_active: true,
    };

    if (fromDate || toDate) {
      where.expense_date = {};
      if (fromDate) where.expense_date.gte = fromDate;
      if (toDate) where.expense_date.lte = toDate;
    }

    const [total, byStatus, byCategory] = await Promise.all([
      this.prisma.expenses.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expenses.groupBy({
        by: ['status'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expenses.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalAmount: Number(total._sum.amount || 0),
      totalCount: total._count,
      byStatus: byStatus.map(s => ({
        status: s.status,
        amount: Number(s._sum.amount || 0),
        count: s._count,
      })),
      byCategory: byCategory.map(c => ({
        category: c.category,
        amount: Number(c._sum.amount || 0),
        count: c._count,
      })),
    };
  }

  private toDto(expense: any) {
    return {
      id: expense.id,
      expenseId: expense.expense_id,
      companyId: expense.company_id,
      locationId: expense.location_id,
      title: expense.title,
      description: expense.description,
      category: expense.category,
      amount: Number(expense.amount),
      currency: expense.currency,
      expenseDate: expense.expense_date,
      status: expense.status,
      approvedBy: expense.approved_by,
      approvedAt: expense.approved_at,
      rejectedReason: expense.rejected_reason,
      paymentMethod: expense.payment_method,
      paymentDate: expense.payment_date,
      transactionRef: expense.transaction_ref,
      employeeId: expense.employee_id,
      employeeName: expense.employee_name,
      receiptUrl: expense.receipt_url,
      attachments: expense.attachments,
      notes: expense.notes,
      tags: expense.tags,
      isRecurring: expense.is_recurring,
      recurringPeriod: expense.recurring_period,
      isActive: expense.is_active,
      createdAt: expense.created_at,
      updatedAt: expense.updated_at,
    };
  }
}

export const expenseService = new ExpenseService();
