const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export type PettyCashTransactionType = 'REPLENISHMENT' | 'DISBURSEMENT' | 'ADJUSTMENT';

export interface PettyCashAccount {
  id: string;
  accountId: string;
  companyId: string;
  name: string;
  description?: string;
  currency: string;
  currentBalance: number;
  initialBalance: number;
  maxLimit?: number;
  minBalance?: number;
  locationId?: string;
  custodianId?: string;
  custodianName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  location?: {
    id: string;
    name: string;
    locationId: string;
  };
}

export interface PettyCashTransaction {
  id: string;
  transactionId: string;
  accountId: string;
  companyId: string;
  transactionType: PettyCashTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  transactionDate: string;
  description?: string;
  category?: string;
  recipientName?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  approvedBy?: string;
  notes?: string;
  recordedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  account?: PettyCashAccount;
}

export interface CreateAccountRequest {
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

export interface UpdateAccountRequest {
  name?: string;
  description?: string;
  maxLimit?: number;
  minBalance?: number;
  custodianId?: string;
  custodianName?: string;
  isActive?: boolean;
}

export interface CreateTransactionRequest {
  accountId: string;
  transactionType: PettyCashTransactionType;
  amount: number;
  transactionDate: string;
  description?: string;
  category?: string;
  recipientName?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  approvedBy?: string;
  notes?: string;
}

export interface TransactionFilters {
  accountId?: string;
  transactionType?: string;
  category?: string;
  fromDate?: string;
  toDate?: string;
}

export interface PettyCashSummary {
  totalAccounts: number;
  totalBalance: number;
  totalReplenishments: number;
  totalDisbursements: number;
  lowBalanceAccounts: number;
  recentTransactions: PettyCashTransaction[];
}

class PettyCashService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // Account methods
  async getAccounts(locationId?: string): Promise<PettyCashAccount[]> {
    const query = new URLSearchParams();
    if (locationId) query.append('locationId', locationId);

    const url = `${API_BASE_URL}/petty-cash/accounts${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch petty cash accounts');
    }

    const result = await response.json();
    return result.data || [];
  }

  async createAccount(data: CreateAccountRequest): Promise<PettyCashAccount> {
    const response = await fetch(`${API_BASE_URL}/petty-cash/accounts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create petty cash account');
    }

    const result = await response.json();
    return result.data;
  }

  async getAccountById(accountId: string): Promise<PettyCashAccount> {
    const response = await fetch(`${API_BASE_URL}/petty-cash/accounts/${accountId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch petty cash account');
    }

    const result = await response.json();
    return result.data;
  }

  async updateAccount(accountId: string, data: UpdateAccountRequest): Promise<PettyCashAccount> {
    const response = await fetch(`${API_BASE_URL}/petty-cash/accounts/${accountId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update petty cash account');
    }

    const result = await response.json();
    return result.data;
  }

  // Transaction methods
  async getTransactions(filters?: TransactionFilters): Promise<PettyCashTransaction[]> {
    const query = new URLSearchParams();
    if (filters?.accountId) query.append('accountId', filters.accountId);
    if (filters?.transactionType) query.append('transactionType', filters.transactionType);
    if (filters?.category) query.append('category', filters.category);
    if (filters?.fromDate) query.append('fromDate', filters.fromDate);
    if (filters?.toDate) query.append('toDate', filters.toDate);

    const url = `${API_BASE_URL}/petty-cash/transactions${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch transactions');
    }

    const result = await response.json();
    return result.data || [];
  }

  async createTransaction(data: CreateTransactionRequest): Promise<PettyCashTransaction> {
    const response = await fetch(`${API_BASE_URL}/petty-cash/transactions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create transaction');
    }

    const result = await response.json();
    return result.data;
  }

  async getTransactionById(transactionId: string): Promise<PettyCashTransaction> {
    const response = await fetch(`${API_BASE_URL}/petty-cash/transactions/${transactionId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch transaction');
    }

    const result = await response.json();
    return result.data;
  }

  // Summary
  async getSummary(accountId?: string): Promise<PettyCashSummary> {
    const query = new URLSearchParams();
    if (accountId) query.append('accountId', accountId);

    const url = `${API_BASE_URL}/petty-cash/summary${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch summary');
    }

    const result = await response.json();
    return result.data;
  }
}

export const pettyCashService = new PettyCashService();
