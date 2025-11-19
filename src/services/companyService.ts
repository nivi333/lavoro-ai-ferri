import { PrismaClient as GlobalPrismaClient } from '@prisma/client';
import { CreateCompanyData } from '../types';

const globalPrisma = new GlobalPrismaClient();

// Auto-generate Company ID (C001, C002, etc.)
async function generateCompanyId(): Promise<string> {
  try {
    const lastCompany = await globalPrisma.company.findFirst({
      orderBy: { companyId: 'desc' },
      select: { companyId: true }
    });

    if (!lastCompany) {
      return 'C001';
    }

    const lastNumber = parseInt(lastCompany.companyId.replace('C', ''));
    const nextNumber = lastNumber + 1;
    return `C${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    // Fallback to timestamp-based ID if there's an error
    return `C${Date.now().toString().slice(-3)}`;
  }
}

class CompanyService {
  // Create company with user as owner
  async createCompany(userId: string, companyData: CreateCompanyData) {
    try {
      // Generate slug if not provided
      let baseSlug = companyData.slug && companyData.slug.trim().length > 0
        ? companyData.slug.trim().toLowerCase()
        : companyData.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

      // Ensure uniqueness of slug
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (true) {
        const exists = await globalPrisma.company.findUnique({ where: { slug: uniqueSlug } });
        if (!exists) break;
        uniqueSlug = `${baseSlug}-${counter++}`;
      }

      const companyId = await generateCompanyId();
      const defaultLocation = companyData.defaultLocationName || `${companyData.name} Headquarters`;

      const newCompany = await globalPrisma.company.create({
        data: {
          companyId,
          name: companyData.name,
          slug: uniqueSlug,
          industry: companyData.industry,
          description: companyData.description,
          logoUrl: companyData.logoUrl,
          website: companyData.website,
          taxId: companyData.taxId,
          email: companyData.email,
          phone: companyData.phone,
          addressLine1: companyData.addressLine1,
          addressLine2: companyData.addressLine2,
          city: companyData.city,
          state: companyData.state,
          country: companyData.country,
          pincode: companyData.pincode,
          contactInfo: companyData.contactInfo,
          establishedDate: companyData.establishedDate,
          businessType: companyData.businessType,
          certifications: companyData.certifications || [],
          defaultLocation,
          locations: {
            create: {
              locationId: 'L001',
              name: defaultLocation,
              isDefault: true,
              isHeadquarters: true,
              locationType: 'BRANCH',
            },
          },
          userCompanies: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
        include: {
          locations: {
            where: { isDefault: true },
            select: {
              name: true,
            },
          },
          userCompanies: {
            where: { userId },
            select: {
              role: true,
              createdAt: true,
            },
          },
        },
      }) as any;

      return {
        ...newCompany,
        defaultLocation: newCompany.locations[0]?.name,
        role: newCompany.userCompanies[0]?.role,
        joinedAt: newCompany.userCompanies[0]?.createdAt,
      };
    } catch (error) {
      console.error('Error creating company:', error);
      throw new Error('Failed to create company');
    }
  }

  // Get all companies for a user with their roles
  async getUserCompanies(userId: string) {
    try {
      const userCompanies = await globalPrisma.userCompany.findMany({
        where: {
          userId,
          isActive: true,
        },
        include: {
          company: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return userCompanies.map(uc => ({
        ...uc.company,
        role: uc.role,
        joinedAt: uc.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching user companies:', error);
      throw new Error('Failed to fetch user companies');
    }
  }

  // Get company by ID with access validation
  async getCompanyById(userId: string, companyId: string) {
    try {
      const userCompany = await globalPrisma.userCompany.findFirst({
        where: {
          userId,
          companyId,
          isActive: true,
        },
        include: {
          company: true,
        },
      });

      if (!userCompany) {
        throw new Error('Access denied or company not found');
      }

      return {
        ...userCompany.company,
        role: userCompany.role,
        joinedAt: userCompany.createdAt,
      };
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  }

  // Update company (OWNER/ADMIN only)
  async updateCompany(userId: string, companyId: string, updateData: Partial<CreateCompanyData>) {
    try {
      // Check user permissions
      const userCompany = await globalPrisma.userCompany.findFirst({
        where: {
          userId,
          companyId,
          isActive: true,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!userCompany) {
        throw new Error('Access denied. Only OWNER or ADMIN can update company.');
      }

      // Update company
      const updatedCompany = await globalPrisma.company.update({
        where: { id: companyId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      return updatedCompany;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  // Switch company context
  async switchCompany(userId: string, companyId: string) {
    try {
      const userCompany = await globalPrisma.userCompany.findFirst({
        where: {
          userId,
          companyId,
          isActive: true,
        },
        include: {
          company: {
            select: {
              id: true,
              companyId: true,
              name: true,
              slug: true,
              defaultLocation: true,
            }
          },
        },
      }) as any;

      if (!userCompany) {
        throw new Error('Access denied to this company');
      }

      return {
        companyId: userCompany.company.id,
        companyCode: userCompany.company.companyId,
        name: userCompany.company.name,
        slug: userCompany.company.slug,
        role: userCompany.role,
        defaultLocation: userCompany.company.defaultLocation,
      };
    } catch (error) {
      console.error('Error switching company:', error);
      throw error;
    }
  }

  // Check slug availability
  async checkSlugAvailability(slug: string): Promise<boolean> {
    try {
      const existing = await globalPrisma.company.findUnique({
        where: { slug }
      });
      
      return !existing;
    } catch (error) {
      console.error('Error checking slug availability:', error);
      throw error;
    }
  }

  // Delete company (soft delete, OWNER only)
  async deleteCompany(userId: string, companyId: string): Promise<void> {
    try {
      const userCompany = await globalPrisma.userCompany.findFirst({
        where: {
          userId,
          companyId,
          isActive: true,
          role: 'OWNER',
        },
      });

      if (!userCompany) {
        throw new Error('Only company owners can delete companies');
      }

      await globalPrisma.company.update({
        where: { id: companyId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        }
      });
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  // Invite user to company (OWNER/ADMIN only)
  async inviteUser(userId: string, companyId: string, email: string, role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE') {
    try {
      // Check permissions
      const inviterUserCompany = await globalPrisma.userCompany.findFirst({
        where: {
          userId,
          companyId,
          isActive: true,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!inviterUserCompany) {
        throw new Error('Access denied. Only OWNER or ADMIN can invite users.');
      }

      // Find user by email
      const userToInvite = await globalPrisma.user.findUnique({
        where: { email }
      });

      if (!userToInvite) {
        throw new Error('User with this email does not exist');
      }

      // Check if user is already in company
      const existingUserCompany = await globalPrisma.userCompany.findFirst({
        where: {
          userId: userToInvite.id,
          companyId,
        },
      });

      if (existingUserCompany) {
        throw new Error('User is already a member of this company');
      }

      // Create user-company relationship
      const newUserCompany = await globalPrisma.userCompany.create({
        data: {
          userId: userToInvite.id,
          companyId,
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      return newUserCompany;
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  }
}

export default new CompanyService();
