const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

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
  | 'RAW_MATERIALS'
  | 'SHIPPING'
  | 'PROFESSIONAL_SERVICES'
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
  attachments?: string[];
  notes?: string;
  tags?: string[];
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  transactionRef?: string;
  isRecurring?: boolean;
  recurringPeriod?: string;
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
  attachments?: string[];
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringPeriod?: string;
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
  attachments?: string[];
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringPeriod?: string;
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

export interface ExpenseStats {
  totalAmount: number;
  totalCount: number;
  byStatus: Array<{ status: string; amount: number; count: number }>;
  byCategory: Array<{ category: string; amount: number; count: number }>;
}

class ExpenseService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

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

    const url = `${API_BASE_URL}/expenses${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch expenses');
    }

    const result = await response.json();
    return result.data || [];
  }

  async createExpense(data: CreateExpenseRequest): Promise<ExpenseDetail> {
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create expense');
    }

    const result = await response.json();
    return result.data;
  }

  async getExpenseById(expenseId: string): Promise<ExpenseDetail> {
    const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch expense');
    }

    const result = await response.json();
    return result.data;
  }

  async updateExpense(expenseId: string, data: UpdateExpenseRequest): Promise<ExpenseDetail> {
    const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update expense');
    }

    const result = await response.json();
    return result.data;
  }

  async updateExpenseStatus(
    expenseId: string,
    status: ExpenseStatus,
    reason?: string
  ): Promise<ExpenseSummary> {
    const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update expense status');
    }

    const result = await response.json();
    return result.data;
  }

  async deleteExpense(expenseId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete expense');
    }
  }

  async getExpenseStats(fromDate?: string, toDate?: string): Promise<ExpenseStats> {
    const query = new URLSearchParams();
    if (fromDate) query.append('fromDate', fromDate);
    if (toDate) query.append('toDate', toDate);

    const url = `${API_BASE_URL}/expenses/stats${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch expense statistics');
    }

    const result = await response.json();
    return result.data;
  }
}

export const expenseService = new ExpenseService();
