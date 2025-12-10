export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';

export type ExpenseCategory =
  | 'RENT'
  | 'UTILITIES'
  | 'SALARIES'
  | 'EQUIPMENT'
  | 'SUPPLIES'
  | 'MAINTENANCE'
  | 'TRAVEL'
  | 'MARKETING'
  | 'INSURANCE'
  | 'TAXES'
  | 'MISCELLANEOUS';

export type PaymentMethod = 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'OTHER';

export interface ExpenseSummary {
  id: string;
  expenseId: string;
  companyId: string;
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  expenseDate: string;
  status: ExpenseStatus;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  locationId?: string;
  employeeId?: string;
  employeeName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  location?: {
    id: string;
    name: string;
    location_id: string;
  };
}

export interface ExpenseDetail extends ExpenseSummary {
  receiptUrl?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  transactionRef?: string;
}

export interface CreateExpenseRequest {
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  currency?: string;
  expenseDate: string;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  locationId?: string;
  employeeId?: string;
  employeeName?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface UpdateExpenseRequest {
  title?: string;
  description?: string;
  category?: ExpenseCategory;
  amount?: number;
  currency?: string;
  expenseDate?: string;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  locationId?: string;
  employeeId?: string;
  employeeName?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface ListExpensesParams {
  status?: ExpenseStatus | string;
  category?: ExpenseCategory | string;
  employeeId?: string;
  employeeName?: string;
  locationId?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

class ExpenseService {
  async getExpenses(params?: ListExpensesParams): Promise<ExpenseSummary[]> {
    const query = new URLSearchParams();

    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.employeeName) query.append('employeeName', params.employeeName);
    if (params?.locationId) query.append('locationId', params.locationId);
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    if (params?.minAmount !== undefined) query.append('minAmount', params.minAmount.toString());
    if (params?.maxAmount !== undefined) query.append('maxAmount', params.maxAmount.toString());

    // const url = `${API_BASE_URL}/expenses${query.toString() ? `?${query.toString()}` : ''}`;

    // Mock data for now - will be replaced with actual API call when backend is ready
    return this.getMockExpenses();
  }

  async createExpense(data: CreateExpenseRequest): Promise<ExpenseDetail> {
    // Mock data for now - will be replaced with actual API call when backend is ready
    const mockExpense: ExpenseDetail = {
      id: Math.random().toString(36).substring(2, 15),
      expenseId: `EXP${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')}`,
      companyId: 'COMP001',
      title: data.title,
      description: data.description,
      category: data.category,
      amount: data.amount,
      currency: data.currency || 'USD',
      expenseDate: data.expenseDate,
      status: 'PENDING',
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate,
      locationId: data.locationId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      receiptUrl: data.receiptUrl,
      notes: data.notes,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return mockExpense;
  }

  async getExpenseById(expenseId: string): Promise<ExpenseDetail> {
    // Mock data for now - will be replaced with actual API call when backend is ready
    const mockExpenses = this.getMockExpenses();
    const expense = mockExpenses.find(e => e.expenseId === expenseId);

    if (!expense) {
      throw new Error('Expense not found');
    }

    return {
      ...expense,
      receiptUrl: 'https://example.com/receipt.pdf',
      notes: 'This is a mock expense for development purposes.',
    };
  }

  async updateExpense(expenseId: string, data: UpdateExpenseRequest): Promise<ExpenseDetail> {
    // Mock data for now - will be replaced with actual API call when backend is ready
    const mockExpenses = this.getMockExpenses();
    const expense = mockExpenses.find(e => e.expenseId === expenseId);

    if (!expense) {
      throw new Error('Expense not found');
    }

    const updatedExpense: ExpenseDetail = {
      ...expense,
      ...data,
      updatedAt: new Date().toISOString(),
      receiptUrl: data.receiptUrl || 'https://example.com/receipt.pdf',
      notes: data.notes || 'This is a mock expense for development purposes.',
    };

    return updatedExpense;
  }

  async updateExpenseStatus(
    expenseId: string,
    status: ExpenseStatus,
    _reason?: string
  ): Promise<ExpenseSummary> {
    // Mock data for now - will be replaced with actual API call when backend is ready
    const mockExpenses = this.getMockExpenses();
    const expense = mockExpenses.find(e => e.expenseId === expenseId);

    if (!expense) {
      throw new Error('Expense not found');
    }

    const updatedExpense: ExpenseSummary = {
      ...expense,
      status,
      updatedAt: new Date().toISOString(),
    };

    return updatedExpense;
  }

  async deleteExpense(_expenseId: string): Promise<void> {
    // Mock data for now - will be replaced with actual API call when backend is ready
    // Just return without doing anything
  }

  // Helper method to generate mock data
  private getMockExpenses(): ExpenseSummary[] {
    const categories: ExpenseCategory[] = [
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
      'MISCELLANEOUS',
    ];

    const statuses: ExpenseStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED'];

    const mockExpenses: ExpenseSummary[] = [];

    for (let i = 1; i <= 20; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      mockExpenses.push({
        id: `exp-${i}`,
        expenseId: `EXP${i.toString().padStart(4, '0')}`,
        companyId: 'COMP001',
        title: `Expense ${i}`,
        description: `Description for expense ${i}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        amount: Math.floor(Math.random() * 10000) / 100,
        currency: 'USD',
        expenseDate: date.toISOString(),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        locationId: `loc-${Math.floor(Math.random() * 3) + 1}`,
        employeeId: `emp-${Math.floor(Math.random() * 5) + 1}`,
        employeeName: `Employee ${Math.floor(Math.random() * 5) + 1}`,
        isActive: Math.random() > 0.1, // 90% active
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
        location: {
          id: `loc-${Math.floor(Math.random() * 3) + 1}`,
          name: `Location ${Math.floor(Math.random() * 3) + 1}`,
          location_id: `LOC${Math.floor(Math.random() * 3) + 1}`,
        },
      });
    }

    return mockExpenses;
  }
}

export const expenseService = new ExpenseService();
