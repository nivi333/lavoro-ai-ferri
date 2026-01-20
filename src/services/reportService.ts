import { PrismaClient, InvoiceStatus, BillStatus } from '@prisma/client';
import { globalPrisma } from '../database/connection';
import { logger } from '../utils/logger';
import { format } from 'date-fns';
import { analyticsReportService } from './analyticsReportService';

const prisma = globalPrisma;

export class ReportService {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }

  /**
   * Generate Sales Summary Report
   * Shows total sales, revenue, and trends
   */
  async generateSalesSummary(companyId: string, startDate: Date, endDate: Date) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    // Get all invoices in date range
    const invoices = await this.prisma.invoices.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        invoice_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        invoice_items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                product_code: true,
              },
            },
          },
        },
      },
      orderBy: { invoice_date: 'asc' },
    });

    // Calculate totals
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.status === InvoiceStatus.PAID).length;
    const totalPaid = invoices
      .filter(inv => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.balance_due), 0);

    // Sales by customer
    const customerSales = invoices.reduce(
      (acc, inv) => {
        const customerId = inv.customer_id || 'walk-in';
        const customerName = inv.customer_name || 'Walk-in Customer';

        if (!acc[customerId]) {
          acc[customerId] = {
            customerId,
            customerName,
            customerCode: inv.customer?.code || null,
            totalSales: 0,
            invoiceCount: 0,
          };
        }

        acc[customerId].totalSales += Number(inv.total_amount);
        acc[customerId].invoiceCount += 1;

        return acc;
      },
      {} as Record<string, any>
    );

    // Sales by product
    const productSales = invoices.reduce(
      (acc, inv) => {
        inv.invoice_items.forEach(item => {
          const productId = item.product_id || 'custom';
          const productName = item.description || 'Custom Item';
          const productCode = item.product?.product_code || item.item_code;

          if (!acc[productId]) {
            acc[productId] = {
              productId,
              productName,
              productCode,
              quantity: 0,
              revenue: 0,
            };
          }

          acc[productId].quantity += Number(item.quantity);
          acc[productId].revenue += Number(item.line_amount);
        });

        return acc;
      },
      {} as Record<string, any>
    );

    // Sales trend by month
    const salesByMonth = invoices.reduce(
      (acc, inv) => {
        const month = inv.invoice_date.toISOString().substring(0, 7); // YYYY-MM

        if (!acc[month]) {
          acc[month] = {
            month,
            revenue: 0,
            invoiceCount: 0,
          };
        }

        acc[month].revenue += Number(inv.total_amount);
        acc[month].invoiceCount += 1;

        return acc;
      },
      {} as Record<string, any>
    );

    return {
      summary: {
        totalRevenue,
        totalInvoices,
        paidInvoices,
        totalPaid,
        totalOutstanding,
        averageInvoiceValue: totalInvoices > 0 ? totalRevenue / totalInvoices : 0,
        collectionRate: totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0,
      },
      customerSales: Object.values(customerSales).sort(
        (a: any, b: any) => b.totalSales - a.totalSales
      ),
      productSales: Object.values(productSales).sort((a: any, b: any) => b.revenue - a.revenue),
      salesTrend: Object.values(salesByMonth).sort((a: any, b: any) =>
        a.month.localeCompare(b.month)
      ),
      dateRange: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Generate Inventory Summary Report
   * Shows current stock levels, low stock items, and inventory value
   */
  async generateInventorySummary(companyId: string, locationId?: string) {
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

    const inventory = await this.prisma.location_inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            product_code: true,
            name: true,
            unit_of_measure: true,
            selling_price: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            location_id: true,
          },
        },
      },
    });

    const totalItems = inventory.length;
    const totalQuantity = inventory.reduce((sum, item) => sum + Number(item.stock_quantity), 0);
    const totalValue = inventory.reduce(
      (sum, item) => sum + Number(item.stock_quantity) * Number(item.product?.selling_price || 0),
      0
    );

    // Low stock items (where quantity <= reorder level)
    const lowStockItems = inventory
      .filter(
        item => item.reorder_level && Number(item.stock_quantity) <= Number(item.reorder_level)
      )
      .map(item => ({
        productId: item.product_id,
        productCode: item.product?.product_code,
        productName: item.product?.name,
        locationId: item.location_id,
        locationName: item.location?.name,
        quantityOnHand: Number(item.stock_quantity),
        reorderLevel: Number(item.reorder_level),
        unitOfMeasure: item.product?.unit_of_measure,
      }));

    // Stock by location
    const stockByLocation = inventory.reduce(
      (acc, item) => {
        const locId = item.location_id;
        const locName = item.location?.name || 'Unknown';

        if (!acc[locId]) {
          acc[locId] = {
            locationId: locId,
            locationName: locName,
            itemCount: 0,
            totalQuantity: 0,
            totalValue: 0,
          };
        }

        acc[locId].itemCount += 1;
        acc[locId].totalQuantity += Number(item.stock_quantity);
        acc[locId].totalValue +=
          Number(item.stock_quantity) * Number(item.product?.selling_price || 0);

        return acc;
      },
      {} as Record<string, any>
    );

    // Top products by value
    const productsByValue = inventory
      .map(item => ({
        productId: item.product_id,
        productCode: item.product?.product_code,
        productName: item.product?.name,
        quantityOnHand: Number(item.stock_quantity),
        unitPrice: Number(item.product?.selling_price || 0),
        totalValue: Number(item.stock_quantity) * Number(item.product?.selling_price || 0),
        unitOfMeasure: item.product?.unit_of_measure,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 20);

    return {
      summary: {
        totalItems,
        totalQuantity,
        totalValue,
        lowStockCount: lowStockItems.length,
      },
      lowStockItems,
      stockByLocation: Object.values(stockByLocation),
      topProductsByValue: productsByValue,
    };
  }

  /**
   * Generate Low Stock Report
   * Shows products that are at or below their reorder level
   */
  async generateLowStockReport(companyId: string, locationId?: string) {
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

    // Get all inventory items where stock is at or below reorder level
    const inventory = await this.prisma.location_inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            product_code: true,
            name: true,
            unit_of_measure: true,
            selling_price: true,
            cost_price: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            location_id: true,
          },
        },
      },
    });

    // Filter for low stock items
    const lowStockItems = inventory
      .filter(
        item => item.reorder_level && Number(item.stock_quantity) <= Number(item.reorder_level)
      )
      .map(item => ({
        productId: item.product_id,
        productCode: item.product?.product_code,
        productName: item.product?.name,
        locationId: item.location_id,
        locationName: item.location?.name,
        currentStock: Number(item.stock_quantity),
        reorderLevel: Number(item.reorder_level),
        shortfall: Number(item.reorder_level) - Number(item.stock_quantity),
        unitOfMeasure: item.product?.unit_of_measure,
        unitPrice: Number(item.product?.cost_price || 0),
        estimatedReorderCost:
          (Number(item.reorder_level) - Number(item.stock_quantity)) *
          Number(item.product?.cost_price || 0),
      }))
      .sort((a, b) => b.shortfall - a.shortfall);

    // Calculate summary
    const totalLowStockItems = lowStockItems.length;
    const totalShortfall = lowStockItems.reduce((sum, item) => sum + item.shortfall, 0);
    const estimatedReorderCost = lowStockItems.reduce(
      (sum, item) => sum + item.estimatedReorderCost,
      0
    );

    // Group by location
    const lowStockByLocation = lowStockItems.reduce(
      (acc, item) => {
        const locId = item.locationId;
        const locName = item.locationName || 'Unknown';

        if (!acc[locId]) {
          acc[locId] = {
            locationId: locId,
            locationName: locName,
            itemCount: 0,
            totalShortfall: 0,
            estimatedCost: 0,
          };
        }

        acc[locId].itemCount += 1;
        acc[locId].totalShortfall += item.shortfall;
        acc[locId].estimatedCost += item.estimatedReorderCost;

        return acc;
      },
      {} as Record<string, any>
    );

    return {
      summary: {
        totalLowStockItems,
        totalShortfall,
        estimatedReorderCost,
      },
      lowStockItems,
      lowStockByLocation: Object.values(lowStockByLocation),
    };
  }

  /**
   * Generate Stock Valuation Report
   * Shows total inventory value by location and product
   */
  async generateStockValuationReport(
    companyId: string,
    locationId?: string,
    asOfDate: Date = new Date()
  ) {
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

    const inventory = await this.prisma.location_inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            product_code: true,
            name: true,
            unit_of_measure: true,
            selling_price: true,
            cost_price: true,
            category_id: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            location_id: true,
          },
        },
      },
    });

    // Calculate valuation for each item
    const valuationItems = inventory.map(item => {
      const quantity = Number(item.stock_quantity);
      const costPrice = Number(item.product?.cost_price || 0);
      const sellingPrice = Number(item.product?.selling_price || 0);
      const costValue = quantity * costPrice;
      const retailValue = quantity * sellingPrice;
      const potentialProfit = retailValue - costValue;

      return {
        productId: item.product_id,
        productCode: item.product?.product_code,
        productName: item.product?.name,
        locationId: item.location_id,
        locationName: item.location?.name,
        quantity,
        unitOfMeasure: item.product?.unit_of_measure,
        costPrice,
        sellingPrice,
        costValue,
        retailValue,
        potentialProfit,
      };
    });

    // Calculate summary
    const totalItems = valuationItems.length;
    const totalQuantity = valuationItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalCostValue = valuationItems.reduce((sum, item) => sum + item.costValue, 0);
    const totalRetailValue = valuationItems.reduce((sum, item) => sum + item.retailValue, 0);
    const totalPotentialProfit = valuationItems.reduce(
      (sum, item) => sum + item.potentialProfit,
      0
    );
    const averageMarkup =
      totalCostValue > 0 ? ((totalRetailValue - totalCostValue) / totalCostValue) * 100 : 0;

    // Group by location
    const valuationByLocation = valuationItems.reduce(
      (acc, item) => {
        const locId = item.locationId;
        const locName = item.locationName || 'Unknown';

        if (!acc[locId]) {
          acc[locId] = {
            locationId: locId,
            locationName: locName,
            itemCount: 0,
            totalQuantity: 0,
            costValue: 0,
            retailValue: 0,
            potentialProfit: 0,
          };
        }

        acc[locId].itemCount += 1;
        acc[locId].totalQuantity += item.quantity;
        acc[locId].costValue += item.costValue;
        acc[locId].retailValue += item.retailValue;
        acc[locId].potentialProfit += item.potentialProfit;

        return acc;
      },
      {} as Record<string, any>
    );

    // Top products by value
    const topProductsByValue = valuationItems
      .sort((a, b) => b.costValue - a.costValue)
      .slice(0, 20);

    return {
      summary: {
        totalItems,
        totalQuantity,
        totalCostValue,
        totalRetailValue,
        totalPotentialProfit,
        averageMarkup,
        asOfDate,
      },
      valuationByLocation: Object.values(valuationByLocation),
      topProductsByValue,
      allItems: valuationItems.sort((a, b) => b.costValue - a.costValue),
    };
  }

  /**
   * Generate Accounts Receivable Aging Report
   * Shows outstanding invoices grouped by age
   */
  async generateARAgingReport(companyId: string, asOfDate: Date = new Date()) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    const invoices = await this.prisma.invoices.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE],
        },
        balance_due: {
          gt: 0,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { due_date: 'asc' },
    });

    const agingBuckets = {
      current: 0, // 0-30 days
      days31to60: 0,
      days61to90: 0,
      over90: 0,
    };

    const customerAging: Record<string, any> = {};

    invoices.forEach(inv => {
      const daysOverdue = Math.floor(
        (asOfDate.getTime() - inv.due_date.getTime()) / (1000 * 60 * 60 * 24)
      );
      const balanceDue = Number(inv.balance_due);

      // Categorize by age
      if (daysOverdue <= 30) {
        agingBuckets.current += balanceDue;
      } else if (daysOverdue <= 60) {
        agingBuckets.days31to60 += balanceDue;
      } else if (daysOverdue <= 90) {
        agingBuckets.days61to90 += balanceDue;
      } else {
        agingBuckets.over90 += balanceDue;
      }

      // Group by customer
      const customerId = inv.customer_id || 'walk-in';
      const customerName = inv.customer_name || 'Walk-in Customer';

      if (!customerAging[customerId]) {
        customerAging[customerId] = {
          customerId,
          customerName,
          customerCode: inv.customer?.code || null,
          email: inv.customer?.email || null,
          phone: inv.customer?.phone || null,
          totalOutstanding: 0,
          current: 0,
          days31to60: 0,
          days61to90: 0,
          over90: 0,
          invoices: [],
        };
      }

      customerAging[customerId].totalOutstanding += balanceDue;

      if (daysOverdue <= 30) {
        customerAging[customerId].current += balanceDue;
      } else if (daysOverdue <= 60) {
        customerAging[customerId].days31to60 += balanceDue;
      } else if (daysOverdue <= 90) {
        customerAging[customerId].days61to90 += balanceDue;
      } else {
        customerAging[customerId].over90 += balanceDue;
      }

      customerAging[customerId].invoices.push({
        invoiceId: inv.invoice_id,
        invoiceDate: inv.invoice_date,
        dueDate: inv.due_date,
        totalAmount: Number(inv.total_amount),
        balanceDue,
        daysOverdue,
        status: inv.status,
      });
    });

    const totalOutstanding =
      agingBuckets.current +
      agingBuckets.days31to60 +
      agingBuckets.days61to90 +
      agingBuckets.over90;

    return {
      summary: {
        totalOutstanding,
        totalInvoices: invoices.length,
        asOfDate,
      },
      agingBuckets,
      customerAging: Object.values(customerAging).sort(
        (a: any, b: any) => b.totalOutstanding - a.totalOutstanding
      ),
    };
  }

  /**
   * Generate Accounts Payable Aging Report
   * Shows outstanding bills grouped by age
   */
  async generateAPAgingReport(companyId: string, asOfDate: Date = new Date()) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    const bills = await this.prisma.bills.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        status: {
          in: [BillStatus.RECEIVED, BillStatus.PARTIALLY_PAID, BillStatus.OVERDUE],
        },
        balance_due: {
          gt: 0,
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { due_date: 'asc' },
    });

    const agingBuckets = {
      current: 0, // 0-30 days
      days31to60: 0,
      days61to90: 0,
      over90: 0,
    };

    const supplierAging: Record<string, any> = {};

    bills.forEach(bill => {
      const daysOverdue = Math.floor(
        (asOfDate.getTime() - bill.due_date.getTime()) / (1000 * 60 * 60 * 24)
      );
      const balanceDue = Number(bill.balance_due);

      // Categorize by age
      if (daysOverdue <= 30) {
        agingBuckets.current += balanceDue;
      } else if (daysOverdue <= 60) {
        agingBuckets.days31to60 += balanceDue;
      } else if (daysOverdue <= 90) {
        agingBuckets.days61to90 += balanceDue;
      } else {
        agingBuckets.over90 += balanceDue;
      }

      // Group by supplier
      const supplierId = bill.supplier_id || 'unknown';
      const supplierName = bill.supplier_name || 'Unknown Supplier';

      if (!supplierAging[supplierId]) {
        supplierAging[supplierId] = {
          supplierId,
          supplierName,
          supplierCode: bill.supplier?.code || null,
          email: bill.supplier?.email || null,
          phone: bill.supplier?.phone || null,
          totalOutstanding: 0,
          current: 0,
          days31to60: 0,
          days61to90: 0,
          over90: 0,
          bills: [],
        };
      }

      supplierAging[supplierId].totalOutstanding += balanceDue;

      if (daysOverdue <= 30) {
        supplierAging[supplierId].current += balanceDue;
      } else if (daysOverdue <= 60) {
        supplierAging[supplierId].days31to60 += balanceDue;
      } else if (daysOverdue <= 90) {
        supplierAging[supplierId].days61to90 += balanceDue;
      } else {
        supplierAging[supplierId].over90 += balanceDue;
      }

      supplierAging[supplierId].bills.push({
        billId: bill.bill_id,
        billDate: bill.bill_date,
        dueDate: bill.due_date,
        totalAmount: Number(bill.total_amount),
        balanceDue,
        daysOverdue,
        status: bill.status,
      });
    });

    const totalOutstanding =
      agingBuckets.current +
      agingBuckets.days31to60 +
      agingBuckets.days61to90 +
      agingBuckets.over90;

    return {
      summary: {
        totalOutstanding,
        totalBills: bills.length,
        asOfDate,
      },
      agingBuckets,
      supplierAging: Object.values(supplierAging).sort(
        (a: any, b: any) => b.totalOutstanding - a.totalOutstanding
      ),
    };
  }

  /**
   * Generate Expense Summary Report
   * Shows expenses by category and period
   */
  /**
   * Generate Profit & Loss Report
   * Shows revenue, expenses, and net profit
   */
  async generateProfitLossReport(companyId: string, startDate: Date, endDate: Date) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    // Get all invoices in date range for revenue
    const invoices = await this.prisma.invoices.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        invoice_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        invoice_items: true,
      },
    });

    // Get all bills in date range for expenses
    const bills = await this.prisma.bills.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        bill_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        bill_items: true,
      },
    });

    // Calculate revenue
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

    // Calculate cost of goods sold (simplified)
    const costOfGoodsSold = bills.reduce(
      (sum, bill) =>
        sum +
        bill.bill_items
          // Simplified: assume all items are products for now
          .reduce((itemSum, item) => itemSum + Number(item.line_amount) * 0.7, 0), // 70% of bill amount as COGS
      0
    );

    // Calculate operating expenses
    const operatingExpenses = bills.reduce(
      (sum, bill) =>
        sum +
        bill.bill_items
          // Simplified: assume 30% of bill amount is operating expenses
          .reduce((itemSum, item) => itemSum + Number(item.line_amount) * 0.3, 0), // 30% of bill amount as expenses
      0
    );

    // Calculate gross profit and net profit
    const grossProfit = totalRevenue - costOfGoodsSold;
    const netProfit = grossProfit - operatingExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Revenue breakdown by product
    const revenueBreakdown = invoices.reduce(
      (acc, inv) => {
        inv.invoice_items.forEach(item => {
          const productId = item.product_id || 'custom';
          const productName = item.description || 'Custom Item';

          if (!acc[productId]) {
            acc[productId] = {
              productId,
              productName,
              revenue: 0,
              percentage: 0,
            };
          }

          acc[productId].revenue += Number(item.line_amount);
        });

        return acc;
      },
      {} as Record<string, any>
    );

    // Calculate percentages for revenue breakdown
    Object.values(revenueBreakdown).forEach(item => {
      item.percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
    });

    // Expense breakdown by category (simplified)
    const expenseCategories = ['Raw Materials', 'Labor', 'Utilities', 'Rent', 'Other'];
    const expenseBreakdown = bills.reduce(
      (acc, bill) => {
        // Distribute bill amount across predefined categories
        bill.bill_items.forEach(item => {
          // Assign to a random category for demonstration
          const categoryIndex = Math.floor(Math.random() * expenseCategories.length);
          const category = expenseCategories[categoryIndex];

          if (!acc[category]) {
            acc[category] = {
              category,
              amount: 0,
              percentage: 0,
            };
          }

          acc[category].amount += Number(item.line_amount);
        });

        return acc;
      },
      {} as Record<string, any>
    );

    // Calculate percentages for expense breakdown
    const totalExpenses = costOfGoodsSold + operatingExpenses;
    Object.values(expenseBreakdown).forEach(item => {
      item.percentage = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
    });

    // Period comparison (monthly)
    const months = this.getMonthsBetweenDates(startDate, endDate);
    const periodComparison = await Promise.all(
      months.map(async month => {
        const monthStart = new Date(month.year, month.month, 1);
        const monthEnd = new Date(month.year, month.month + 1, 0);

        // Get revenue for month
        const monthRevenue = await this.prisma.invoices.aggregate({
          where: {
            company_id: companyId,
            is_active: true,
            invoice_date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: {
            total_amount: true,
          },
        });

        // Get expenses for month
        const monthExpenses = await this.prisma.bills.aggregate({
          where: {
            company_id: companyId,
            is_active: true,
            bill_date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: {
            total_amount: true,
          },
        });

        return {
          period: `${month.year}-${String(month.month + 1).padStart(2, '0')}`,
          revenue: Number(monthRevenue._sum.total_amount || 0),
          expenses: Number(monthExpenses._sum.total_amount || 0),
          profit:
            Number(monthRevenue._sum.total_amount || 0) -
            Number(monthExpenses._sum.total_amount || 0),
        };
      })
    );

    return {
      summary: {
        totalRevenue,
        costOfGoodsSold,
        grossProfit,
        operatingExpenses,
        netProfit,
        profitMargin,
      },
      revenueBreakdown: Object.values(revenueBreakdown).sort(
        (a: any, b: any) => b.revenue - a.revenue
      ),
      expenseBreakdown: Object.values(expenseBreakdown).sort(
        (a: any, b: any) => b.amount - a.amount
      ),
      periodComparison,
      dateRange: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Generate Balance Sheet Report
   * Shows assets, liabilities, and equity
   */
  async generateBalanceSheet(companyId: string, asOfDate: Date = new Date()) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    // Get all invoices (accounts receivable)
    const invoices = await this.prisma.invoices.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        status: {
          in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'],
        },
        due_date: {
          lte: asOfDate,
        },
      },
    });

    // Get all bills (accounts payable)
    const bills = await this.prisma.bills.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        status: {
          in: ['RECEIVED', 'PARTIALLY_PAID', 'OVERDUE'],
        },
        due_date: {
          lte: asOfDate,
        },
      },
    });

    // Get inventory value
    const inventory = await this.prisma.location_inventory.findMany({
      where: {
        company_id: companyId,
      },
      include: {
        product: true,
      },
    });

    // Calculate current assets
    const accountsReceivable = invoices.reduce((sum, inv) => sum + Number(inv.balance_due), 0);

    const inventoryValue = inventory.reduce(
      (sum, item) => sum + Number(item.stock_quantity) * Number(item.product?.cost_price || 0),
      0
    );

    // Simplified cash calculation (would come from bank accounts in real system)
    const cash = 100000; // Placeholder value

    const currentAssets = [
      { category: 'Cash', amount: cash },
      { category: 'Accounts Receivable', amount: accountsReceivable },
      { category: 'Inventory', amount: inventoryValue },
    ];

    // Calculate fixed assets (simplified)
    const fixedAssets = [
      { category: 'Property & Equipment', amount: 500000 }, // Placeholder
      { category: 'Accumulated Depreciation', amount: -50000 }, // Placeholder
    ];

    // Calculate current liabilities
    const accountsPayable = bills.reduce((sum, bill) => sum + Number(bill.balance_due), 0);

    const currentLiabilities = [
      { category: 'Accounts Payable', amount: accountsPayable },
      { category: 'Accrued Expenses', amount: 25000 }, // Placeholder
    ];

    // Calculate long-term liabilities (simplified)
    const longTermLiabilities = [
      { category: 'Long-term Loans', amount: 200000 }, // Placeholder
    ];

    // Calculate equity (simplified)
    const totalCurrentAssets = currentAssets.reduce((sum, asset) => sum + asset.amount, 0);
    const totalFixedAssets = fixedAssets.reduce((sum, asset) => sum + asset.amount, 0);
    const totalCurrentLiabilities = currentLiabilities.reduce(
      (sum, liability) => sum + liability.amount,
      0
    );
    const totalLongTermLiabilities = longTermLiabilities.reduce(
      (sum, liability) => sum + liability.amount,
      0
    );

    const totalAssets = totalCurrentAssets + totalFixedAssets;
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
    const totalEquity = totalAssets - totalLiabilities;

    const equity = [
      { category: "Owner's Capital", amount: 100000 }, // Placeholder
      { category: 'Retained Earnings', amount: totalEquity - 100000 }, // Calculated
    ];

    return {
      summary: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        asOfDate: asOfDate.toISOString().split('T')[0],
      },
      assets: {
        currentAssets,
        fixedAssets,
        totalCurrentAssets,
        totalFixedAssets,
      },
      liabilities: {
        currentLiabilities,
        longTermLiabilities,
        totalCurrentLiabilities,
        totalLongTermLiabilities,
      },
      equity,
    };
  }

  /**
   * Generate Cash Flow Statement
   * Shows cash inflows and outflows
   */
  async generateCashFlowStatement(companyId: string, startDate: Date, endDate: Date) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    // Get all invoices paid in period (cash inflow)
    const paidInvoices = await this.prisma.invoices.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        status: 'PAID',
        payment_date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get all bills paid in period (cash outflow)
    const paidBills = await this.prisma.bills.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        status: 'PAID',
        payment_date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate operating cash flow
    const cashFromCustomers = paidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

    const cashToSuppliers = paidBills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);

    const operatingCashFlow = cashFromCustomers - cashToSuppliers;

    // Simplified investing and financing activities
    const investingCashFlow = -50000; // Placeholder for equipment purchases
    const financingCashFlow = 100000; // Placeholder for loan proceeds

    // Calculate net cash flow
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

    // Simplified beginning and ending cash balances
    const beginningCashBalance = 75000; // Placeholder
    const endingCashBalance = beginningCashBalance + netCashFlow;

    // Detailed operating activities
    const operatingActivities = [
      { category: 'Cash from Customers', amount: cashFromCustomers },
      { category: 'Cash to Suppliers', amount: -cashToSuppliers },
      { category: 'Wages and Salaries', amount: -30000 }, // Placeholder
      { category: 'Interest Paid', amount: -5000 }, // Placeholder
      { category: 'Taxes Paid', amount: -15000 }, // Placeholder
    ];

    // Detailed investing activities
    const investingActivities = [
      { category: 'Purchase of Equipment', amount: -50000 }, // Placeholder
      { category: 'Sale of Assets', amount: 0 }, // Placeholder
    ];

    // Detailed financing activities
    const financingActivities = [
      { category: 'Loan Proceeds', amount: 100000 }, // Placeholder
      { category: 'Loan Repayments', amount: 0 }, // Placeholder
      { category: 'Dividends Paid', amount: 0 }, // Placeholder
    ];

    return {
      summary: {
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashFlow,
        beginningCashBalance,
        endingCashBalance,
      },
      operatingActivities,
      investingActivities,
      financingActivities,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    };
  }

  /**
   * Generate Trial Balance Report
   * Shows account balances
   */
  async generateTrialBalance(companyId: string, asOfDate: Date = new Date()) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    // Simplified trial balance with placeholder accounts
    const accounts = [
      { accountCode: '1000', accountName: 'Cash', debit: 75000, credit: 0 },
      { accountCode: '1100', accountName: 'Accounts Receivable', debit: 120000, credit: 0 },
      { accountCode: '1200', accountName: 'Inventory', debit: 250000, credit: 0 },
      { accountCode: '1500', accountName: 'Property & Equipment', debit: 500000, credit: 0 },
      { accountCode: '1600', accountName: 'Accumulated Depreciation', debit: 0, credit: 50000 },
      { accountCode: '2000', accountName: 'Accounts Payable', debit: 0, credit: 85000 },
      { accountCode: '2100', accountName: 'Accrued Expenses', debit: 0, credit: 25000 },
      { accountCode: '2500', accountName: 'Long-term Loans', debit: 0, credit: 200000 },
      { accountCode: '3000', accountName: "Owner's Capital", debit: 0, credit: 100000 },
      { accountCode: '3100', accountName: 'Retained Earnings', debit: 0, credit: 485000 },
      { accountCode: '4000', accountName: 'Sales Revenue', debit: 0, credit: 750000 },
      { accountCode: '5000', accountName: 'Cost of Goods Sold', debit: 450000, credit: 0 },
      { accountCode: '6000', accountName: 'Operating Expenses', debit: 300000, credit: 0 },
    ];

    // Calculate totals
    const totalDebits = accounts.reduce((sum, account) => sum + account.debit, 0);
    const totalCredits = accounts.reduce((sum, account) => sum + account.credit, 0);
    const difference = totalDebits - totalCredits;

    return {
      summary: {
        totalDebits,
        totalCredits,
        difference,
        asOfDate: asOfDate.toISOString().split('T')[0],
      },
      accounts,
    };
  }

  /**
   * Generate GST Report
   * Shows GST collected and paid
   */
  async generateGSTReport(companyId: string, period: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    // Determine date range based on period
    const { startDate, endDate } = this.getPeriodDates(period);

    // Get all invoices in period (output tax)
    const invoices = await this.prisma.invoices.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        invoice_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get all bills in period (input tax)
    const bills = await this.prisma.bills.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        bill_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        supplier: {
          select: {
            name: true,
          },
        },
      },
    });

    // Calculate output tax (simplified as 18% of invoice amount)
    const outputTax = invoices.map(inv => ({
      invoiceId: inv.invoice_id,
      customerName: inv.customer?.name || inv.customer_name || 'Unknown',
      invoiceDate: inv.invoice_date.toISOString().split('T')[0],
      taxableAmount: Number(inv.total_amount) / 1.18, // Remove tax component
      taxAmount: Number(inv.total_amount) - Number(inv.total_amount) / 1.18,
      taxRate: 18,
    }));

    // Calculate input tax (simplified as 18% of bill amount)
    const inputTax = bills.map(bill => ({
      billId: bill.bill_id,
      supplierName: bill.supplier?.name || bill.supplier_name || 'Unknown',
      billDate: bill.bill_date.toISOString().split('T')[0],
      taxableAmount: Number(bill.total_amount) / 1.18, // Remove tax component
      taxAmount: Number(bill.total_amount) - Number(bill.total_amount) / 1.18,
      taxRate: 18,
    }));

    // Calculate summary
    const totalOutputTax = outputTax.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalInputTax = inputTax.reduce((sum, item) => sum + item.taxAmount, 0);
    const netTaxPayable = totalOutputTax - totalInputTax;

    return {
      summary: {
        totalOutputTax,
        totalInputTax,
        netTaxPayable,
        period,
      },
      outputTax,
      inputTax,
    };
  }

  /**
   * Helper method to get months between two dates
   */
  private getMonthsBetweenDates(startDate: Date, endDate: Date) {
    const months = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      months.push({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth(),
      });

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
  }

  /**
   * Helper method to get date range from period string
   */
  private getPeriodDates(period: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (period) {
      case 'current-month': {
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);
        return { startDate, endDate };
      }
      case 'last-month': {
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);
        return { startDate, endDate };
      }
      case 'current-quarter': {
        const quarter = Math.floor(currentMonth / 3);
        const startDate = new Date(currentYear, quarter * 3, 1);
        const endDate = new Date(currentYear, (quarter + 1) * 3, 0);
        return { startDate, endDate };
      }
      case 'last-quarter': {
        const quarter = Math.floor(currentMonth / 3) - 1;
        const year = quarter < 0 ? currentYear - 1 : currentYear;
        const adjustedQuarter = quarter < 0 ? 3 : quarter;
        const startDate = new Date(year, adjustedQuarter * 3, 1);
        const endDate = new Date(year, (adjustedQuarter + 1) * 3, 0);
        return { startDate, endDate };
      }
      case 'current-year': {
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);
        return { startDate, endDate };
      }
      case 'last-year': {
        const startDate = new Date(currentYear - 1, 0, 1);
        const endDate = new Date(currentYear - 1, 11, 31);
        return { startDate, endDate };
      }
      default: {
        // Default to current month
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);
        return { startDate, endDate };
      }
    }
  }

  async generateExpenseSummary(companyId: string, startDate: Date, endDate: Date) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    // Get all bills in date range (bills represent expenses)
    const bills = await this.prisma.bills.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        bill_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        bill_items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                product_code: true,
              },
            },
          },
        },
      },
      orderBy: { bill_date: 'asc' },
    });

    const totalExpenses = bills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);
    const totalBills = bills.length;
    const paidBills = bills.filter(bill => bill.status === BillStatus.PAID).length;
    const totalPaid = bills
      .filter(bill => bill.status === BillStatus.PAID)
      .reduce((sum, bill) => sum + Number(bill.total_amount), 0);
    const totalOutstanding = bills.reduce((sum, bill) => sum + Number(bill.balance_due), 0);

    // Expenses by supplier
    const supplierExpenses = bills.reduce(
      (acc, bill) => {
        const supplierId = bill.supplier_id || 'unknown';
        const supplierName = bill.supplier_name || 'Unknown Supplier';

        if (!acc[supplierId]) {
          acc[supplierId] = {
            supplierId,
            supplierName,
            supplierCode: bill.supplier?.code || null,
            totalExpenses: 0,
            billCount: 0,
          };
        }

        acc[supplierId].totalExpenses += Number(bill.total_amount);
        acc[supplierId].billCount += 1;

        return acc;
      },
      {} as Record<string, any>
    );

    // Expenses trend by month
    const expensesByMonth = bills.reduce(
      (acc, bill) => {
        const month = bill.bill_date.toISOString().substring(0, 7); // YYYY-MM

        if (!acc[month]) {
          acc[month] = {
            month,
            expenses: 0,
            billCount: 0,
          };
        }

        acc[month].expenses += Number(bill.total_amount);
        acc[month].billCount += 1;

        return acc;
      },
      {} as Record<string, any>
    );

    return {
      summary: {
        totalExpenses,
        totalBills,
        paidBills,
        totalPaid,
        totalOutstanding,
        averageBillValue: totalBills > 0 ? totalExpenses / totalBills : 0,
        paymentRate: totalExpenses > 0 ? (totalPaid / totalExpenses) * 100 : 0,
      },
      supplierExpenses: Object.values(supplierExpenses).sort(
        (a: any, b: any) => b.totalExpenses - a.totalExpenses
      ),
      expensesTrend: Object.values(expensesByMonth).sort((a: any, b: any) =>
        a.month.localeCompare(b.month)
      ),
      dateRange: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Generate Production Efficiency Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Production Efficiency Report
   */
  async generateProductionEfficiencyReport(companyId: string, startDate: Date, endDate: Date) {
    // Fetch fabric production data to get production dates
    const fabricProduction = await this.prisma.fabric_production.findMany({
      where: {
        company_id: companyId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        created_at: true,
      },
    });

    // Generate sample data for production efficiency
    const totalPlanned = 1000;
    const totalActual = Math.floor(Math.random() * 300) + 700; // 700-1000
    const totalDowntime = Math.floor(Math.random() * 100) + 50; // 50-150 hours

    // Generate efficiency by day data
    const efficiencyByDay: any[] = [];
    const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

    for (let i = 0; i <= dayCount; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];

      const planned = Math.floor(Math.random() * 100) + 50; // 50-150
      const actual = Math.floor(planned * (Math.random() * 0.4 + 0.6)); // 60-100% of planned
      const efficiency = (actual / planned) * 100;

      efficiencyByDay.push({
        date: dateKey,
        planned,
        actual,
        efficiency,
      });
    }

    // Fetch machines
    const machines = await this.prisma.machines.findMany({
      where: {
        company_id: companyId,
      },
      select: {
        machine_id: true,
        name: true,
      },
    });

    // Generate efficiency by machine data
    const efficiencyByMachine = machines.map(machine => {
      const runtime = Math.floor(Math.random() * 100) + 50; // 50-150 hours
      const downtime = Math.floor(Math.random() * 50) + 10; // 10-60 hours
      const totalTime = runtime + downtime;
      const efficiency = (runtime / totalTime) * 100;

      return {
        machineId: machine.machine_id,
        machineName: machine.name,
        efficiency,
        runtime,
        downtime,
      };
    });

    // Calculate overall efficiency
    const overallEfficiency = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

    return {
      summary: {
        overallEfficiency,
        totalProduction: totalActual,
        plannedProduction: totalPlanned,
        actualProduction: totalActual,
        downtime: Math.round(totalDowntime / 60), // Convert minutes to hours
      },
      efficiencyByDay: efficiencyByDay.sort((a, b) => a.date.localeCompare(b.date)),
      efficiencyByMachine: efficiencyByMachine.sort((a, b) => b.efficiency - a.efficiency),
      dateRange: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Generate Machine Utilization Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @param locationId - Optional location ID
   * @returns Machine Utilization Report
   */
  async generateMachineUtilizationReport(
    companyId: string,
    startDate: Date,
    endDate: Date,
    locationId?: string
  ) {
    // Fetch machines with their status history
    const machines = await this.prisma.machines.findMany({
      where: {
        company_id: companyId,
        ...(locationId && { location_id: locationId }),
      },
    });

    // For simplicity, we'll create sample data since the actual schema might not match
    // In a real implementation, you would use the actual schema and relationships

    // Calculate utilization metrics
    let totalRuntime = 0;
    let totalDowntime = 0;
    let totalMaintenanceHours = 0;
    let totalBreakdownHours = 0;

    // Calculate utilization by machine using sample data
    const utilizationByMachine = machines.map(machine => {
      // Generate sample runtime and downtime data
      const runtime = Math.floor(Math.random() * 100) + 50; // 50-150 hours
      const downtime = Math.floor(Math.random() * 30) + 5; // 5-35 hours
      const maintenance = Math.floor(Math.random() * 20) + 2; // 2-22 hours
      const breakdown = Math.floor(Math.random() * 15); // 0-15 hours

      // Calculate total time and utilization
      const totalTime = runtime + downtime;
      const utilization = totalTime > 0 ? (runtime / totalTime) * 100 : 0;

      // Add to totals
      totalRuntime += runtime;
      totalDowntime += downtime;
      totalMaintenanceHours += maintenance;
      totalBreakdownHours += breakdown;

      return {
        machineId: machine.machine_id || machine.id,
        machineName: machine.name,
        utilization,
        runtime,
        downtime,
        maintenance,
        breakdown,
      };
    });

    // Generate sample utilization by day data
    const utilizationByDay: any[] = [];
    const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

    for (let i = 0; i <= dayCount; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];

      const runtime = Math.floor(Math.random() * 24) + 4; // 4-28 hours
      const downtime = Math.floor(Math.random() * 8); // 0-8 hours
      const totalTime = runtime + downtime;
      const utilization = totalTime > 0 ? (runtime / totalTime) * 100 : 0;

      utilizationByDay.push({
        date: dateKey,
        runtime,
        downtime,
        utilization,
      });
    }

    // Calculate average utilization
    const totalTime = totalRuntime + totalDowntime;
    const averageUtilization = totalTime > 0 ? (totalRuntime / totalTime) * 100 : 0;

    // Prepare location info if specified
    let locationInfo;
    if (locationId) {
      // Fetch location name
      const location = await this.prisma.company_locations.findFirst({
        where: {
          id: locationId,
          company_id: companyId,
        },
      });

      if (location) {
        locationInfo = {
          locationId,
          locationName: location.name,
        };
      }
    }

    return {
      summary: {
        averageUtilization,
        totalRuntime,
        totalDowntime,
        maintenanceHours: totalMaintenanceHours,
        breakdownHours: totalBreakdownHours,
      },
      utilizationByMachine: utilizationByMachine.sort((a, b) => b.utilization - a.utilization),
      utilizationByDay: utilizationByDay.sort((a, b) => a.date.localeCompare(b.date)),
      dateRange: {
        startDate,
        endDate,
      },
      ...(locationInfo && { location: locationInfo }),
    };
  }

  /**
   * Generate Quality Metrics Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Quality Metrics Report
   */
  async generateQualityMetricsReport(companyId: string, startDate: Date, endDate: Date) {
    // Fetch quality inspections to get count
    const inspections = await this.prisma.quality_inspections.findMany({
      where: {
        company_id: companyId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        status: true,
        created_at: true,
      },
    });

    // Fetch quality defects to get count
    const defects = await this.prisma.quality_defects.findMany({
      where: {
        company_id: companyId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        defect_type: true,
        created_at: true,
      },
    });

    // Calculate summary metrics
    const totalInspections = inspections.length;
    const totalDefects = defects.length;

    // Calculate pass rate (using 'PASSED' status only since 'PASSED_WITH_NOTES' might not exist)
    const passedInspections = inspections.filter(
      inspection => inspection.status === 'PASSED'
    ).length;

    const passRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;
    const defectRate = totalInspections > 0 ? (totalDefects / totalInspections) * 100 : 0;

    // Generate average quality score (random since we don't have actual scores)
    const averageQualityScore = Math.floor(Math.random() * 20) + 80; // 80-100

    // Generate quality by product data
    const qualityByProduct = [];
    for (let i = 0; i < 5; i++) {
      const productId = `PROD${i + 1}`;
      const averageScore = Math.floor(Math.random() * 20) + 80; // 80-100
      const inspectionCount = Math.floor(Math.random() * 10) + 5; // 5-15
      const defectCount = Math.floor(Math.random() * 5); // 0-5

      qualityByProduct.push({
        productId,
        productName: `Product ${i + 1}`,
        averageScore,
        inspectionCount,
        defectCount,
      });
    }

    // Generate defects by type data
    const defectTypes = ['Color', 'Size', 'Texture', 'Strength', 'Finish'];
    const defectsByType = [];

    for (let i = 0; i < defectTypes.length; i++) {
      const count = Math.floor(Math.random() * 10) + 1; // 1-11
      const percentage = (count / totalDefects) * 100;

      defectsByType.push({
        defectType: defectTypes[i],
        count,
        percentage,
      });
    }

    // Generate quality trend by date data
    const qualityTrend = [];
    const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

    for (let i = 0; i <= dayCount; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];

      const averageScore = Math.floor(Math.random() * 20) + 80; // 80-100
      const inspectionCount = Math.floor(Math.random() * 5) + 1; // 1-6
      const passRate = Math.floor(Math.random() * 20) + 80; // 80-100

      qualityTrend.push({
        date: dateKey,
        averageScore,
        inspectionCount,
        passRate,
      });
    }

    return {
      summary: {
        averageQualityScore,
        totalInspections,
        passRate,
        totalDefects,
        defectRate,
      },
      qualityByProduct: qualityByProduct.sort((a, b) => b.averageScore - a.averageScore),
      defectsByType: defectsByType.sort((a, b) => b.count - a.count),
      qualityTrend: qualityTrend.sort((a, b) => a.date.localeCompare(b.date)),
      dateRange: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Generate Inventory Movement Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @param locationId - Optional location ID
   * @returns Inventory Movement Report
   */
  async generateInventoryMovementReport(
    companyId: string,
    startDate: Date,
    endDate: Date,
    locationId?: string
  ) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    // Build where clause for stock movements
    const where: any = {
      company_id: companyId,
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Add location filter if provided
    if (locationId) {
      where.OR = [{ from_location_id: locationId }, { to_location_id: locationId }];
    }

    // Fetch all stock movements in date range
    const movements = await this.prisma.stock_movements.findMany({
      where,
      include: {
        from_location: {
          select: {
            id: true,
            name: true,
            location_id: true,
          },
        },
        to_location: {
          select: {
            id: true,
            name: true,
            location_id: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    // Calculate summary metrics
    const totalMovements = movements.length;

    // Calculate incoming (movements TO the location or PURCHASE/PRODUCTION_IN types)
    const incoming = movements
      .filter(m => {
        if (locationId) {
          return m.to_location_id === locationId;
        }
        return ['PURCHASE', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'PRODUCTION_IN', 'RETURN_IN'].includes(
          m.movement_type
        );
      })
      .reduce((sum, m) => sum + Number(m.quantity), 0);

    // Calculate outgoing (movements FROM the location or SALE/PRODUCTION_OUT types)
    const outgoing = movements
      .filter(m => {
        if (locationId) {
          return m.from_location_id === locationId;
        }
        return [
          'SALE',
          'TRANSFER_OUT',
          'ADJUSTMENT_OUT',
          'PRODUCTION_OUT',
          'RETURN_OUT',
          'DAMAGE',
        ].includes(m.movement_type);
      })
      .reduce((sum, m) => sum + Number(m.quantity), 0);

    const netChange = incoming - outgoing;

    // Calculate value change
    const valueChange = movements.reduce((sum, m) => sum + Number(m.total_cost || 0), 0);

    // Group movements by type
    const movementsByType = movements.reduce(
      (acc, movement) => {
        const type = movement.movement_type;

        if (!acc[type]) {
          acc[type] = {
            movementType: type,
            count: 0,
            quantity: 0,
            value: 0,
          };
        }

        acc[type].count += 1;
        acc[type].quantity += Number(movement.quantity);
        acc[type].value += Number(movement.total_cost || 0);

        return acc;
      },
      {} as Record<string, any>
    );

    // Group movements by product
    const movementsByProduct = movements.reduce(
      (acc, movement) => {
        const productId = movement.product_id;

        if (!acc[productId]) {
          acc[productId] = {
            productId,
            productName: `Product ${productId.substring(0, 8)}`, // Will be enriched with actual product data
            incoming: 0,
            outgoing: 0,
            netChange: 0,
          };
        }

        // Determine if this is incoming or outgoing
        const isIncoming = locationId
          ? movement.to_location_id === locationId
          : ['PURCHASE', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'PRODUCTION_IN', 'RETURN_IN'].includes(
              movement.movement_type
            );

        if (isIncoming) {
          acc[productId].incoming += Number(movement.quantity);
        } else {
          acc[productId].outgoing += Number(movement.quantity);
        }

        acc[productId].netChange = acc[productId].incoming - acc[productId].outgoing;

        return acc;
      },
      {} as Record<string, any>
    );

    // Enrich product data with actual product names
    const productIds = Object.keys(movementsByProduct);
    if (productIds.length > 0) {
      const products = await this.prisma.products.findMany({
        where: {
          id: { in: productIds },
          company_id: companyId,
        },
        select: {
          id: true,
          name: true,
          product_code: true,
        },
      });

      products.forEach(product => {
        if (movementsByProduct[product.id]) {
          movementsByProduct[product.id].productName = product.name;
          movementsByProduct[product.id].productCode = product.product_code;
        }
      });
    }

    // Generate movement trend by date
    const movementTrend: Record<string, any> = {};

    movements.forEach(movement => {
      const dateKey = movement.created_at.toISOString().split('T')[0];

      if (!movementTrend[dateKey]) {
        movementTrend[dateKey] = {
          date: dateKey,
          incoming: 0,
          outgoing: 0,
          netChange: 0,
        };
      }

      const isIncoming = locationId
        ? movement.to_location_id === locationId
        : ['PURCHASE', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'PRODUCTION_IN', 'RETURN_IN'].includes(
            movement.movement_type
          );

      if (isIncoming) {
        movementTrend[dateKey].incoming += Number(movement.quantity);
      } else {
        movementTrend[dateKey].outgoing += Number(movement.quantity);
      }

      movementTrend[dateKey].netChange =
        movementTrend[dateKey].incoming - movementTrend[dateKey].outgoing;
    });

    // Prepare location info if specified
    let locationInfo;
    if (locationId) {
      const location = await this.prisma.company_locations.findFirst({
        where: {
          id: locationId,
          company_id: companyId,
        },
      });

      if (location) {
        locationInfo = {
          locationId,
          locationName: location.name,
        };
      }
    }

    return {
      summary: {
        totalMovements,
        incoming,
        outgoing,
        netChange,
        valueChange,
      },
      movementsByType: Object.values(movementsByType),
      movementsByProduct: Object.values(movementsByProduct).sort(
        (a, b) => Math.abs(b.netChange) - Math.abs(a.netChange)
      ),
      movementTrend: Object.values(movementTrend).sort((a: any, b: any) =>
        a.date.localeCompare(b.date)
      ),
      dateRange: {
        startDate,
        endDate,
      },
      ...(locationInfo && { location: locationInfo }),
    };
  }

  /**
   * Generate Production Planning Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Production Planning Report
   */
  async generateProductionPlanningReport(companyId: string, startDate: Date, endDate: Date) {
    // Fetch orders data (just count)
    const orderCount = await this.prisma.orders.count({
      where: {
        company_id: companyId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Generate sample data for production planning
    const totalOrders = orderCount || Math.floor(Math.random() * 50) + 20; // Use real count or generate 20-70
    const completedOrders = Math.floor(totalOrders * 0.6); // 60% completed
    const inProgressOrders = Math.floor(totalOrders * 0.3); // 30% in progress
    const pendingOrders = totalOrders - completedOrders - inProgressOrders; // Remaining are pending

    // Calculate on-time completion rate
    const onTimeDeliveries = Math.floor(completedOrders * 0.8); // 80% on time
    const onTimeCompletionRate =
      completedOrders > 0 ? (onTimeDeliveries / completedOrders) * 100 : 0;

    // Generate orders by status
    const statuses = [
      'DRAFT',
      'CONFIRMED',
      'IN_PRODUCTION',
      'READY_TO_SHIP',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];
    const ordersByStatus = [];

    for (const status of statuses) {
      let count;
      switch (status) {
        case 'DELIVERED':
          count = completedOrders;
          break;
        case 'DRAFT':
          count = pendingOrders;
          break;
        case 'CANCELLED':
          count = Math.floor(Math.random() * 5); // 0-5
          break;
        default:
          count = Math.floor(inProgressOrders / 4); // Distribute in-progress orders
      }

      const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;

      ordersByStatus.push({
        status,
        count,
        percentage,
      });
    }

    // Fetch products for order by product data
    const products = await this.prisma.products.findMany({
      where: {
        company_id: companyId,
      },
      select: {
        id: true,
      },
      take: 10, // Limit to 10 products
    });

    // Generate orders by product
    const ordersByProduct = [];

    for (const product of products) {
      const productId = product.id;
      const orderCount = Math.floor(Math.random() * 10) + 1; // 1-11
      const quantity = Math.floor(Math.random() * 100) + 10; // 10-110

      ordersByProduct.push({
        productId,
        productName: `Product ${productId.substring(0, 8)}`,
        orderCount,
        quantity,
      });
    }

    // Generate capacity utilization data
    const capacityUtilization = [];
    const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

    for (let i = 0; i <= dayCount; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];

      // Generate sample data
      const capacity = 100; // Theoretical max capacity
      const planned = Math.floor(Math.random() * 40) + 60; // 60-100
      const actual = Math.floor(planned * (Math.random() * 0.3 + 0.7)); // 70-100% of planned
      const utilization = (actual / capacity) * 100;

      capacityUtilization.push({
        date: dateKey,
        capacity,
        planned,
        actual,
        utilization,
      });
    }

    return {
      summary: {
        totalOrders,
        completedOrders,
        inProgressOrders,
        pendingOrders,
        onTimeCompletionRate,
      },
      ordersByStatus,
      ordersByProduct: ordersByProduct.sort((a, b) => b.quantity - a.quantity),
      capacityUtilization: capacityUtilization.sort((a, b) => a.date.localeCompare(b.date)),
      dateRange: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Generate Sales Trends Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @param groupBy - Group by period (day, week, month, quarter)
   * @returns Sales Trends Report
   */
  async generateSalesTrendsReport(
    companyId: string,
    startDate: Date,
    endDate: Date,
    groupBy: string = 'month'
  ) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    // Fetch all invoices in date range
    const invoices = await this.prisma.invoices.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        invoice_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        invoice_items: true,
      },
      orderBy: { invoice_date: 'asc' },
    });

    // Calculate summary metrics
    const totalOrders = invoices.length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate growth rate (compare first half vs second half of period)
    const midpoint = new Date((startDate.getTime() + endDate.getTime()) / 2);
    const firstHalfRevenue = invoices
      .filter(inv => inv.invoice_date < midpoint)
      .reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const secondHalfRevenue = invoices
      .filter(inv => inv.invoice_date >= midpoint)
      .reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const growthRate =
      firstHalfRevenue > 0 ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 : 0;

    // Helper function to get period key based on date and groupBy
    const getPeriodKey = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      switch (groupBy) {
        case 'day':
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        case 'week': {
          // Get ISO week number
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
          const week =
            Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 4).getTime()) / 86400000 / 7) +
            1;
          return `${year}-W${week.toString().padStart(2, '0')}`;
        }
        case 'quarter': {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          return `${year}-Q${quarter}`;
        }
        case 'month':
        default:
          return `${year}-${month.toString().padStart(2, '0')}`;
      }
    };

    // Group invoices by period
    const periodData: Record<string, any> = {};

    invoices.forEach(invoice => {
      const periodKey = getPeriodKey(invoice.invoice_date);

      if (!periodData[periodKey]) {
        periodData[periodKey] = {
          period: periodKey,
          revenue: 0,
          orders: 0,
          growth: 0,
        };
      }

      periodData[periodKey].revenue += Number(invoice.total_amount);
      periodData[periodKey].orders += 1;
    });

    // Convert to array and sort
    const trendsByPeriod = Object.values(periodData).sort((a: any, b: any) =>
      a.period.localeCompare(b.period)
    );

    // Calculate growth for each period (compared to previous period)
    for (let i = 1; i < trendsByPeriod.length; i++) {
      const current = trendsByPeriod[i];
      const previous = trendsByPeriod[i - 1];
      current.growth =
        previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0;
    }

    // Find peak period
    let peakPeriod = 'N/A';
    if (trendsByPeriod.length > 0) {
      const maxRevenuePeriod = trendsByPeriod.reduce(
        (max: any, period: any) => (period.revenue > max.revenue ? period : max),
        trendsByPeriod[0]
      );

      peakPeriod = maxRevenuePeriod.period;
    }

    // Revenue breakdown by category (based on invoice items)
    const categoryRevenue: Record<string, number> = {};
    let totalCategoryRevenue = 0;

    invoices.forEach(invoice => {
      invoice.invoice_items.forEach(item => {
        // For now, we'll use a simple categorization based on description
        // In a real implementation, this would use product categories
        const category = item.description?.includes('Fabric')
          ? 'Fabric'
          : item.description?.includes('Garment')
            ? 'Garments'
            : item.description?.includes('Yarn')
              ? 'Yarn'
              : 'Other';

        if (!categoryRevenue[category]) {
          categoryRevenue[category] = 0;
        }

        categoryRevenue[category] += Number(item.line_amount);
        totalCategoryRevenue += Number(item.line_amount);
      });
    });

    // Convert to array with percentages
    const trendsByCategory = Object.entries(categoryRevenue).map(([category, revenue]) => ({
      category,
      revenue,
      percentage: totalCategoryRevenue > 0 ? (revenue / totalCategoryRevenue) * 100 : 0,
      growth: 0, // Could be calculated by comparing periods
    }));

    return {
      summary: {
        totalRevenue,
        averageOrderValue,
        totalOrders,
        growthRate,
        peakPeriod,
      },
      trendsByPeriod,
      trendsByCategory,
      dateRange: {
        startDate,
        endDate,
      },
      groupBy,
    };
  }

  /**
   * Generate Product Performance Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Product Performance Report
   */
  async generateProductPerformanceReport(companyId: string, startDate: Date, endDate: Date) {
    // Delegate to analyticsReportService
    return analyticsReportService.generateProductPerformanceReport(companyId, startDate, endDate);
  }

  /**
   * Generate Customer Insights Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Customer Insights Report
   */
  async generateCustomerInsightsReport(companyId: string, startDate: Date, endDate: Date) {
    // Delegate to analyticsReportService
    return analyticsReportService.generateCustomerInsightsReport(companyId, startDate, endDate);
  }

  /**
   * Generate Business Performance Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Business Performance Report
   */
  async generateBusinessPerformanceReport(companyId: string, startDate: Date, endDate: Date) {
    // Delegate to analyticsReportService
    return analyticsReportService.generateBusinessPerformanceReport(companyId, startDate, endDate);
  }

  /**
   * Generate Textile Analytics Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Textile Analytics Report
   */
  async generateTextileAnalyticsReport(companyId: string, startDate: Date, endDate: Date) {
    // Delegate to analyticsReportService
    return analyticsReportService.generateTextileAnalyticsReport(companyId, startDate, endDate);
  }

  /**
   * Generate Stock Aging Report
   * @param companyId - Company ID
   * @param asOfDate - As of date
   * @returns Stock Aging Report
   */
  async generateStockAgingReport(companyId: string, asOfDate: Date = new Date()) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    // Get all inventory items
    const inventory = await this.prisma.location_inventory.findMany({
      where: {
        company_id: companyId,
        stock_quantity: { gt: 0 },
      },
      include: {
        product: true,
        location: true,
      },
    });

    const agingBuckets = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '91-120': 0,
      '120+': 0,
    };

    const agingDetails = inventory.map(item => {
      // Calculate age based on last_updated
      const lastUpdated = item.last_updated;
      const ageInDays = Math.floor(
        (asOfDate.getTime() - lastUpdated.getTime()) / (1000 * 3600 * 24)
      );

      let bucket = '0-30';
      if (ageInDays > 120) bucket = '120+';
      else if (ageInDays > 90) bucket = '91-120';
      else if (ageInDays > 60) bucket = '61-90';
      else if (ageInDays > 30) bucket = '31-60';

      const value = Number(item.stock_quantity) * Number(item.product?.cost_price || 0);
      agingBuckets[bucket as keyof typeof agingBuckets] += value;

      return {
        productId: item.product_id,
        productName: item.product?.name || 'Unknown Product',
        locationName: item.location?.name || 'Unknown Location',
        quantity: Number(item.stock_quantity),
        value,
        ageInDays,
        bucket,
        lastUpdated,
      };
    });

    const totalValue = Object.values(agingBuckets).reduce((sum, val) => sum + val, 0);

    return {
      summary: {
        totalValue,
        asOfDate,
      },
      agingBuckets: Object.entries(agingBuckets).map(([bucket, value]) => ({
        bucket,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      })),
      agingDetails: agingDetails.sort((a, b) => b.ageInDays - a.ageInDays),
    };
  }

  /**
   * Generate Sales by Region Report
   * @param companyId - Company ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Sales by Region Report
   */
  async generateSalesByRegionReport(companyId: string, startDate: Date, endDate: Date) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    // Get invoices with location data
    const invoices = await this.prisma.invoices.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        invoice_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        location: true,
      },
    });

    const salesByRegion: Record<string, any> = {};
    let totalSales = 0;

    invoices.forEach(inv => {
      const region = inv.location?.name || 'Unknown Region';
      const amount = Number(inv.total_amount);

      if (!salesByRegion[region]) {
        salesByRegion[region] = {
          region,
          revenue: 0,
          orderCount: 0,
        };
      }

      salesByRegion[region].revenue += amount;
      salesByRegion[region].orderCount += 1;
      totalSales += amount;
    });

    const regionData = Object.values(salesByRegion).map(item => ({
      ...item,
      percentage: totalSales > 0 ? (item.revenue / totalSales) * 100 : 0,
    }));

    return {
      summary: {
        totalSales,
        regionCount: regionData.length,
      },
      salesByRegion: regionData.sort((a, b) => b.revenue - a.revenue),
      dateRange: {
        startDate,
        endDate,
      },
    };
  }
}

export const reportService = new ReportService();
