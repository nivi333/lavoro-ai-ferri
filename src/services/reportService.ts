import { PrismaClient, InvoiceStatus, BillStatus } from '@prisma/client';

const prisma = new PrismaClient();

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
          const productName = item.product?.name || item.description || 'Custom Item';
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
}

export const reportService = new ReportService();
