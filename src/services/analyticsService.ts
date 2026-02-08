import { globalPrisma } from '../database/connection';
import { redisClient } from '../utils/redis';
import { logger } from '../utils/logger';

// Cache TTL: 5 minutes
const CACHE_TTL = 300;

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
      // Check cache first
      const cacheKey = `analytics:dashboard:${companyId}`;
      const cached = await redisClient.get(cacheKey).catch(() => null);

      if (cached) {
        logger.info(`Cache hit for dashboard analytics: ${companyId}`);
        return JSON.parse(cached);
      }

      logger.info(`Cache miss for dashboard analytics: ${companyId}`);
      // Run all queries in parallel for better performance
      const [
        invoicesData,
        billsData,
        purchaseOrdersData,
        inventoryData,
        inspectionsData,
        machinesData,
        textileData,
        monthlyInvoices,
      ] = await Promise.all([
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
            company_id: companyId,
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

        // Textile operations data
        Promise.all([
          globalPrisma.fabric_production
            .count({
              where: { company_id: companyId, is_active: true },
            })
            .catch(() => 0),
          globalPrisma.yarn_manufacturing
            .count({
              where: { company_id: companyId, is_active: true },
            })
            .catch(() => 0),
          globalPrisma.dyeing_finishing
            .count({
              where: { company_id: companyId, is_active: true },
            })
            .catch(() => 0),
          globalPrisma.garment_manufacturing
            .count({
              where: { company_id: companyId, is_active: true },
            })
            .catch(() => 0),
        ]),

        // Monthly revenue
        globalPrisma.invoices.aggregate({
          where: {
            company_id: companyId,
            invoice_date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          _sum: {
            total_amount: true,
          },
        }),
      ]);

      // Group simple counts into a single query to reduce round-trips
      const countsResult = await globalPrisma.$queryRaw<any[]>`
        SELECT 
          (SELECT COUNT(*)::int FROM products WHERE company_id = ${companyId} AND is_active = true) as products_count,
          (SELECT COUNT(*)::int FROM orders WHERE company_id = ${companyId} AND is_active = true AND status NOT IN ('DELIVERED', 'CANCELLED')) as orders_count,
          (SELECT COUNT(*)::int FROM user_companies WHERE company_id = ${companyId} AND is_active = true) as team_count,
          (SELECT COUNT(*)::int FROM customers WHERE company_id = ${companyId} AND is_active = true) as customers_count,
          (SELECT COUNT(*)::int FROM suppliers WHERE company_id = ${companyId} AND is_active = true) as suppliers_count,
          (SELECT COUNT(*)::int FROM invoices WHERE company_id = ${companyId} AND status = 'OVERDUE') as overdue_invoices_count,
          (SELECT COUNT(*)::int FROM location_inventory WHERE company_id = ${companyId} AND stock_quantity <= COALESCE(reorder_level, 10) AND stock_quantity > 0) as low_stock_count,
          (SELECT COUNT(*)::int FROM location_inventory WHERE company_id = ${companyId} AND stock_quantity = 0) as out_of_stock_count,
          (SELECT COUNT(*)::int FROM quality_defects WHERE company_id = ${companyId} AND resolution_status IN ('OPEN', 'IN_PROGRESS')) as active_defects_count
      `;

      const counts = countsResult[0] || {};
      const productsCount = counts.products_count;
      const ordersCount = counts.orders_count;
      const teamMembersCount = counts.team_count;
      const customersCount = counts.customers_count;
      const suppliersCount = counts.suppliers_count;
      const overdueInvoicesCount = counts.overdue_invoices_count;
      const lowStockCount = counts.low_stock_count;
      const outOfStockCount = counts.out_of_stock_count;
      const activeDefectsCount = counts.active_defects_count;

      // Calculate total inventory value
      const inventoryValueResult = await globalPrisma.$queryRaw<[{ total: string | null }]>`
        SELECT COALESCE(SUM(li.stock_quantity * COALESCE(p.cost_price, p.selling_price, 0)), 0)::text as total
        FROM location_inventory li
        JOIN products p ON li.product_id = p.id
        WHERE li.company_id = ${companyId}
      `;
      const totalInventoryValue = Number(inventoryValueResult[0]?.total || 0);

      // Get active breakdowns count
      const activeBreakdownsCount = await globalPrisma.breakdown_reports.count({
        where: {
          company_id: companyId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
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

      const result = {
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
        totalInventoryValue,

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
        activeBreakdowns: activeBreakdownsCount,

        // Customer & Supplier Stats
        totalCustomers: customersCount,
        totalSuppliers: suppliersCount,

        // Textile Operations Stats
        fabricProduction: textileData[0],
        yarnManufacturing: textileData[1],
        dyeingFinishing: textileData[2],
        garmentManufacturing: textileData[3],
      };

      // Cache the result for 5 minutes
      await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(result)).catch(err => {
        logger.error('Failed to cache dashboard analytics:', err);
      });

      return result;
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

      const trends = await globalPrisma.$queryRaw<any[]>`
        SELECT 
          TO_CHAR(invoice_date, 'YYYY-MM') as month,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(*)::integer as orders
        FROM invoices
        WHERE company_id = ${companyId} 
          AND invoice_date >= ${startDate}
          AND is_active = true
        GROUP BY TO_CHAR(invoice_date, 'YYYY-MM')
        ORDER BY month ASC
      `;

      return trends.map(item => ({
        month: item.month,
        revenue: Number(item.revenue),
        orders: item.orders,
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
          by: ['status'],
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
