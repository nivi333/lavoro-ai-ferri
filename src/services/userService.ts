import { PrismaClient as GlobalPrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const globalPrisma = new GlobalPrismaClient();

interface CreateUserData {
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  companyId: string;
  department?: string;
  locationId?: string;
}

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  department?: string;
  locationId?: string;
  isActive?: boolean;
}

interface BulkInviteData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  department?: string;
  locationId?: string;
}

interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  locationId?: string;
  page?: number;
  limit?: number;
}

class UserService {
  // Get all users for a company with filters
  async getCompanyUsers(companyId: string, filters: UserFilters = {}) {
    try {
      const {
        search,
        role,
        status,
        department,
        locationId,
        page = 1,
        limit = 25,
      } = filters;

      // Build where clause
      const where: any = {
        company_id: companyId,
      };

      // Apply filters
      if (role) {
        where.role = role;
      }

      if (status === 'active') {
        where.is_active = true;
      } else if (status === 'inactive') {
        where.is_active = false;
      }

      // Get user-company relationships with user data
      const userCompanies = await globalPrisma.user_companies.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              is_active: true,
              created_at: true,
              updated_at: true,
              sessions: {
                where: { is_active: true },
                orderBy: { updated_at: 'desc' },
                take: 1,
                select: { updated_at: true },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      // Get total count for pagination
      const total = await globalPrisma.user_companies.count({ where });

      // Transform data to camelCase
      const users = userCompanies.map((uc) => ({
        id: uc.users.id,
        firstName: uc.users.first_name,
        lastName: uc.users.last_name,
        email: uc.users.email || '',
        phone: uc.users.phone || '',
        role: uc.role,
        isActive: uc.is_active,
        lastActive: uc.users.sessions[0]?.updated_at || uc.users.updated_at,
        createdAt: uc.created_at,
        updatedAt: uc.updated_at,
        // Add department and location if needed (extend schema later)
        department: department || null,
        locationId: locationId || null,
      }));

      // Apply search filter on transformed data
      let filteredUsers = users;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = users.filter(
          (user) =>
            user.firstName.toLowerCase().includes(searchLower) ||
            user.lastName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.role.toLowerCase().includes(searchLower)
        );
      }

      return {
        users: filteredUsers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('Error fetching company users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  // Get user by ID with company context
  async getUserById(userId: string, companyId: string) {
    try {
      const userCompany = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: userId,
          company_id: companyId,
        },
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              is_active: true,
              created_at: true,
              updated_at: true,
              sessions: {
                where: { is_active: true },
                orderBy: { updated_at: 'desc' },
                take: 10,
                select: {
                  id: true,
                  updated_at: true,
                  created_at: true,
                },
              },
            },
          },
        },
      });

      if (!userCompany) {
        throw new Error('User not found in this company');
      }

      return {
        id: userCompany.users.id,
        firstName: userCompany.users.first_name,
        lastName: userCompany.users.last_name,
        email: userCompany.users.email || '',
        phone: userCompany.users.phone || '',
        role: userCompany.role,
        isActive: userCompany.is_active,
        createdAt: userCompany.created_at,
        updatedAt: userCompany.updated_at,
        sessions: userCompany.users.sessions.map((s) => ({
          id: s.id,
          lastActive: s.updated_at,
          createdAt: s.created_at,
        })),
      };
    } catch (error: any) {
      console.error('Error fetching user by ID:', error);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  // Invite user to company
  async inviteUser(companyId: string, inviterUserId: string, userData: CreateUserData) {
    try {
      // Validate inviter has permission (OWNER or ADMIN)
      const inviter = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: inviterUserId,
          company_id: companyId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!inviter) {
        throw new Error('Only OWNER or ADMIN can invite users');
      }

      // Validate email or phone is provided
      if (!userData.email && !userData.phone) {
        throw new Error('Either email or phone is required');
      }

      // Check if user already exists
      let user = await globalPrisma.users.findFirst({
        where: {
          OR: [
            userData.email ? { email: userData.email } : {},
            userData.phone ? { phone: userData.phone } : {},
          ].filter((obj) => Object.keys(obj).length > 0),
        },
      });

      // If user exists, check if already in company
      if (user) {
        const existingMembership = await globalPrisma.user_companies.findFirst({
          where: {
            user_id: user.id,
            company_id: companyId,
          },
        });

        if (existingMembership) {
          throw new Error('User is already a member of this company');
        }

        // Add existing user to company
        await globalPrisma.user_companies.create({
          data: {
            id: uuidv4(),
            user_id: user.id,
            company_id: companyId,
            role: userData.role,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        return {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email || '',
          phone: user.phone || '',
          role: userData.role,
          isActive: true,
          message: 'Existing user added to company',
        };
      }

      // Create new user
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const newUser = await globalPrisma.$transaction(async (tx) => {
        const createdUser = await tx.users.create({
          data: {
            id: uuidv4(),
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email || null,
            phone: userData.phone || null,
            password: hashedPassword,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        await tx.user_companies.create({
          data: {
            id: uuidv4(),
            user_id: createdUser.id,
            company_id: companyId,
            role: userData.role,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        return createdUser;
      });

      return {
        id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email || '',
        phone: newUser.phone || '',
        role: userData.role,
        isActive: true,
        message: 'New user created and added to company',
      };
    } catch (error: any) {
      console.error('Error inviting user:', error);
      throw new Error(`Failed to invite user: ${error.message}`);
    }
  }

  // Bulk invite users
  async bulkInviteUsers(
    companyId: string,
    inviterUserId: string,
    usersData: BulkInviteData[]
  ) {
    try {
      // Validate inviter has permission
      const inviter = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: inviterUserId,
          company_id: companyId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!inviter) {
        throw new Error('Only OWNER or ADMIN can invite users');
      }

      if (usersData.length > 100) {
        throw new Error('Maximum 100 users can be invited at once');
      }

      const results = {
        success: [] as any[],
        failed: [] as any[],
      };

      for (const userData of usersData) {
        try {
          const result = await this.inviteUser(companyId, inviterUserId, {
            ...userData,
            password: this.generateRandomPassword(),
            companyId,
          });
          results.success.push(result);
        } catch (error: any) {
          results.failed.push({
            email: userData.email,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error: any) {
      console.error('Error bulk inviting users:', error);
      throw new Error(`Failed to bulk invite users: ${error.message}`);
    }
  }

  // Update user
  async updateUser(userId: string, companyId: string, updaterUserId: string, updateData: UpdateUserData) {
    try {
      // Validate updater has permission
      const updater = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: updaterUserId,
          company_id: companyId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!updater) {
        throw new Error('Only OWNER or ADMIN can update users');
      }

      // Check if user exists in company
      const userCompany = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: userId,
          company_id: companyId,
        },
      });

      if (!userCompany) {
        throw new Error('User not found in this company');
      }

      // Update user data
      const updatedUser = await globalPrisma.$transaction(async (tx) => {
        // Update user table
        if (updateData.firstName || updateData.lastName || updateData.email || updateData.phone) {
          await tx.users.update({
            where: { id: userId },
            data: {
              ...(updateData.firstName && { first_name: updateData.firstName }),
              ...(updateData.lastName && { last_name: updateData.lastName }),
              ...(updateData.email && { email: updateData.email }),
              ...(updateData.phone && { phone: updateData.phone }),
              updated_at: new Date(),
            },
          });
        }

        // Update user_companies table
        const updated = await tx.user_companies.update({
          where: { id: userCompany.id },
          data: {
            ...(updateData.role && { role: updateData.role }),
            ...(updateData.isActive !== undefined && { is_active: updateData.isActive }),
            updated_at: new Date(),
          },
          include: {
            users: true,
          },
        });

        return updated;
      });

      return {
        id: updatedUser.users.id,
        firstName: updatedUser.users.first_name,
        lastName: updatedUser.users.last_name,
        email: updatedUser.users.email || '',
        phone: updatedUser.users.phone || '',
        role: updatedUser.role,
        isActive: updatedUser.is_active,
        updatedAt: updatedUser.updated_at,
      };
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Bulk update users (role change, status change)
  async bulkUpdateUsers(
    companyId: string,
    updaterUserId: string,
    userIds: string[],
    updateData: { role?: string; isActive?: boolean }
  ) {
    try {
      // Validate updater has permission
      const updater = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: updaterUserId,
          company_id: companyId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!updater) {
        throw new Error('Only OWNER or ADMIN can bulk update users');
      }

      if (userIds.length > 10) {
        throw new Error('Maximum 10 users can be updated at once');
      }

      const results = await globalPrisma.user_companies.updateMany({
        where: {
          user_id: { in: userIds },
          company_id: companyId,
        },
        data: {
          ...(updateData.role && { role: updateData.role as any }),
          ...(updateData.isActive !== undefined && { is_active: updateData.isActive }),
          updated_at: new Date(),
        },
      });

      return {
        updated: results.count,
        message: `${results.count} users updated successfully`,
      };
    } catch (error: any) {
      console.error('Error bulk updating users:', error);
      throw new Error(`Failed to bulk update users: ${error.message}`);
    }
  }

  // Remove user from company
  async removeUser(userId: string, companyId: string, removerUserId: string) {
    try {
      // Validate remover has permission
      const remover = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: removerUserId,
          company_id: companyId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!remover) {
        throw new Error('Only OWNER or ADMIN can remove users');
      }

      // Cannot remove yourself
      if (userId === removerUserId) {
        throw new Error('You cannot remove yourself from the company');
      }

      // Check if user is the only OWNER
      const userCompany = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: userId,
          company_id: companyId,
        },
      });

      if (userCompany?.role === 'OWNER') {
        const ownerCount = await globalPrisma.user_companies.count({
          where: {
            company_id: companyId,
            role: 'OWNER',
          },
        });

        if (ownerCount === 1) {
          throw new Error('Cannot remove the only OWNER of the company');
        }
      }

      await globalPrisma.user_companies.delete({
        where: { id: userCompany!.id },
      });

      return {
        message: 'User removed from company successfully',
      };
    } catch (error: any) {
      console.error('Error removing user:', error);
      throw new Error(`Failed to remove user: ${error.message}`);
    }
  }

  // Bulk remove users
  async bulkRemoveUsers(companyId: string, removerUserId: string, userIds: string[]) {
    try {
      // Validate remover has permission
      const remover = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: removerUserId,
          company_id: companyId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!remover) {
        throw new Error('Only OWNER or ADMIN can remove users');
      }

      if (userIds.length > 10) {
        throw new Error('Maximum 10 users can be removed at once');
      }

      // Cannot remove yourself
      if (userIds.includes(removerUserId)) {
        throw new Error('You cannot remove yourself from the company');
      }

      const results = await globalPrisma.user_companies.deleteMany({
        where: {
          user_id: { in: userIds },
          company_id: companyId,
          role: { not: 'OWNER' }, // Prevent removing OWNERs via bulk action
        },
      });

      return {
        removed: results.count,
        message: `${results.count} users removed successfully`,
      };
    } catch (error: any) {
      console.error('Error bulk removing users:', error);
      throw new Error(`Failed to bulk remove users: ${error.message}`);
    }
  }

  // Helper: Generate random password for bulk invites
  private generateRandomPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Get user activity/role history (placeholder for future implementation)
  async getUserActivity(userId: string, companyId: string) {
    try {
      // For now, return sessions as activity
      const sessions = await globalPrisma.sessions.findMany({
        where: {
          user_id: userId,
          company_id: companyId,
        },
        orderBy: { created_at: 'desc' },
        take: 50,
      });

      return sessions.map((session) => ({
        id: session.id,
        type: session.is_active ? 'login' : 'logout',
        timestamp: session.updated_at,
        createdAt: session.created_at,
      }));
    } catch (error: any) {
      console.error('Error fetching user activity:', error);
      throw new Error(`Failed to fetch user activity: ${error.message}`);
    }
  }
}

export default new UserService();
