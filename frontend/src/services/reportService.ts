const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// Types for Financial Reports
export interface ProfitLossReport {
  summary: {
    totalRevenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  revenueBreakdown: {
    productId: string;
    productName: string;
    revenue: number;
    percentage: number;
  }[];
  expenseBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  periodComparison: {
    period: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface BalanceSheetReport {
  summary: {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    asOfDate: string;
  };
  assets: {
    currentAssets: {
      category: string;
      amount: number;
    }[];
    fixedAssets: {
      category: string;
      amount: number;
    }[];
    totalCurrentAssets: number;
    totalFixedAssets: number;
  };
  liabilities: {
    currentLiabilities: {
      category: string;
      amount: number;
    }[];
    longTermLiabilities: {
      category: string;
      amount: number;
    }[];
    totalCurrentLiabilities: number;
    totalLongTermLiabilities: number;
  };
  equity: {
    category: string;
    amount: number;
  }[];
}

export interface CashFlowReport {
  summary: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
    beginningCashBalance: number;
    endingCashBalance: number;
  };
  operatingActivities: {
    category: string;
    amount: number;
  }[];
  investingActivities: {
    category: string;
    amount: number;
  }[];
  financingActivities: {
    category: string;
    amount: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface TrialBalanceReport {
  summary: {
    totalDebits: number;
    totalCredits: number;
    difference: number;
    asOfDate: string;
  };
  accounts: {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }[];
}

export interface GSTReport {
  summary: {
    totalOutputTax: number;
    totalInputTax: number;
    netTaxPayable: number;
    period: string;
  };
  outputTax: {
    invoiceId: string;
    customerName: string;
    invoiceDate: string;
    taxableAmount: number;
    taxAmount: number;
    taxRate: number;
  }[];
  inputTax: {
    billId: string;
    supplierName: string;
    billDate: string;
    taxableAmount: number;
    taxAmount: number;
    taxRate: number;
  }[];
}

export interface ARAgingReport {
  summary: {
    totalOutstanding: number;
    totalInvoices: number;
    asOfDate: string;
  };
  agingBuckets: {
    current: number; // 0-30 days
    days31to60: number;
    days61to90: number;
    over90: number;
  };
  customerAging: {
    customerId: string;
    customerName: string;
    customerCode: string | null;
    email: string | null;
    phone: string | null;
    totalOutstanding: number;
    current: number;
    days31to60: number;
    days61to90: number;
    over90: number;
    invoices: {
      invoiceId: string;
      invoiceDate: string;
      dueDate: string;
      totalAmount: number;
      balanceDue: number;
      daysOverdue: number;
      status: string;
    }[];
  }[];
}

export interface APAgingReport {
  summary: {
    totalOutstanding: number;
    totalBills: number;
    asOfDate: string;
  };
  agingBuckets: {
    current: number; // 0-30 days
    days31to60: number;
    days61to90: number;
    over90: number;
  };
  supplierAging: {
    supplierId: string;
    supplierName: string;
    supplierCode: string | null;
    email: string | null;
    phone: string | null;
    totalOutstanding: number;
    current: number;
    days31to60: number;
    days61to90: number;
    over90: number;
    bills: {
      billId: string;
      billDate: string;
      dueDate: string;
      totalAmount: number;
      balanceDue: number;
      daysOverdue: number;
      status: string;
    }[];
  }[];
}

export interface ExpenseSummaryReport {
  summary: {
    totalExpenses: number;
    totalBills: number;
    paidBills: number;
    totalPaid: number;
    totalOutstanding: number;
    averageBillValue: number;
    paymentRate: number;
  };
  supplierExpenses: {
    supplierId: string;
    supplierName: string;
    supplierCode: string | null;
    totalExpenses: number;
    billCount: number;
  }[];
  expensesTrend: {
    month: string;
    expenses: number;
    billCount: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface SalesSummaryReport {
  summary: {
    totalRevenue: number;
    totalInvoices: number;
    paidInvoices: number;
    totalPaid: number;
    totalOutstanding: number;
    averageInvoiceValue: number;
    collectionRate: number;
  };
  customerSales: {
    customerId: string;
    customerName: string;
    customerCode: string | null;
    totalSales: number;
    invoiceCount: number;
  }[];
  productSales: {
    productId: string;
    productName: string;
    productCode: string | null;
    quantity: number;
    revenue: number;
  }[];
  salesTrend: {
    month: string;
    revenue: number;
    invoiceCount: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface InventorySummaryReport {
  summary: {
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    lowStockCount: number;
  };
  lowStockItems: {
    productId: string;
    productCode: string | null;
    productName: string | null;
    locationId: string;
    locationName: string | null;
    quantityOnHand: number;
    reorderLevel: number;
    unitOfMeasure: string | null;
  }[];
  stockByLocation: {
    locationId: string;
    locationName: string;
    itemCount: number;
    totalQuantity: number;
    totalValue: number;
  }[];
  topProductsByValue: {
    productId: string;
    productCode: string | null;
    productName: string | null;
    quantityOnHand: number;
    unitPrice: number;
    totalValue: number;
    unitOfMeasure: string | null;
  }[];
}

class ReportService {
  private getAuthHeaders(): HeadersInit {
    const tokensStr = localStorage.getItem('auth_tokens');
    let token = null;
    
    if (tokensStr) {
      try {
        const tokens = JSON.parse(tokensStr);
        token = tokens.accessToken || tokens.token;
      } catch (e) {
        console.error('Failed to parse auth tokens:', e);
      }
    }
    
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Financial Reports
  async getProfitLossReport(startDate: string, endDate: string): Promise<ProfitLossReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profit & loss report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching profit & loss report:', error);
      throw error;
    }
  }

  async getBalanceSheet(asOfDate?: string): Promise<BalanceSheetReport> {
    try {
      const url = asOfDate ? `${API_BASE_URL}/reports/balance-sheet?asOfDate=${asOfDate}` : `${API_BASE_URL}/reports/balance-sheet`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance sheet');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
      throw error;
    }
  }

  async getCashFlowStatement(startDate: string, endDate: string): Promise<CashFlowReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cash flow statement');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching cash flow statement:', error);
      throw error;
    }
  }

  async getTrialBalance(asOfDate?: string): Promise<TrialBalanceReport> {
    try {
      const url = asOfDate ? `${API_BASE_URL}/reports/trial-balance?asOfDate=${asOfDate}` : `${API_BASE_URL}/reports/trial-balance`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trial balance');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching trial balance:', error);
      throw error;
    }
  }

  async getGSTReport(period: string): Promise<GSTReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/gst?period=${period}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch GST report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching GST report:', error);
      throw error;
    }
  }

  // Existing Reports
  async getARAgingReport(asOfDate?: string): Promise<ARAgingReport> {
    try {
      const url = asOfDate ? `${API_BASE_URL}/reports/ar-aging?asOfDate=${asOfDate}` : `${API_BASE_URL}/reports/ar-aging`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AR aging report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching AR aging report:', error);
      throw error;
    }
  }

  async getAPAgingReport(asOfDate?: string): Promise<APAgingReport> {
    try {
      const url = asOfDate ? `${API_BASE_URL}/reports/ap-aging?asOfDate=${asOfDate}` : `${API_BASE_URL}/reports/ap-aging`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AP aging report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching AP aging report:', error);
      throw error;
    }
  }

  async getExpenseSummary(startDate: string, endDate: string): Promise<ExpenseSummaryReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/expense-summary?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expense summary');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching expense summary:', error);
      throw error;
    }
  }

  async getSalesSummary(startDate: string, endDate: string): Promise<SalesSummaryReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/sales-summary?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales summary');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      throw error;
    }
  }

  async getInventorySummary(locationId?: string): Promise<InventorySummaryReport> {
    try {
      const url = locationId ? `${API_BASE_URL}/reports/inventory-summary?locationId=${locationId}` : `${API_BASE_URL}/reports/inventory-summary`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inventory summary');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
