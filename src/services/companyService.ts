import { databaseManager, globalPrisma } from '../database/connection';
import { logger } from '../utils/logger';

interface CreateCompanyData {
  name: string;
  slug: string;
  industry?: string;
  description?: string;
  country?: string;
}

interface CompanyWithRole {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  description?: string;
  country?: string;
  role: string;
  joinedAt: Date;
  isActive: boolean;
}

export class CompanyService {
  /**
   * Create a new company and assign the user as OWNER
   */
  async createCompany(userId: string, companyData: CreateCompanyData): Promise<any> {
    
    try {
      // Check if slug is already taken
      const existingTenant = await globalPrisma.tenant.findUnique({
        where: { slug: companyData.slug }
      });

      if (existingTenant) {
        throw new Error('Company slug already exists');
      }

      // Create tenant and user-tenant relationship in a transaction
      const result = await globalPrisma.$transaction(async (tx) => {
        // Create the tenant
        const tenant = await tx.tenant.create({
          data: {
            name: companyData.name,
            slug: companyData.slug,
            industry: companyData.industry,
            description: companyData.description,
            country: companyData.country,
          }
        });

        // Create user-tenant relationship with OWNER role
        await tx.userTenant.create({
          data: {
            userId,
            tenantId: tenant.id,
            role: 'OWNER'
          }
        });

        return tenant;
      });

      logger.info(`Company created: ${result.name} (${result.slug}) by user ${userId}`);
      return result;
    } catch (error) {
      logger.error('Error creating company:', error);
      throw error;
    }
  }

  /**
   * Get all companies for a user with their roles
   */
  async getUserCompanies(userId: string): Promise<CompanyWithRole[]> {
    
    try {
      const userTenants = await globalPrisma.userTenant.findMany({
        where: {
          userId,
          isActive: true
        },
        include: {
          tenant: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return userTenants.map(ut => ({
        id: ut.tenant.id,
        name: ut.tenant.name,
        slug: ut.tenant.slug,
        industry: ut.tenant.industry,
        description: ut.tenant.description,
        country: ut.tenant.country,
        role: ut.role,
        joinedAt: ut.createdAt,
        isActive: ut.tenant.isActive
      }));
    } catch (error) {
      logger.error('Error fetching user companies:', error);
      // Return empty array instead of throwing to handle new users gracefully
      return [];
    }
  }

  /**
   * Get company details by ID (with user access validation)
   */
  async getCompanyById(userId: string, tenantId: string): Promise<any> {
    
    try {
      // Verify user has access to this tenant
      const userTenant = await globalPrisma.userTenant.findFirst({
        where: {
          userId,
          tenantId,
          isActive: true
        },
        include: {
          tenant: true
        }
      });

      if (!userTenant) {
        throw new Error('Access denied to company');
      }

      return {
        ...userTenant.tenant,
        userRole: userTenant.role,
        joinedAt: userTenant.createdAt
      };
    } catch (error) {
      logger.error('Error fetching company details:', error);
      throw error;
    }
  }

  /**
   * Switch company context for a user
   */
  async switchCompany(userId: string, tenantId: string): Promise<any> {
    
    try {
      // Verify user has access to this tenant
      const userTenant = await globalPrisma.userTenant.findFirst({
        where: {
          userId,
          tenantId,
          isActive: true
        },
        include: {
          tenant: true
        }
      });

      if (!userTenant) {
        throw new Error('Access denied to company');
      }

      logger.info(`User ${userId} switched to company ${tenantId}`);
      return {
        tenant: userTenant.tenant,
        role: userTenant.role
      };
    } catch (error) {
      logger.error('Error switching company:', error);
      throw error;
    }
  }

  /**
   * Invite user to company (OWNER/ADMIN only)
   */
  async inviteUser(inviterId: string, tenantId: string, email: string, role: string): Promise<any> {
    
    try {
      // Verify inviter has permission (OWNER or ADMIN)
      const inviterAccess = await globalPrisma.userTenant.findFirst({
        where: {
          userId: inviterId,
          tenantId,
          role: { in: ['OWNER', 'ADMIN'] },
          isActive: true
        }
      });

      if (!inviterAccess) {
        throw new Error('Insufficient permissions to invite users');
      }

      // Find user by email
      const user = await globalPrisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is already part of the company
      const existingAccess = await globalPrisma.userTenant.findFirst({
        where: {
          userId: user.id,
          tenantId
        }
      });

      if (existingAccess) {
        throw new Error('User is already part of this company');
      }

      // Create user-tenant relationship
      const userTenant = await globalPrisma.userTenant.create({
        data: {
          userId: user.id,
          tenantId,
          role: role as any
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      logger.info(`User ${user.email} invited to company ${tenantId} with role ${role}`);
      return userTenant;
    } catch (error) {
      logger.error('Error inviting user:', error);
      throw error;
    }
  }

  /**
   * Update company details (OWNER/ADMIN only)
   */
  async updateCompany(userId: string, tenantId: string, updateData: Partial<CreateCompanyData>): Promise<any> {
    
    try {
      // Verify user has permission (OWNER or ADMIN)
      const userAccess = await globalPrisma.userTenant.findFirst({
        where: {
          userId,
          tenantId,
          role: { in: ['OWNER', 'ADMIN'] },
          isActive: true
        }
      });

      if (!userAccess) {
        throw new Error('Insufficient permissions to update company');
      }

      // If slug is being updated, check if it's available
      if (updateData.slug) {
        const existingTenant = await globalPrisma.tenant.findFirst({
          where: {
            slug: updateData.slug,
            id: { not: tenantId }
          }
        });

        if (existingTenant) {
          throw new Error('Company slug already exists');
        }
      }

      const updatedTenant = await globalPrisma.tenant.update({
        where: { id: tenantId },
        data: updateData
      });

      logger.info(`Company ${tenantId} updated by user ${userId}`);
      return updatedTenant;
    } catch (error) {
      logger.error('Error updating company:', error);
      throw error;
    }
  }
}

export const companyService = new CompanyService();
