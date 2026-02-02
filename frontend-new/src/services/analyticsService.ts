import { API_BASE_URL } from '../config/api';

export interface DashboardAnalytics {
  // Core Stats
  totalProducts: number;
  activeOrders: number;
  teamMembers: number;
  monthlyRevenue: number;
  
  // Financial Stats
  totalInvoices: number;
  totalBills: number;
  totalPurchaseOrders: number;
  pendingPayments: number;
  overdueInvoices: number;
  
  // Inventory Stats
  lowStockProducts: number;
  outOfStockProducts: number;
  totalInventoryValue: number;
  
  // Quality Stats
  totalInspections: number;
  passedInspections: number;
  failedInspections: number;
  activeDefects: number;
  
  // Machine Stats
  totalMachines: number;
  activeMachines: number;
  underMaintenance: number;
  activeBreakdowns: number;
  
  // Customer & Supplier Stats
  totalCustomers: number;
  totalSuppliers: number;
  
  // Textile Operations Stats
  fabricProduction: number;
  yarnManufacturing: number;
  dyeingFinishing: number;
  garmentManufacturing: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalRevenue: number;
}

class AnalyticsService {
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

  /**
   * Get comprehensive dashboard analytics
   */
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard analytics');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(months: number = 12): Promise<RevenueData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/revenue-trends?months=${months}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch revenue trends');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching revenue trends:', error);
      throw error;
    }
  }

  /**
   * Get top selling products
   */
  async getTopProducts(limit: number = 10): Promise<TopProduct[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/top-products?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch top products');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw error;
    }
  }

  /**
   * Get top customers
   */
  async getTopCustomers(limit: number = 10): Promise<TopCustomer[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/top-customers?limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch top customers');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching top customers:', error);
      throw error;
    }
  }

  /**
   * Get quality metrics summary
   */
  async getQualityMetrics(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/quality-metrics`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quality metrics');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching quality metrics:', error);
      throw error;
    }
  }

  /**
   * Get production summary
   */
  async getProductionSummary(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/production-summary`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch production summary');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching production summary:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
