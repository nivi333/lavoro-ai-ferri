import { Request, Response } from 'express';
import { companyService } from '../services/companyService';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';
import Joi from 'joi';

// Validation schemas
const createCompanySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string().min(2).max(50).pattern(/^[a-z0-9-]+$/).required(),
  industry: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional(),
  country: Joi.string().max(100).optional()
});

const updateCompanySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  slug: Joi.string().min(2).max(50).pattern(/^[a-z0-9-]+$/).optional(),
  industry: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional(),
  country: Joi.string().max(100).optional()
});

const inviteUserSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('ADMIN', 'MANAGER', 'EMPLOYEE').required()
});

export class CompanyController {
  /**
   * Create a new company
   * POST /api/v1/companies
   */
  async createCompany(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createCompanySchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message)
        });
        return;
      }

      const userId = req.userId!;
      const company = await companyService.createCompany(userId, value);

      res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: company
      });
    } catch (error: any) {
      logger.error('Error creating company:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create company'
      });
    }
  }

  /**
   * Get all companies for the authenticated user
   * GET /api/v1/companies
   */
  async getUserCompanies(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const companies = await companyService.getUserCompanies(userId);

      res.json({
        success: true,
        data: companies
      });
    } catch (error: any) {
      logger.error('Error fetching user companies:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch companies'
      });
    }
  }

  /**
   * Get company details by ID
   * GET /api/v1/companies/:tenantId
   */
  async getCompanyById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { tenantId } = req.params;

      const company = await companyService.getCompanyById(userId, tenantId);

      res.json({
        success: true,
        data: company
      });
    } catch (error: any) {
      logger.error('Error fetching company details:', error);
      const statusCode = error.message === 'Access denied to company' ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch company details'
      });
    }
  }

  /**
   * Switch company context
   * POST /api/v1/companies/:tenantId/switch
   */
  async switchCompany(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { tenantId } = req.params;

      const result = await companyService.switchCompany(userId, tenantId);

      res.json({
        success: true,
        message: 'Company context switched successfully',
        data: {
          company: result.tenant,
          role: result.role
        }
      });
    } catch (error: any) {
      logger.error('Error switching company:', error);
      const statusCode = error.message === 'Access denied to company' ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to switch company'
      });
    }
  }

  /**
   * Update company details
   * PUT /api/v1/companies/:tenantId
   */
  async updateCompany(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateCompanySchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message)
        });
        return;
      }

      const userId = req.userId!;
      const { tenantId } = req.params;

      const company = await companyService.updateCompany(userId, tenantId, value);

      res.json({
        success: true,
        message: 'Company updated successfully',
        data: company
      });
    } catch (error: any) {
      logger.error('Error updating company:', error);
      const statusCode = error.message === 'Insufficient permissions to update company' ? 403 : 
                        error.message === 'Company slug already exists' ? 409 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update company'
      });
    }
  }

  /**
   * Invite user to company
   * POST /api/v1/companies/:tenantId/invite
   */
  async inviteUser(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = inviteUserSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message)
        });
        return;
      }

      const userId = req.userId!;
      const { tenantId } = req.params;
      const { email, role } = value;

      const invitation = await companyService.inviteUser(userId, tenantId, email, role);

      res.status(201).json({
        success: true,
        message: 'User invited successfully',
        data: invitation
      });
    } catch (error: any) {
      logger.error('Error inviting user:', error);
      const statusCode = error.message === 'Insufficient permissions to invite users' ? 403 :
                        error.message === 'User not found' ? 404 :
                        error.message === 'User is already part of this company' ? 409 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to invite user'
      });
    }
  }
}

export const companyController = new CompanyController();
