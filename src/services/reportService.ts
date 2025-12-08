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
          profit: Number(monthRevenue._sum.total_amount || 0) - Number(monthExpenses._sum.total_amount || 0),
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
    const accountsReceivable = invoices.reduce(
      (sum, inv) => sum + Number(inv.balance_due),
      0
    );

    const inventoryValue = inventory.reduce(
      (sum, item) =>
        sum + Number(item.stock_quantity) * Number(item.product?.cost_price || 0),
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
      { category: 'Owner\'s Capital', amount: 100000 }, // Placeholder
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
    const cashFromCustomers = paidInvoices.reduce(
      (sum, inv) => sum + Number(inv.total_amount),
      0
    );

    const cashToSuppliers = paidBills.reduce(
      (sum, bill) => sum + Number(bill.total_amount),
      0
    );

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
      { accountCode: '3000', accountName: 'Owner\'s Capital', debit: 0, credit: 100000 },
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
}

export const reportService = new ReportService();
