import { PrismaClient as GlobalPrismaClient } from '@prisma/client';

const globalPrisma = new GlobalPrismaClient();

interface DashboardAnalytics {
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

interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
}

interface TopCustomer {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalRevenue: number;
}

class AnalyticsService {
  /**
   * Get comprehensive dashboard analytics for a company
   */
  async getDashboardAnalytics(companyId: string): Promise<DashboardAnalytics> {
    try {
      // Run all queries in parallel for better performance
      const [
        productsCount,
        ordersCount,
        teamMembersCount,
        invoicesData,
        billsData,
        purchaseOrdersData,
        inventoryData,
        inspectionsData,
        machinesData,
        customersCount,
        suppliersCount,
        textileData,
      ] = await Promise.all([
        // Products count
        globalPrisma.products.count({
          where: { company_id: companyId, is_active: true },
        }),

        // Active orders count (not DELIVERED or CANCELLED)
        globalPrisma.orders.count({
          where: {
            company_id: companyId,
            is_active: true,
            status: {
              notIn: ['DELIVERED', 'CANCELLED'],
            },
          },
        }),

        // Team members count
        globalPrisma.user_companies.count({
          where: { company_id: companyId, is_active: true },
        }),

        // Invoices data
        globalPrisma.invoices.aggregate({
          where: { company_id: companyId },
          _count: true,
          _sum: {
            total_amount: true,
            balance_due: true,
          },
        }),

        // Bills data
        globalPrisma.bills.aggregate({
          where: { company_id: companyId },
          _count: true,
          _sum: {
            total_amount: true,
            balance_due: true,
          },
        }),

        // Purchase Orders data
        globalPrisma.purchase_orders.aggregate({
          where: { company_id: companyId },
          _count: true,
          _sum: {
            total_amount: true,
          },
        }),

        // Inventory data
        globalPrisma.location_inventory.aggregate({
          where: {
            product: {
              company_id: companyId,
            },
          },
          _sum: {
            stock_quantity: true,
          },
        }),

        // Inspections data
        globalPrisma.quality_inspections.groupBy({
          by: ['status'],
          where: { company_id: companyId },
          _count: true,
        }),

        // Machines data
        globalPrisma.machines.groupBy({
          by: ['status'],
          where: { company_id: companyId, is_active: true },
          _count: true,
        }),

        // Customers count
        globalPrisma.customers.count({
          where: { company_id: companyId, is_active: true },
        }),

        // Suppliers count
        globalPrisma.suppliers.count({
          where: { company_id: companyId, is_active: true },
        }),

        // Textile operations data
        Promise.all([
          globalPrisma.fabric_production.count({
            where: { company_id: companyId, is_active: true },
          }),
          globalPrisma.yarn_manufacturing.count({
            where: { company_id: companyId, is_active: true },
          }),
          globalPrisma.dyeing_finishing.count({
            where: { company_id: companyId, is_active: true },
          }),
          globalPrisma.garment_manufacturing.count({
            where: { company_id: companyId, is_active: true },
          }),
        ]),
      ]);

      // Calculate monthly revenue (current month from invoices)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyInvoices = await globalPrisma.invoices.aggregate({
        where: {
          company_id: companyId,
          invoice_date: {
            gte: currentMonth,
          },
        },
        _sum: {
          total_amount: true,
        },
      });

      // Count overdue invoices
      const overdueInvoicesCount = await globalPrisma.invoices.count({
        where: {
          company_id: companyId,
          status: 'OVERDUE',
        },
      });

      // Count low stock and out of stock products
      const lowStockCount = await globalPrisma.location_inventory.count({
        where: {
          product: {
            company_id: companyId,
          },
          stock_quantity: {
            lte: globalPrisma.location_inventory.fields.reorder_level,
            gt: 0,
          },
        },
      });

      const outOfStockCount = await globalPrisma.location_inventory.count({
        where: {
          product: {
            company_id: companyId,
          },
          stock_quantity: 0,
        },
      });

      // Count active defects
      const activeDefectsCount = await globalPrisma.quality_defects.count({
        where: {
          company_id: companyId,
          resolution_status: {
            in: ['OPEN', 'IN_PROGRESS'],
          },
        },
      });

      // Process inspections data
      const inspectionsMap = inspectionsData.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      );

      // Process machines data
      const machinesMap = machinesData.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        // Core Stats
        totalProducts: productsCount,
        activeOrders: ordersCount,
        teamMembers: teamMembersCount,
        monthlyRevenue: Number(monthlyInvoices._sum.total_amount || 0),

        // Financial Stats
        totalInvoices: invoicesData._count,
        totalBills: billsData._count,
        totalPurchaseOrders: purchaseOrdersData._count,
        pendingPayments:
          Number(invoicesData._sum.balance_due || 0) + Number(billsData._sum.balance_due || 0),
        overdueInvoices: overdueInvoicesCount,

        // Inventory Stats
        lowStockProducts: lowStockCount,
        outOfStockProducts: outOfStockCount,
        totalInventoryValue: 0, // TODO: Calculate from products * stock * cost_price

        // Quality Stats
        totalInspections:
          inspectionsMap['PASSED'] + inspectionsMap['FAILED'] + inspectionsMap['PENDING'] || 0,
        passedInspections: inspectionsMap['PASSED'] || 0,
        failedInspections: inspectionsMap['FAILED'] || 0,
        activeDefects: activeDefectsCount,

        // Machine Stats
        totalMachines: Object.values(machinesMap).reduce((sum, count) => sum + count, 0),
        activeMachines: machinesMap['IN_USE'] || 0,
        underMaintenance: machinesMap['UNDER_MAINTENANCE'] || 0,
        activeBreakdowns: 0, // TODO: Get from breakdown_reports table

        // Customer & Supplier Stats
        totalCustomers: customersCount,
        totalSuppliers: suppliersCount,

        // Textile Operations Stats
        fabricProduction: textileData[0],
        yarnManufacturing: textileData[1],
        dyeingFinishing: textileData[2],
        garmentManufacturing: textileData[3],
      };
    } catch (error: any) {
      console.error('Error fetching dashboard analytics:', error);
      throw new Error(`Failed to fetch dashboard analytics: ${error.message}`);
    }
  }

  /**
   * Get revenue trends for the last 12 months
   */
  async getRevenueTrends(companyId: string, months: number = 12): Promise<RevenueData[]> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const invoices = await globalPrisma.invoices.findMany({
        where: {
          company_id: companyId,
          invoice_date: {
            gte: startDate,
          },
        },
        select: {
          invoice_date: true,
          total_amount: true,
        },
        orderBy: {
          invoice_date: 'asc',
        },
      });

      // Group by month
      const monthlyData: Record<string, { revenue: number; orders: number }> = {};

      invoices.forEach(invoice => {
        const monthKey = invoice.invoice_date.toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, orders: 0 };
        }
        monthlyData[monthKey].revenue += Number(invoice.total_amount);
        monthlyData[monthKey].orders += 1;
      });

      // Convert to array and format
      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        orders: data.orders,
      }));
    } catch (error: any) {
      console.error('Error fetching revenue trends:', error);
      throw new Error(`Failed to fetch revenue trends: ${error.message}`);
    }
  }

  /**
   * Get top selling products
   */
  async getTopProducts(companyId: string, limit: number = 10): Promise<TopProduct[]> {
    try {
      const topProducts = await globalPrisma.order_items.groupBy({
        by: ['product_id'],
        where: {
          orders: {
            company_id: companyId,
            status: {
              in: ['DELIVERED', 'SHIPPED'],
            },
          },
          product_id: {
            not: null,
          },
        },
        _sum: {
          quantity: true,
          line_amount: true,
        },
        orderBy: {
          _sum: {
            line_amount: 'desc',
          },
        },
        take: limit,
      });

      // Get product details
      const productIds = topProducts.map(p => p.product_id!);
      const products = await globalPrisma.products.findMany({
        where: {
          id: { in: productIds },
        },
        select: {
          id: true,
          product_id: true,
          name: true,
        },
      });

      const productsMap = products.reduce(
        (acc, p) => {
          acc[p.id] = p;
          return acc;
        },
        {} as Record<string, any>
      );

      return topProducts.map(item => ({
        productId: productsMap[item.product_id!]?.product_id || item.product_id!,
        productName: productsMap[item.product_id!]?.name || 'Unknown Product',
        totalSold: Number(item._sum.quantity || 0),
        revenue: Number(item._sum.line_amount || 0),
      }));
    } catch (error: any) {
      console.error('Error fetching top products:', error);
      throw new Error(`Failed to fetch top products: ${error.message}`);
    }
  }

  /**
   * Get top customers by revenue
   */
  async getTopCustomers(companyId: string, limit: number = 10): Promise<TopCustomer[]> {
    try {
      const topCustomers = await globalPrisma.orders.groupBy({
        by: ['customer_id'],
        where: {
          company_id: companyId,
          customer_id: {
            not: null,
          },
          status: {
            in: ['DELIVERED', 'SHIPPED'],
          },
        },
        _count: true,
        _sum: {
          total_amount: true,
        },
        orderBy: {
          _sum: {
            total_amount: 'desc',
          },
        },
        take: limit,
      });

      // Get customer details
      const customerIds = topCustomers.map(c => c.customer_id!);
      const customers = await globalPrisma.customers.findMany({
        where: {
          id: { in: customerIds },
        },
        select: {
          id: true,
          customer_id: true,
          name: true,
        },
      });

      const customersMap = customers.reduce(
        (acc, c) => {
          acc[c.id] = c;
          return acc;
        },
        {} as Record<string, any>
      );

      return topCustomers.map(item => ({
        customerId: customersMap[item.customer_id!]?.customer_id || item.customer_id!,
        customerName: customersMap[item.customer_id!]?.name || 'Unknown Customer',
        totalOrders: item._count,
        totalRevenue: Number(item._sum.total_amount || 0),
      }));
    } catch (error: any) {
      console.error('Error fetching top customers:', error);
      throw new Error(`Failed to fetch top customers: ${error.message}`);
    }
  }

  /**
   * Get quality metrics summary
   */
  async getQualityMetrics(companyId: string) {
    try {
      const [inspections, defects, complianceReports] = await Promise.all([
        globalPrisma.quality_inspections.groupBy({
          by: ['status'],
          where: { company_id: companyId },
          _count: true,
        }),
        globalPrisma.quality_defects.groupBy({
          by: ['severity', 'resolution_status'],
          where: { company_id: companyId },
          _count: true,
        }),
        // @ts-ignore
        globalPrisma.compliance_reports.groupBy({
          by: ['compliance_status'],
          where: { company_id: companyId, is_active: true },
          _count: true,
        }),
      ]);

      return {
        inspections,
        defects,
        complianceReports,
      };
    } catch (error: any) {
      console.error('Error fetching quality metrics:', error);
      throw new Error(`Failed to fetch quality metrics: ${error.message}`);
    }
  }

  /**
   * Get production summary
   */
  async getProductionSummary(companyId: string) {
    try {
      const [fabric, yarn, dyeing, garment] = await Promise.all([
        globalPrisma.fabric_production.aggregate({
          where: { company_id: companyId, is_active: true },
          _count: true,
          _sum: {
            quantity_meters: true,
          },
        }),
        globalPrisma.yarn_manufacturing.aggregate({
          where: { company_id: companyId, is_active: true },
          _count: true,
          _sum: {
            quantity_kg: true,
          },
        }),
        globalPrisma.dyeing_finishing.aggregate({
          where: { company_id: companyId, is_active: true },
          _count: true,
          _sum: {
            quantity_meters: true,
          },
        }),
        globalPrisma.garment_manufacturing.aggregate({
          where: { company_id: companyId, is_active: true },
          _count: true,
          _sum: {
            quantity: true,
          },
        }),
      ]);

      return {
        fabric: {
          totalBatches: fabric._count,
          totalQuantity: Number(fabric._sum.quantity_meters || 0),
        },
        yarn: {
          totalBatches: yarn._count,
          totalQuantity: Number(yarn._sum.quantity_kg || 0),
        },
        dyeing: {
          totalBatches: dyeing._count,
          totalQuantity: Number(dyeing._sum.quantity_meters || 0),
        },
        garment: {
          totalBatches: garment._count,
          totalQuantity: Number(garment._sum.quantity || 0),
        },
      };
    } catch (error: any) {
      console.error('Error fetching production summary:', error);
      throw new Error(`Failed to fetch production summary: ${error.message}`);
    }
  }
}

export default new AnalyticsService();
