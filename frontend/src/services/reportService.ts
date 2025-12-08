import {
  ProfitLossReport,
  BalanceSheetReport,
  CashFlowReport,
  TrialBalanceReport,
  GSTReport,
  ARAgingReport,
  APAgingReport,
  ExpenseSummaryReport,
  SalesSummaryReport,
  InventorySummaryReport,
  ProductionEfficiencyReport,
  MachineUtilizationReport,
  QualityMetricsReport,
  InventoryMovementReport,
  ProductionPlanningReport,
  SalesTrendsReport,
  ProductPerformanceReport,
  CustomerInsightsReport,
  BusinessPerformanceReport,
  TextileAnalyticsReport
} from './reportTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

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

  // Operational Reports
  async getProductionEfficiencyReport(startDate: string, endDate: string): Promise<ProductionEfficiencyReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/production-efficiency?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch production efficiency report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching production efficiency report:', error);
      throw error;
    }
  }

  async getMachineUtilizationReport(startDate: string, endDate: string, locationId?: string): Promise<MachineUtilizationReport> {
    try {
      let url = `${API_BASE_URL}/reports/machine-utilization?startDate=${startDate}&endDate=${endDate}`;
      if (locationId && locationId !== 'all') {
        url += `&locationId=${locationId}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch machine utilization report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching machine utilization report:', error);
      throw error;
    }
  }

  async getQualityMetricsReport(startDate: string, endDate: string): Promise<QualityMetricsReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/quality-metrics?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quality metrics report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching quality metrics report:', error);
      throw error;
    }
  }

  async getInventoryMovementReport(startDate: string, endDate: string, locationId?: string): Promise<InventoryMovementReport> {
    try {
      let url = `${API_BASE_URL}/reports/inventory-movement?startDate=${startDate}&endDate=${endDate}`;
      if (locationId && locationId !== 'all') {
        url += `&locationId=${locationId}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inventory movement report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching inventory movement report:', error);
      throw error;
    }
  }

  async getProductionPlanningReport(startDate: string, endDate: string): Promise<ProductionPlanningReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/production-planning?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch production planning report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching production planning report:', error);
      throw error;
    }
  }

  // Analytics Reports
  async getSalesTrendsReport(startDate: string, endDate: string, groupBy: string): Promise<SalesTrendsReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/sales-trends?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales trends report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching sales trends report:', error);
      throw error;
    }
  }

  async getProductPerformanceReport(startDate: string, endDate: string, limit: number): Promise<ProductPerformanceReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/product-performance?startDate=${startDate}&endDate=${endDate}&limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product performance report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching product performance report:', error);
      throw error;
    }
  }

  async getCustomerInsightsReport(startDate: string, endDate: string): Promise<CustomerInsightsReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/customer-insights?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer insights report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching customer insights report:', error);
      throw error;
    }
  }

  async getBusinessPerformanceReport(startDate: string, endDate: string): Promise<BusinessPerformanceReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/business-performance?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch business performance report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching business performance report:', error);
      throw error;
    }
  }

  async getTextileAnalyticsReport(startDate: string, endDate: string, category?: string): Promise<TextileAnalyticsReport> {
    try {
      let url = `${API_BASE_URL}/reports/textile-analytics?startDate=${startDate}&endDate=${endDate}`;
      if (category && category !== 'all') {
        url += `&category=${category}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch textile analytics report');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching textile analytics report:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
