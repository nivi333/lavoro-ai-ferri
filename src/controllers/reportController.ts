import { Request, Response } from 'express';
import Joi from 'joi';
import { reportService } from '../services/reportService';

// Joi Schemas for validation
const dateRangeSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
});

const asOfDateSchema = Joi.object({
  asOfDate: Joi.date().optional(),
});

const locationSchema = Joi.object({
  locationId: Joi.string().optional(),
});

export class ReportController {
  /**
   * GET /api/reports/profit-loss
   * Generate Profit & Loss Report
   */
  async getProfitLossReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = dateRangeSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateProfitLossReport(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate)
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating profit & loss report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate profit & loss report',
      });
    }
  }

  /**
   * GET /api/reports/balance-sheet
   * Generate Balance Sheet Report
   */
  async getBalanceSheet(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = asOfDateSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const asOfDate = value.asOfDate ? new Date(value.asOfDate) : new Date();
      const report = await reportService.generateBalanceSheet(tenantId, asOfDate);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating balance sheet:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate balance sheet',
      });
    }
  }

  /**
   * GET /api/reports/cash-flow
   * Generate Cash Flow Statement
   */
  async getCashFlowStatement(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = dateRangeSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateCashFlowStatement(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate)
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating cash flow statement:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate cash flow statement',
      });
    }
  }

  /**
   * GET /api/reports/trial-balance
   * Generate Trial Balance Report
   */
  async getTrialBalance(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = asOfDateSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const asOfDate = value.asOfDate ? new Date(value.asOfDate) : new Date();
      const report = await reportService.generateTrialBalance(tenantId, asOfDate);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating trial balance:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate trial balance',
      });
    }
  }

  /**
   * GET /api/reports/gst
   * Generate GST Report
   */
  async getGSTReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const periodSchema = Joi.object({
        period: Joi.string().required(),
      });

      const { error, value } = periodSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateGSTReport(tenantId, value.period);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating GST report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate GST report',
      });
    }
  }
  /**
   * GET /api/reports/sales-summary
   * Generate Sales Summary Report
   */
  async getSalesSummary(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = dateRangeSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateSalesSummary(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate)
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating sales summary:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate sales summary',
      });
    }
  }

  /**
   * GET /api/reports/inventory-summary
   * Generate Inventory Summary Report
   */
  async getInventorySummary(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = locationSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateInventorySummary(tenantId, value.locationId);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating inventory summary:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate inventory summary',
      });
    }
  }

  /**
   * GET /api/reports/ar-aging
   * Generate Accounts Receivable Aging Report
   */
  async getARAgingReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = asOfDateSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const asOfDate = value.asOfDate ? new Date(value.asOfDate) : new Date();
      const report = await reportService.generateARAgingReport(tenantId, asOfDate);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating AR aging report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate AR aging report',
      });
    }
  }

  /**
   * GET /api/reports/ap-aging
   * Generate Accounts Payable Aging Report
   */
  async getAPAgingReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = asOfDateSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const asOfDate = value.asOfDate ? new Date(value.asOfDate) : new Date();
      const report = await reportService.generateAPAgingReport(tenantId, asOfDate);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating AP aging report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate AP aging report',
      });
    }
  }

  /**
   * GET /api/reports/expense-summary
   * Generate Expense Summary Report
   */
  async getExpenseSummary(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = dateRangeSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateExpenseSummary(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate)
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating expense summary:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate expense summary',
      });
    }
  }

  /**
   * GET /api/reports/production-efficiency
   * Generate Production Efficiency Report
   */
  async getProductionEfficiencyReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = dateRangeSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateProductionEfficiencyReport(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate)
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating production efficiency report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate production efficiency report',
      });
    }
  }

  /**
   * GET /api/reports/machine-utilization
   * Generate Machine Utilization Report
   */
  async getMachineUtilizationReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const machineUtilizationSchema = Joi.object({
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        locationId: Joi.string().optional(),
      });

      const { error, value } = machineUtilizationSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateMachineUtilizationReport(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate),
        value.locationId
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating machine utilization report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate machine utilization report',
      });
    }
  }

  /**
   * GET /api/reports/quality-metrics
   * Generate Quality Metrics Report
   */
  async getQualityMetricsReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = dateRangeSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateQualityMetricsReport(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate)
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating quality metrics report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate quality metrics report',
      });
    }
  }

  /**
   * GET /api/reports/inventory-movement
   * Generate Inventory Movement Report
   */
  async getInventoryMovementReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const inventoryMovementSchema = Joi.object({
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        locationId: Joi.string().optional(),
      });

      const { error, value } = inventoryMovementSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateInventoryMovementReport(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate),
        value.locationId
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating inventory movement report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate inventory movement report',
      });
    }
  }

  /**
   * GET /api/reports/production-planning
   * Generate Production Planning Report
   */
  async getProductionPlanningReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = dateRangeSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateProductionPlanningReport(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate)
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating production planning report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate production planning report',
      });
    }
  }

  /**
   * GET /api/reports/sales-trends
   * Generate Sales Trends Report
   */
  async getSalesTrendsReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const salesTrendsSchema = Joi.object({
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        groupBy: Joi.string().valid('day', 'week', 'month', 'quarter').default('month'),
      });

      const { error, value } = salesTrendsSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateSalesTrendsReport(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate),
        value.groupBy
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating sales trends report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate sales trends report',
      });
    }
  }

  /**
   * GET /api/reports/product-performance
   * Generate Product Performance Report
   */
  async getProductPerformanceReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const productPerformanceSchema = Joi.object({
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        limit: Joi.number().integer().min(1).max(50).default(10),
      });

      const { error, value } = productPerformanceSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateProductPerformanceReport(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate),
        value.limit
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating product performance report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate product performance report',
      });
    }
  }

  /**
   * GET /api/reports/customer-insights
   * Generate Customer Insights Report
   */
  async getCustomerInsightsReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = dateRangeSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateCustomerInsightsReport(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate)
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating customer insights report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate customer insights report',
      });
    }
  }

  /**
   * GET /api/reports/business-performance
   * Generate Business Performance Report
   */
  async getBusinessPerformanceReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const { error, value } = dateRangeSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateBusinessPerformanceReport(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate)
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating business performance report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate business performance report',
      });
    }
  }

  /**
   * GET /api/reports/textile-analytics
   * Generate Textile Analytics Report
   */
  async getTextileAnalyticsReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req;
      if (!tenantId) {
        res.status(401).json({ success: false, message: 'Unauthorized: No tenant context' });
        return;
      }

      const textileAnalyticsSchema = Joi.object({
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        category: Joi.string().valid('all', 'fabric', 'yarn', 'dyeing', 'garment').default('all'),
      });

      const { error, value } = textileAnalyticsSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const report = await reportService.generateTextileAnalyticsReport(
        tenantId,
        new Date(value.startDate),
        new Date(value.endDate),
        value.category
      );

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error generating textile analytics report:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate textile analytics report',
      });
    }
  }
}

export const reportController = new ReportController();
