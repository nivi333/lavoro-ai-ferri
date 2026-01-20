import { PrismaClient, PettyCashTransactionType } from '@prisma/client';
import { globalPrisma } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

const prisma = globalPrisma;

export interface CreatePettyCashAccountData {
  name: string;
  description?: string;
  currency?: string;
  initialBalance: number;
  maxLimit?: number;
  minBalance?: number;
  locationId?: string;
  custodianId?: string;
  custodianName?: string;
}

export interface UpdatePettyCashAccountData {
  name?: string;
  description?: string;
  maxLimit?: number;
  minBalance?: number;
  custodianId?: string;
  custodianName?: string;
  isActive?: boolean;
}

export interface CreateTransactionData {
  accountId: string;
  transactionType: 'REPLENISHMENT' | 'DISBURSEMENT' | 'ADJUSTMENT';
  amount: number;
  transactionDate: Date;
  description?: string;
  category?: string;
  recipientName?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  approvedBy?: string;
  notes?: string;
}

export interface ListTransactionFilters {
  accountId?: string;
  transactionType?: string;
  category?: string;
  fromDate?: Date;
  toDate?: Date;
}

export class PettyCashService {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }

  private async generateAccountId(companyId: string): Promise<string> {
    const lastAccount = await this.prisma.petty_cash_accounts.findFirst({
      where: { company_id: companyId },
      orderBy: { account_id: 'desc' },
      select: { account_id: true },
    });

    let nextNumber = 1;
    if (lastAccount?.account_id) {
      const match = lastAccount.account_id.match(/PCA(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `PCA${String(nextNumber).padStart(3, '0')}`;
  }

  private async generateTransactionId(companyId: string): Promise<string> {
    const lastTransaction = await this.prisma.petty_cash_transactions.findFirst({
      where: { company_id: companyId },
      orderBy: { transaction_id: 'desc' },
      select: { transaction_id: true },
    });

    let nextNumber = 1;
    if (lastTransaction?.transaction_id) {
      const match = lastTransaction.transaction_id.match(/PCT(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `PCT${String(nextNumber).padStart(4, '0')}`;
  }

  async createAccount(companyId: string, data: CreatePettyCashAccountData) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!data.name || !data.name.trim()) {
      throw new Error('Missing required field: name');
    }

    if (data.initialBalance === undefined || data.initialBalance < 0) {
      throw new Error('Initial balance must be 0 or greater');
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

    const accountId = await this.generateAccountId(companyId);

    const account = await this.prisma.petty_cash_accounts.create({
      data: {
        id: uuidv4(),
        account_id: accountId,
        company_id: companyId,
        location_id: data.locationId || null,
        name: data.name.trim(),
        description: data.description || null,
        currency: data.currency || 'INR',
        initial_balance: data.initialBalance,
        current_balance: data.initialBalance,
        max_limit: data.maxLimit || null,
        min_balance: data.minBalance || null,
        custodian_id: data.custodianId || null,
        custodian_name: data.custodianName || null,
        is_active: true,
      },
    });

    return this.toAccountDto(account);
  }

  async getAccounts(companyId: string, locationId?: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    const where: any = {
      company_id: companyId,
      is_active: true,
    };

    if (locationId) {
      where.location_id = locationId;
    }

    const accounts = await this.prisma.petty_cash_accounts.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return accounts.map(account => this.toAccountDto(account));
  }

  async getAccountById(companyId: string, accountId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!accountId || !accountId.trim()) {
      throw new Error('Missing required field: accountId');
    }

    const account = await this.prisma.petty_cash_accounts.findFirst({
      where: {
        company_id: companyId,
        account_id: accountId,
        is_active: true,
      },
      include: {
        transactions: {
          where: { is_active: true },
          orderBy: { transaction_date: 'desc' },
          take: 10,
        },
      },
    });

    if (!account) {
      throw new Error('Petty cash account not found');
    }

    return {
      ...this.toAccountDto(account),
      recentTransactions: account.transactions.map(t => this.toTransactionDto(t)),
    };
  }

  async updateAccount(companyId: string, accountId: string, data: UpdatePettyCashAccountData) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!accountId || !accountId.trim()) {
      throw new Error('Missing required field: accountId');
    }

    const account = await this.prisma.petty_cash_accounts.findFirst({
      where: {
        company_id: companyId,
        account_id: accountId,
        is_active: true,
      },
    });

    if (!account) {
      throw new Error('Petty cash account not found');
    }

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.maxLimit !== undefined) updateData.max_limit = data.maxLimit;
    if (data.minBalance !== undefined) updateData.min_balance = data.minBalance;
    if (data.custodianId !== undefined) updateData.custodian_id = data.custodianId;
    if (data.custodianName !== undefined) updateData.custodian_name = data.custodianName;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const updated = await this.prisma.petty_cash_accounts.update({
      where: { id: account.id },
      data: updateData,
    });

    return this.toAccountDto(updated);
  }

  async createTransaction(companyId: string, data: CreateTransactionData, userId?: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!data.accountId || !data.accountId.trim()) {
      throw new Error('Missing required field: accountId');
    }

    if (!data.transactionType) {
      throw new Error('Missing required field: transactionType');
    }

    if (data.amount === undefined || data.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!data.transactionDate) {
      throw new Error('Missing required field: transactionDate');
    }

    // Find the account
    const account = await this.prisma.petty_cash_accounts.findFirst({
      where: {
        company_id: companyId,
        account_id: data.accountId,
        is_active: true,
      },
    });

    if (!account) {
      throw new Error('Petty cash account not found');
    }

    const currentBalance = Number(account.current_balance);
    let newBalance: number;

    // Calculate new balance based on transaction type
    if (data.transactionType === 'REPLENISHMENT') {
      newBalance = currentBalance + data.amount;
      // Check max limit
      if (account.max_limit && newBalance > Number(account.max_limit)) {
        throw new Error(`Replenishment would exceed max limit of ${account.max_limit}`);
      }
    } else if (data.transactionType === 'DISBURSEMENT') {
      newBalance = currentBalance - data.amount;
      if (newBalance < 0) {
        throw new Error('Insufficient balance for disbursement');
      }
    } else if (data.transactionType === 'ADJUSTMENT') {
      // Adjustment can be positive or negative, amount is the final adjustment
      newBalance = currentBalance + data.amount;
      if (newBalance < 0) {
        throw new Error('Adjustment would result in negative balance');
      }
    } else {
      throw new Error('Invalid transaction type');
    }

    const transactionId = await this.generateTransactionId(companyId);

    // Use transaction to update account and create transaction record
    const result = await this.prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.petty_cash_transactions.create({
        data: {
          id: uuidv4(),
          transaction_id: transactionId,
          company_id: companyId,
          account_id: account.id,
          transaction_type: data.transactionType as PettyCashTransactionType,
          amount: data.amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          transaction_date: new Date(data.transactionDate),
          description: data.description || null,
          category: data.category || null,
          recipient_name: data.recipientName || null,
          receipt_number: data.receiptNumber || null,
          receipt_url: data.receiptUrl || null,
          approved_by: data.approvedBy || null,
          recorded_by: userId || null,
          notes: data.notes || null,
          is_active: true,
        },
      });

      // Update account balance
      await tx.petty_cash_accounts.update({
        where: { id: account.id },
        data: { current_balance: newBalance },
      });

      return transaction;
    });

    // Check if balance is below minimum and return warning
    const warning =
      account.min_balance && newBalance < Number(account.min_balance)
        ? `Warning: Balance is below minimum threshold of ${account.min_balance}`
        : undefined;

    return {
      ...this.toTransactionDto(result),
      newBalance,
      warning,
    };
  }

  async getTransactions(companyId: string, filters?: ListTransactionFilters) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    const where: any = {
      company_id: companyId,
      is_active: true,
    };

    if (filters?.accountId) {
      // Find account by account_id
      const account = await this.prisma.petty_cash_accounts.findFirst({
        where: { company_id: companyId, account_id: filters.accountId },
        select: { id: true },
      });
      if (account) {
        where.account_id = account.id;
      }
    }

    if (filters?.transactionType) {
      where.transaction_type = filters.transactionType;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.transaction_date = {};
      if (filters.fromDate) {
        where.transaction_date.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.transaction_date.lte = new Date(filters.toDate);
      }
    }

    const transactions = await this.prisma.petty_cash_transactions.findMany({
      where,
      orderBy: { transaction_date: 'desc' },
      include: {
        account: {
          select: { account_id: true, name: true },
        },
      },
    });

    return transactions.map(t => ({
      ...this.toTransactionDto(t),
      accountName: t.account.name,
    }));
  }

  async getTransactionById(companyId: string, transactionId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!transactionId || !transactionId.trim()) {
      throw new Error('Missing required field: transactionId');
    }

    const transaction = await this.prisma.petty_cash_transactions.findFirst({
      where: {
        company_id: companyId,
        transaction_id: transactionId,
        is_active: true,
      },
      include: {
        account: {
          select: { account_id: true, name: true },
        },
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return {
      ...this.toTransactionDto(transaction),
      accountName: transaction.account.name,
    };
  }

  async getAccountSummary(companyId: string, accountId?: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    const where: any = {
      company_id: companyId,
      is_active: true,
    };

    if (accountId) {
      const account = await this.prisma.petty_cash_accounts.findFirst({
        where: { company_id: companyId, account_id: accountId },
        select: { id: true },
      });
      if (account) {
        where.account_id = account.id;
      }
    }

    const [accounts, transactions] = await Promise.all([
      this.prisma.petty_cash_accounts.findMany({
        where: { company_id: companyId, is_active: true },
      }),
      this.prisma.petty_cash_transactions.groupBy({
        by: ['transaction_type'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0);
    const totalInitialBalance = accounts.reduce((sum, acc) => sum + Number(acc.initial_balance), 0);

    const byType = transactions.reduce(
      (acc, t) => {
        acc[t.transaction_type] = {
          amount: Number(t._sum.amount || 0),
          count: t._count,
        };
        return acc;
      },
      {} as Record<string, { amount: number; count: number }>
    );

    return {
      totalAccounts: accounts.length,
      totalBalance,
      totalInitialBalance,
      totalReplenishments: byType.REPLENISHMENT?.amount || 0,
      totalDisbursements: byType.DISBURSEMENT?.amount || 0,
      totalAdjustments: byType.ADJUSTMENT?.amount || 0,
      replenishmentCount: byType.REPLENISHMENT?.count || 0,
      disbursementCount: byType.DISBURSEMENT?.count || 0,
      adjustmentCount: byType.ADJUSTMENT?.count || 0,
    };
  }

  private toAccountDto(account: any) {
    return {
      id: account.id,
      accountId: account.account_id,
      companyId: account.company_id,
      locationId: account.location_id,
      name: account.name,
      description: account.description,
      currency: account.currency,
      initialBalance: Number(account.initial_balance),
      currentBalance: Number(account.current_balance),
      maxLimit: account.max_limit ? Number(account.max_limit) : null,
      minBalance: account.min_balance ? Number(account.min_balance) : null,
      custodianId: account.custodian_id,
      custodianName: account.custodian_name,
      isActive: account.is_active,
      createdAt: account.created_at,
      updatedAt: account.updated_at,
    };
  }

  private toTransactionDto(transaction: any) {
    return {
      id: transaction.id,
      transactionId: transaction.transaction_id,
      companyId: transaction.company_id,
      accountId: transaction.account_id,
      transactionType: transaction.transaction_type,
      amount: Number(transaction.amount),
      balanceBefore: Number(transaction.balance_before),
      balanceAfter: Number(transaction.balance_after),
      transactionDate: transaction.transaction_date,
      description: transaction.description,
      category: transaction.category,
      recipientName: transaction.recipient_name,
      receiptNumber: transaction.receipt_number,
      receiptUrl: transaction.receipt_url,
      approvedBy: transaction.approved_by,
      recordedBy: transaction.recorded_by,
      notes: transaction.notes,
      isActive: transaction.is_active,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
    };
  }
}

export const pettyCashService = new PettyCashService();
