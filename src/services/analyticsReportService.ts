import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Analytics Report Service
 * Handles all analytics report generation
 */
class AnalyticsReportService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate Product Performance Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Product Performance Report
   */
  async generateProductPerformanceReport(
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    try {
      // Fetch products to use in the report
      const products = await this.prisma.products.findMany({
        where: {
          company_id: companyId,
        },
        select: {
          id: true,
          name: true,
        },
        take: 10, // Limit to 10 products for sample data
      });

      // Generate sample data for product performance
      const productPerformance = products.map(product => {
        const salesQuantity = Math.floor(Math.random() * 100) + 10; // 10-110
        const price = Math.floor(Math.random() * 100) + 50; // $50-150 random price
        const revenue = salesQuantity * price;
        const cost = revenue * (Math.random() * 0.4 + 0.3); // 30-70% of revenue
        const profit = revenue - cost;
        const profitMargin = (profit / revenue) * 100;
        const growthRate = Math.floor(Math.random() * 40) - 10; // -10% to +30%
        
        return {
          productId: product.id,
          productName: product.name || `Product ${product.id.substring(0, 8)}`,
          category: Math.random() > 0.5 ? 'Fabric' : 'Garment', // Random category
          salesQuantity,
          revenue,
          cost,
          profit,
          profitMargin,
          growthRate,
        };
      });

      // Calculate top performing products
      const topPerformers = [...productPerformance]
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);

      // Calculate underperforming products
      const underperformers = [...productPerformance]
        .sort((a, b) => a.profit - b.profit)
        .slice(0, 5);

      // Calculate performance by category
      const categories = [...new Set(productPerformance.map(p => p.category))];
      const performanceByCategory = categories.map(category => {
        const categoryProducts = productPerformance.filter(p => p.category === category);
        const totalRevenue = categoryProducts.reduce((sum, p) => sum + p.revenue, 0);
        const totalProfit = categoryProducts.reduce((sum, p) => sum + p.profit, 0);
        const averageProfitMargin = categoryProducts.reduce((sum, p) => sum + p.profitMargin, 0) / categoryProducts.length;
        
        return {
          category,
          totalRevenue,
          totalProfit,
          averageProfitMargin,
          productCount: categoryProducts.length,
        };
      });

      // Generate performance trend by month
      const performanceTrend = [];
      const monthCount = Math.min(12, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24 * 30)));
      
      for (let i = 0; i < Math.max(monthCount, 1); i++) {
        const currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + i);
        const month = currentDate.toISOString().substr(0, 7); // YYYY-MM
        
        const revenue = Math.floor(Math.random() * 50000) + 10000; // $10,000-$60,000
        const profit = revenue * (Math.random() * 0.3 + 0.1); // 10-40% profit margin
        
        performanceTrend.push({
          month,
          revenue,
          profit,
          profitMargin: (profit / revenue) * 100,
        });
      }

      return {
        summary: {
          totalRevenue: productPerformance.reduce((sum, p) => sum + p.revenue, 0),
          totalProfit: productPerformance.reduce((sum, p) => sum + p.profit, 0),
          averageProfitMargin: productPerformance.reduce((sum, p) => sum + p.profitMargin, 0) / productPerformance.length,
          productCount: productPerformance.length,
        },
        productPerformance: productPerformance.sort((a, b) => b.profit - a.profit),
        topPerformers,
        underperformers,
        performanceByCategory,
        performanceTrend: performanceTrend.sort((a, b) => a.month.localeCompare(b.month)),
        dateRange: {
          startDate,
          endDate,
        },
      };
    } catch (error) {
      logger.error('Error generating product performance report:', error);
      throw new Error('Failed to generate product performance report');
    }
  }

  /**
   * Generate Customer Insights Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Customer Insights Report
   */
  async generateCustomerInsightsReport(
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    try {
      // Fetch customers to use in the report
      const customers = await this.prisma.customers.findMany({
        where: {
          company_id: companyId,
        },
        select: {
          id: true,
          name: true,
          customer_type: true,
          created_at: true,
        },
        take: 15, // Limit to 15 customers for sample data
      });

      // Generate sample data for customer insights
      const customerInsights = customers.map(customer => {
        const orderCount = Math.floor(Math.random() * 20) + 1; // 1-21
        const totalSpent = orderCount * (Math.floor(Math.random() * 500) + 200); // $200-$700 per order
        const averageOrderValue = totalSpent / orderCount;
        const lastPurchaseDate = new Date(
          startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
        );
        
        // Calculate days since first purchase
        const daysSinceFirstPurchase = Math.floor(
          (new Date().getTime() - customer.created_at.getTime()) / (1000 * 3600 * 24)
        );
        
        // Calculate customer lifetime value
        const customerLifetimeValue = totalSpent * (1 + (daysSinceFirstPurchase / 365) * 0.1);
        
        return {
          customerId: customer.id,
          customerName: customer.name,
          customerType: customer.customer_type || 'BUSINESS',
          orderCount,
          totalSpent,
          averageOrderValue,
          lastPurchaseDate,
          customerLifetimeValue,
          loyaltyScore: Math.floor(Math.random() * 100) + 1, // 1-100
        };
      });

      // Calculate top customers by spend
      const topCustomers = [...customerInsights]
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      // Calculate insights by customer type
      const customerTypes = [...new Set(customerInsights.map(c => c.customerType))];
      const insightsByType = customerTypes.map(type => {
        const typeCustomers = customerInsights.filter(c => c.customerType === type);
        const totalSpent = typeCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
        const averageOrderValue = typeCustomers.reduce((sum, c) => sum + c.averageOrderValue, 0) / typeCustomers.length;
        
        return {
          customerType: type,
          customerCount: typeCustomers.length,
          totalSpent,
          averageOrderValue,
          averageLoyaltyScore: typeCustomers.reduce((sum, c) => sum + c.loyaltyScore, 0) / typeCustomers.length,
        };
      });

      // Calculate retention rate
      const totalCustomers = customerInsights.length;
      const activeCustomers = customerInsights.filter(c => {
        const daysSinceLastPurchase = Math.floor(
          (new Date().getTime() - c.lastPurchaseDate.getTime()) / (1000 * 3600 * 24)
        );
        return daysSinceLastPurchase < 90; // Active if purchased in last 90 days
      }).length;
      
      const retentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;

      return {
        summary: {
          totalCustomers,
          activeCustomers,
          retentionRate,
          averageOrderValue: customerInsights.reduce((sum, c) => sum + c.averageOrderValue, 0) / customerInsights.length,
          totalRevenue: customerInsights.reduce((sum, c) => sum + c.totalSpent, 0),
        },
        customerInsights: customerInsights.sort((a, b) => b.totalSpent - a.totalSpent),
        topCustomers,
        insightsByType,
        dateRange: {
          startDate,
          endDate,
        },
      };
    } catch (error) {
      logger.error('Error generating customer insights report:', error);
      throw new Error('Failed to generate customer insights report');
    }
  }

  /**
   * Generate Business Performance Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Business Performance Report
   */
  async generateBusinessPerformanceReport(
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    try {
      // Fetch financial documents to get revenue data
      const financialDocuments = await this.prisma.financial_documents.findMany({
        where: {
          company_id: companyId,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          document_type: true,
          total_amount: true,
          created_at: true,
        },
      });

      // Calculate revenue and expenses
      const revenue = financialDocuments
        .filter(doc => doc.document_type === 'INVOICE')
        .reduce((sum, doc) => sum + Number(doc.total_amount || 0), 0);
      
      const expenses = financialDocuments
        .filter(doc => doc.document_type === 'BILL')
        .reduce((sum, doc) => sum + Number(doc.total_amount || 0), 0);
      
      // Calculate profit and margins
      const profit = revenue - expenses;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      // Generate monthly performance data
      const monthlyPerformance = [];
      const monthCount = Math.min(12, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24 * 30)));
      
      for (let i = 0; i < Math.max(monthCount, 1); i++) {
        const currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + i);
        const month = currentDate.toISOString().substr(0, 7); // YYYY-MM
        
        const monthRevenue = Math.floor(Math.random() * 100000) + 50000; // $50,000-$150,000
        const monthExpenses = monthRevenue * (Math.random() * 0.5 + 0.3); // 30-80% of revenue
        const monthProfit = monthRevenue - monthExpenses;
        
        monthlyPerformance.push({
          month,
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthProfit,
          profitMargin: (monthProfit / monthRevenue) * 100,
        });
      }

      // Generate KPI data
      const kpiData = {
        salesGrowth: Math.floor(Math.random() * 30) - 5, // -5% to +25%
        customerAcquisitionCost: Math.floor(Math.random() * 500) + 200, // $200-$700
        customerLifetimeValue: Math.floor(Math.random() * 5000) + 1000, // $1,000-$6,000
        averageOrderValue: Math.floor(Math.random() * 500) + 100, // $100-$600
        conversionRate: Math.floor(Math.random() * 10) + 1, // 1-11%
        returnOnInvestment: Math.floor(Math.random() * 50) + 10, // 10-60%
      };

      // Generate department performance data
      const departments = ['Sales', 'Marketing', 'Production', 'R&D', 'Customer Service'];
      const departmentPerformance = departments.map(department => {
        const budget = Math.floor(Math.random() * 50000) + 10000; // $10,000-$60,000
        const actual = budget * (Math.random() * 0.4 + 0.8); // 80-120% of budget
        const variance = actual - budget;
        const variancePercentage = (variance / budget) * 100;
        
        return {
          department,
          budget,
          actual,
          variance,
          variancePercentage,
          performanceScore: Math.floor(Math.random() * 40) + 60, // 60-100
        };
      });

      return {
        summary: {
          revenue,
          expenses,
          profit,
          profitMargin,
          roi: profit > 0 && expenses > 0 ? (profit / expenses) * 100 : 0,
        },
        monthlyPerformance: monthlyPerformance.sort((a, b) => a.month.localeCompare(b.month)),
        kpiData,
        departmentPerformance,
        dateRange: {
          startDate,
          endDate,
        },
      };
    } catch (error) {
      logger.error('Error generating business performance report:', error);
      throw new Error('Failed to generate business performance report');
    }
  }

  /**
   * Generate Textile Analytics Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Textile Analytics Report
   */
  async generateTextileAnalyticsReport(
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    try {
      // Fetch fabric production data to get count
      const fabricCount = await this.prisma.fabric_production.count({
        where: {
          company_id: companyId,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Generate sample data for textile analytics
      const fabricTypes = ['Cotton', 'Silk', 'Wool', 'Polyester', 'Blend', 'Linen', 'Rayon'];
      const productionByFabricType = fabricTypes.map(fabricType => {
        const productionQuantity = Math.floor(Math.random() * 5000) + 1000; // 1000-6000 meters
        const defectRate = Math.random() * 5; // 0-5%
        const wastageRate = Math.random() * 8 + 2; // 2-10%
        
        return {
          fabricType,
          productionQuantity,
          defectRate,
          wastageRate,
          efficiency: 100 - defectRate - wastageRate,
        };
      });

      // Generate production trend data
      const productionTrend = [];
      const monthCount = Math.min(12, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24 * 30)));
      
      for (let i = 0; i < Math.max(monthCount, 1); i++) {
        const currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + i);
        const month = currentDate.toISOString().substr(0, 7); // YYYY-MM
        
        const production = Math.floor(Math.random() * 10000) + 5000; // 5000-15000 meters
        const defects = production * (Math.random() * 0.05); // 0-5% defects
        const wastage = production * (Math.random() * 0.08 + 0.02); // 2-10% wastage
        
        productionTrend.push({
          month,
          production,
          defects,
          wastage,
          efficiency: (production - defects - wastage) / production * 100,
        });
      }

      // Generate quality metrics
      const qualityMetrics = {
        averageDefectRate: productionByFabricType.reduce((sum, item) => sum + item.defectRate, 0) / productionByFabricType.length,
        averageWastageRate: productionByFabricType.reduce((sum, item) => sum + item.wastageRate, 0) / productionByFabricType.length,
        firstQualityPercentage: Math.floor(Math.random() * 15) + 80, // 80-95%
        secondQualityPercentage: Math.floor(Math.random() * 10) + 3, // 3-13%
        rejectionRate: Math.floor(Math.random() * 5) + 1, // 1-6%
      };

      // Generate color performance data
      const colors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Brown'];
      const colorPerformance = colors.map(color => {
        const productionQuantity = Math.floor(Math.random() * 2000) + 500; // 500-2500 meters
        const colorConsistencyScore = Math.floor(Math.random() * 20) + 80; // 80-100
        const colorFastnessScore = Math.floor(Math.random() * 20) + 80; // 80-100
        
        return {
          color,
          productionQuantity,
          colorConsistencyScore,
          colorFastnessScore,
          overallScore: (colorConsistencyScore + colorFastnessScore) / 2,
        };
      });

      // Calculate total production
      const totalProduction = productionByFabricType.reduce((sum, item) => sum + item.productionQuantity, 0);

      return {
        summary: {
          totalProduction,
          fabricTypesProduced: fabricTypes.length,
          averageEfficiency: productionByFabricType.reduce((sum, item) => sum + item.efficiency, 0) / productionByFabricType.length,
          totalDefectRate: qualityMetrics.averageDefectRate,
          totalWastageRate: qualityMetrics.averageWastageRate,
        },
        productionByFabricType,
        productionTrend: productionTrend.sort((a, b) => a.month.localeCompare(b.month)),
        qualityMetrics,
        colorPerformance: colorPerformance.sort((a, b) => b.overallScore - a.overallScore),
        dateRange: {
          startDate,
          endDate,
        },
      };
    } catch (error) {
      logger.error('Error generating textile analytics report:', error);
      throw new Error('Failed to generate textile analytics report');
    }
  }
}

export const analyticsReportService = new AnalyticsReportService();
