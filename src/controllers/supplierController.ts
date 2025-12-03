import { Request, Response } from 'express';
import { supplierService } from '../services/supplierService';
import { logger } from '../utils/logger';
import Joi from 'joi';

const createSupplierSchema = Joi.object({
  code: Joi.string().max(50).optional().allow('', null),
  name: Joi.string().min(2).max(100).required(),
  supplierType: Joi.string()
    .valid('MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'IMPORTER', 'LOCAL_VENDOR')
    .optional().allow(null),
  companyRegNo: Joi.string().max(50).optional().allow('', null),
  // Contact Info
  primaryContactPerson: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[+]?[1-9][\d]{0,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please enter a valid phone number with country code',
    }),
  alternatePhone: Joi.string()
    .pattern(/^[+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please enter a valid phone number with country code',
    }),
  website: Joi.string().uri().optional().allow('', null),
  fax: Joi.string().max(20).optional().allow('', null),
  // Address
  addressLine1: Joi.string().max(255).optional().allow('', null),
  addressLine2: Joi.string().max(255).optional().allow('', null),
  city: Joi.string().max(100).optional().allow('', null),
  state: Joi.string().max(100).optional().allow('', null),
  country: Joi.string().max(100).optional().allow('', null),
  postalCode: Joi.string().max(20).optional().allow('', null),
  // Financial
  paymentTerms: Joi.string()
    .valid('NET_30', 'NET_60', 'NET_90', 'ADVANCE', 'COD', 'CREDIT')
    .optional().allow(null),
  creditPeriod: Joi.number().integer().min(0).optional().allow(null),
  currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP').default('INR'),
  taxId: Joi.string().max(50).optional().allow('', null),
  panNumber: Joi.string()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please enter a valid PAN number (e.g., ABCDE1234F)',
    }),
  bankDetails: Joi.string().max(500).optional().allow('', null),
  // Supply Info
  productCategories: Joi.array().items(Joi.string().max(50)).optional().allow(null),
  leadTimeDays: Joi.number().integer().min(0).optional().allow(null),
  minOrderQty: Joi.number().integer().min(0).optional().allow(null),
  minOrderValue: Joi.number().min(0).precision(2).optional().allow(null),
  // Quality & Compliance
  qualityRating: Joi.string()
    .valid('EXCELLENT', 'GOOD', 'AVERAGE', 'POOR')
    .optional().allow(null),
  certifications: Joi.array().items(Joi.string().max(50)).optional().allow(null),
  complianceStatus: Joi.string()
    .valid('COMPLIANT', 'NON_COMPLIANT', 'PENDING_REVIEW')
    .optional().allow(null),
  // Additional
  supplierCategory: Joi.string()
    .valid('PREFERRED', 'APPROVED', 'TRIAL', 'BLACKLISTED')
    .optional().allow(null),
  assignedManager: Joi.string().uuid().optional().allow('', null),
  notes: Joi.string().max(500).optional().allow('', null),
  tags: Joi.array().items(Joi.string().max(50)).optional().allow(null),
  isActive: Joi.boolean().default(true),
});

const updateSupplierSchema = Joi.object({
  code: Joi.string().max(50).optional().allow('', null),
  name: Joi.string().min(2).max(100).optional(),
  supplierType: Joi.string()
    .valid('MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'IMPORTER', 'LOCAL_VENDOR')
    .optional().allow(null),
  companyRegNo: Joi.string().max(50).optional().allow('', null),
  // Contact Info
  primaryContactPerson: Joi.string().min(2).max(100).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string()
    .pattern(/^[+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please enter a valid phone number with country code',
    }),
  alternatePhone: Joi.string()
    .pattern(/^[+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please enter a valid phone number with country code',
    }),
  website: Joi.string().uri().optional().allow('', null),
  fax: Joi.string().max(20).optional().allow('', null),
  // Address
  addressLine1: Joi.string().max(255).optional().allow('', null),
  addressLine2: Joi.string().max(255).optional().allow('', null),
  city: Joi.string().max(100).optional().allow('', null),
  state: Joi.string().max(100).optional().allow('', null),
  country: Joi.string().max(100).optional().allow('', null),
  postalCode: Joi.string().max(20).optional().allow('', null),
  // Financial
  paymentTerms: Joi.string()
    .valid('NET_30', 'NET_60', 'NET_90', 'ADVANCE', 'COD', 'CREDIT')
    .optional().allow(null),
  creditPeriod: Joi.number().integer().min(0).optional().allow(null),
  currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP').optional().allow(null),
  taxId: Joi.string().max(50).optional().allow('', null),
  panNumber: Joi.string()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please enter a valid PAN number (e.g., ABCDE1234F)',
    }),
  bankDetails: Joi.string().max(500).optional().allow('', null),
  // Supply Info
  productCategories: Joi.array().items(Joi.string().max(50)).optional().allow(null),
  leadTimeDays: Joi.number().integer().min(0).optional().allow(null),
  minOrderQty: Joi.number().integer().min(0).optional().allow(null),
  minOrderValue: Joi.number().min(0).precision(2).optional().allow(null),
  // Quality & Compliance
  qualityRating: Joi.string()
    .valid('EXCELLENT', 'GOOD', 'AVERAGE', 'POOR')
    .optional().allow(null),
  certifications: Joi.array().items(Joi.string().max(50)).optional().allow(null),
  complianceStatus: Joi.string()
    .valid('COMPLIANT', 'NON_COMPLIANT', 'PENDING_REVIEW')
    .optional().allow(null),
  // Additional
  supplierCategory: Joi.string()
    .valid('PREFERRED', 'APPROVED', 'TRIAL', 'BLACKLISTED')
    .optional().allow(null),
  assignedManager: Joi.string().uuid().optional().allow('', null),
  notes: Joi.string().max(500).optional().allow('', null),
  tags: Joi.array().items(Joi.string().max(50)).optional().allow(null),
  isActive: Joi.boolean().optional(),
});

export class SupplierController {
  async createSupplier(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { error, value } = createSupplierSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const supplier = await supplierService.createSupplier({
        companyId: tenantId,
        ...value,
      });

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier,
      });
    } catch (error: any) {
      logger.error('Error creating supplier:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create supplier',
      });
    }
  }

  async getSuppliers(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const {
        search,
        supplierType,
        supplierCategory,
        isActive,
        qualityRating,
        complianceStatus,
        page,
        limit,
      } = req.query;

      const filters = {
        search: search as string,
        supplierType: supplierType as string,
        supplierCategory: supplierCategory as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        qualityRating: qualityRating as string,
        complianceStatus: complianceStatus as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      };

      const result = await supplierService.getSuppliers(tenantId, filters);

      res.json({
        success: true,
        data: result.suppliers,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Error fetching suppliers:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch suppliers',
      });
    }
  }

  async getSupplierById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, id } = req.params;
      const supplier = await supplierService.getSupplierById(tenantId, id);

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error: any) {
      logger.error('Error fetching supplier:', error);
      const statusCode = error.message === 'Supplier not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch supplier',
      });
    }
  }

  async updateSupplier(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, id } = req.params;
      const { error, value } = updateSupplierSchema.validate(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const supplier = await supplierService.updateSupplier(id, {
        companyId: tenantId,
        ...value,
      });

      res.json({
        success: true,
        message: 'Supplier updated successfully',
        data: supplier,
      });
    } catch (error: any) {
      logger.error('Error updating supplier:', error);
      const statusCode = error.message === 'Supplier not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update supplier',
      });
    }
  }

  async deleteSupplier(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, id } = req.params;
      await supplierService.deleteSupplier(tenantId, id);

      res.json({
        success: true,
        message: 'Supplier deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting supplier:', error);
      const statusCode = error.message === 'Supplier not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete supplier',
      });
    }
  }
}

export const supplierController = new SupplierController();
