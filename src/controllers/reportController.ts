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
}

export const reportController = new ReportController();
