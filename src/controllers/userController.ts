import { Request, Response } from 'express';
import Joi from 'joi';
import userService from '../services/userService';

// Validation schemas
const inviteUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  firstName: Joi.string().required().min(2).max(50),
  lastName: Joi.string().required().min(2).max(50),
  password: Joi.string().required().min(8),
  role: Joi.string().valid('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE').required(),
  department: Joi.string().optional(),
  locationId: Joi.string().optional(),
}).or('email', 'phone');

const bulkInviteSchema = Joi.object({
  users: Joi.array()
    .items(
      Joi.object({
        email: Joi.string().email().required(),
        firstName: Joi.string().required().min(2).max(50),
        lastName: Joi.string().required().min(2).max(50),
        role: Joi.string().valid('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE').required(),
        department: Joi.string().optional(),
        locationId: Joi.string().optional(),
      })
    )
    .max(100)
    .required(),
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().optional().min(2).max(50),
  lastName: Joi.string().optional().min(2).max(50),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE').optional(),
  department: Joi.string().optional(),
  locationId: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

const bulkUpdateSchema = Joi.object({
  userIds: Joi.array().items(Joi.string()).min(1).max(10).required(),
  role: Joi.string().valid('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE').optional(),
  isActive: Joi.boolean().optional(),
});

const bulkRemoveSchema = Joi.object({
  userIds: Joi.array().items(Joi.string()).min(1).max(10).required(),
});

class UserController {
  // Get all users for a company
  async getCompanyUsers(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).userId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const filters = {
        search: req.query.search as string,
        role: req.query.role as string,
        status: req.query.status as string,
        department: req.query.department as string,
        locationId: req.query.locationId as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
      };

      const result = await userService.getCompanyUsers(tenantId, filters);

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error in getCompanyUsers:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch users',
      });
    }
  }

  // Get user by ID
  async getUserById(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const { userId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const user = await userService.getUserById(userId, tenantId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      console.error('Error in getUserById:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch user',
      });
    }
  }

  // Invite user to company
  async inviteUser(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).userId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      // Validate request body
      const { error, value } = inviteUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const result = await userService.inviteUser(tenantId, userId, {
        ...value,
        companyId: tenantId,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error: any) {
      console.error('Error in inviteUser:', error);
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to invite user',
      });
    }
  }

  // Bulk invite users
  async bulkInviteUsers(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).userId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      // Validate request body
      const { error, value } = bulkInviteSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const result = await userService.bulkInviteUsers(tenantId, userId, value.users);

      res.status(201).json({
        success: true,
        data: result,
        message: `Invited ${result.success.length} users, ${result.failed.length} failed`,
      });
    } catch (error: any) {
      console.error('Error in bulkInviteUsers:', error);
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to bulk invite users',
      });
    }
  }

  // Update user
  async updateUser(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const updaterUserId = (req as any).userId;
      const { userId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      // Validate request body
      const { error, value } = updateUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const result = await userService.updateUser(userId, tenantId, updaterUserId, value);

      res.status(200).json({
        success: true,
        data: result,
        message: 'User updated successfully',
      });
    } catch (error: any) {
      console.error('Error in updateUser:', error);
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to update user',
      });
    }
  }

  // Bulk update users
  async bulkUpdateUsers(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).userId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      // Validate request body
      const { error, value } = bulkUpdateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const result = await userService.bulkUpdateUsers(tenantId, userId, value.userIds, {
        role: value.role,
        isActive: value.isActive,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error: any) {
      console.error('Error in bulkUpdateUsers:', error);
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to bulk update users',
      });
    }
  }

  // Remove user from company
  async removeUser(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const removerUserId = (req as any).userId;
      const { userId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const result = await userService.removeUser(userId, tenantId, removerUserId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error('Error in removeUser:', error);
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to remove user',
      });
    }
  }

  // Bulk remove users
  async bulkRemoveUsers(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const userId = (req as any).userId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      // Validate request body
      const { error, value } = bulkRemoveSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const result = await userService.bulkRemoveUsers(tenantId, userId, value.userIds);

      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error: any) {
      console.error('Error in bulkRemoveUsers:', error);
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        message: error.message || 'Failed to bulk remove users',
      });
    }
  }

  // Get user activity
  async getUserActivity(req: Request, res: Response) {
    try {
      const tenantId = (req as any).tenantId;
      const { userId } = req.params;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Company context required',
        });
      }

      const activity = await userService.getUserActivity(userId, tenantId);

      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error: any) {
      console.error('Error in getUserActivity:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch user activity',
      });
    }
  }
}

export default new UserController();
