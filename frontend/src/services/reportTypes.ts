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

// Types for Operational Reports
export interface ProductionEfficiencyReport {
  summary: {
    overallEfficiency: number;
    totalProduction: number;
    plannedProduction: number;
    actualProduction: number;
    downtime: number;
  };
  efficiencyByDay: {
    date: string;
    efficiency: number;
    planned: number;
    actual: number;
  }[];
  efficiencyByMachine: {
    machineId: string;
    machineName: string;
    efficiency: number;
    runtime: number;
    downtime: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface MachineUtilizationReport {
  summary: {
    averageUtilization: number;
    totalRuntime: number;
    totalDowntime: number;
    maintenanceHours: number;
    breakdownHours: number;
  };
  utilizationByMachine: {
    machineId: string;
    machineName: string;
    utilization: number;
    runtime: number;
    downtime: number;
    maintenance: number;
    breakdown: number;
  }[];
  utilizationByDay: {
    date: string;
    utilization: number;
    runtime: number;
    downtime: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  location?: {
    locationId: string;
    locationName: string;
  };
}

export interface QualityMetricsReport {
  summary: {
    averageQualityScore: number;
    totalInspections: number;
    passRate: number;
    totalDefects: number;
    defectRate: number;
  };
  qualityByProduct: {
    productId: string;
    productName: string;
    averageScore: number;
    inspectionCount: number;
    defectCount: number;
  }[];
  defectsByType: {
    defectType: string;
    count: number;
    percentage: number;
  }[];
  qualityTrend: {
    date: string;
    averageScore: number;
    inspectionCount: number;
    passRate: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface InventoryMovementReport {
  summary: {
    totalMovements: number;
    incoming: number;
    outgoing: number;
    netChange: number;
    valueChange: number;
  };
  movementsByType: {
    movementType: string;
    count: number;
    quantity: number;
    value: number;
  }[];
  movementsByProduct: {
    productId: string;
    productName: string;
    incoming: number;
    outgoing: number;
    netChange: number;
  }[];
  movementTrend: {
    date: string;
    incoming: number;
    outgoing: number;
    netChange: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  location?: {
    locationId: string;
    locationName: string;
  };
}

export interface ProductionPlanningReport {
  summary: {
    totalOrders: number;
    completedOrders: number;
    inProgressOrders: number;
    pendingOrders: number;
    onTimeCompletionRate: number;
  };
  ordersByStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  ordersByProduct: {
    productId: string;
    productName: string;
    orderCount: number;
    quantity: number;
  }[];
  capacityUtilization: {
    date: string;
    capacity: number;
    planned: number;
    actual: number;
    utilization: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

// Types for Analytics Reports
export interface SalesTrendsReport {
  summary: {
    totalRevenue: number;
    averageOrderValue: number;
    totalOrders: number;
    growthRate: number;
    peakPeriod: string;
  };
  trendsByPeriod: {
    period: string;
    revenue: number;
    orders: number;
    growth: number;
  }[];
  trendsByCategory: {
    category: string;
    revenue: number;
    percentage: number;
    growth: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  groupBy: string;
}

export interface ProductPerformanceReport {
  summary: {
    topProduct: {
      id: string;
      name: string;
      revenue: number;
      quantity: number;
    };
    topCategory: {
      id: string;
      name: string;
      revenue: number;
    };
    averageProfitMargin: number;
    productsAnalyzed: number;
  };
  productRankings: {
    productId: string;
    productName: string;
    revenue: number;
    quantity: number;
    profitMargin: number;
    rank: number;
  }[];
  categoryPerformance: {
    category: string;
    revenue: number;
    percentage: number;
    productCount: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface CustomerInsightsReport {
  summary: {
    totalCustomers: number;
    newCustomers: number;
    repeatPurchaseRate: number;
    averageCustomerValue: number;
    topCustomer: {
      id: string;
      name: string;
      revenue: number;
    };
  };
  customerSegments: {
    segment: string;
    customerCount: number;
    revenue: number;
    percentage: number;
  }[];
  customerRetention: {
    period: string;
    retentionRate: number;
    newCustomers: number;
    returningCustomers: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface BusinessPerformanceReport {
  summary: {
    revenue: number;
    expenses: number;
    netProfit: number;
    profitMargin: number;
    roi: number;
  };
  performanceByPeriod: {
    period: string;
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
  }[];
  performanceByDepartment: {
    department: string;
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
  }[];
  kpiTrends: {
    period: string;
    kpi: string;
    value: number;
    target: number;
    variance: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface TextileAnalyticsReport {
  summary: {
    totalProduction: number;
    topFabricType: string;
    averageQualityScore: number;
    efficiencyRate: number;
    wastePercentage: number;
  };
  productionByType: {
    fabricType: string;
    quantity: number;
    percentage: number;
    qualityScore: number;
  }[];
  qualityByProcess: {
    process: string;
    averageScore: number;
    defectRate: number;
    passRate: number;
  }[];
  efficiencyTrend: {
    period: string;
    efficiency: number;
    waste: number;
    production: number;
  }[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  category?: string;
}
