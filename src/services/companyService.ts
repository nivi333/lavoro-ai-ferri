import { PrismaClient as GlobalPrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { CreateCompanyData } from '../types';

const globalPrisma = new GlobalPrismaClient();

// Auto-generate Company ID (C001, C002, etc.)
async function generateCompanyId(): Promise<string> {
  try {
    const lastCompany = await globalPrisma.companies.findFirst({
      orderBy: { company_id: 'desc' },
      select: { company_id: true },
    });

    if (!lastCompany) {
      return 'C001';
    }

    const lastNumber = parseInt(lastCompany.company_id.replace('C', ''));
    const nextNumber = lastNumber + 1;
    return `C${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    // Fallback to timestamp-based ID if there's an error
    return `C${Date.now().toString().slice(-3)}`;
  }
}

// Auto-generate Location ID (L001, L002, etc.)
async function generateLocationId(): Promise<string> {
  try {
    const lastLocation = await globalPrisma.company_locations.findFirst({
      orderBy: { location_id: 'desc' },
      select: { location_id: true },
    });

    if (!lastLocation) {
      return 'L001';
    }

    const lastNumber = parseInt(lastLocation.location_id.replace('L', ''));
    const nextNumber = lastNumber + 1;
    return `L${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    // Fallback to timestamp-based ID if there's an error
    return `L${Date.now().toString().slice(-3)}`;
  }
}

class CompanyService {
  // Create company with user as owner (with transaction safety)
  async createCompany(userId: string, companyData: CreateCompanyData) {
    // Input validation
    if (!userId || !companyData.name || !companyData.industry) {
      throw new Error('Missing required fields: userId, name, and industry are required');
    }

    // Validate business rules
    if (companyData.name.length < 2 || companyData.name.length > 100) {
      throw new Error('Company name must be between 2 and 100 characters');
    }

    try {
      // Use database transaction for data consistency
      const result = await globalPrisma.$transaction(async (prisma) => {
        // Generate slug if not provided
        let baseSlug =
          companyData.slug && companyData.slug.trim().length > 0
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
          const exists = await prisma.companies.findUnique({ where: { slug: uniqueSlug } });
          if (!exists) break;
          uniqueSlug = `${baseSlug}-${counter++}`;
        }

        const companyId = await generateCompanyId();
        const locationId = await generateLocationId();
        const defaultLocation = companyData.defaultLocation || `${companyData.name} Headquarters`;

        const newCompany = await prisma.companies.create({
          data: {
            id: uuidv4(),
            company_id: companyId,
            name: companyData.name,
            slug: uniqueSlug,
            industry: companyData.industry,
            description: companyData.description,
            logo_url: companyData.logoUrl,
            website: companyData.website,
            tax_id: companyData.taxId,
            email: companyData.email,
            phone: companyData.phone,
            address_line_1: companyData.addressLine1,
            address_line_2: companyData.addressLine2,
            city: companyData.city,
            state: companyData.state,
            country: companyData.country,
            pincode: companyData.pincode,
            contact_info: companyData.contactInfo,
            established_date: companyData.establishedDate,
            business_type: companyData.businessType,
            certifications: companyData.certifications || [],
            default_location: defaultLocation,
            updated_at: new Date(),
          },
        });

        const ownerLink = await prisma.user_companies.create({
          data: {
            id: uuidv4(),
            user_id: userId,
            company_id: newCompany.id,
            role: 'OWNER',
            updated_at: new Date(),
          },
        });

        // Validation: Ensure user-company relationship was created successfully
        if (!ownerLink || !ownerLink.id) {
          throw new Error('Failed to create user-company relationship');
        }

        // Create headquarters location with same address and contact info as company
        const headquartersLocation = await prisma.company_locations.create({
          data: {
            id: uuidv4(),
            location_id: locationId,
            company_id: newCompany.id,
            name: defaultLocation,
            email: newCompany.email, // Use company's email
            phone: newCompany.phone, // Use company's phone
            country: newCompany.country || 'India', // Use company's country
            address_line_1: newCompany.address_line_1, // Use company's address
            address_line_2: newCompany.address_line_2, // Use company's address
            city: newCompany.city, // Use company's city
            state: newCompany.state, // Use company's state
            pincode: newCompany.pincode, // Use company's pincode
            is_default: true,
            is_headquarters: true,
            location_type: 'BRANCH',
            is_active: true,
            updated_at: new Date(),
          },
        });

        // CRITICAL VALIDATION: Ensure location was created successfully within transaction
        if (!headquartersLocation || !headquartersLocation.id) {
          throw new Error('Issue in Create default Location');
        }

        // Additional validation: Verify location exists within the same transaction
        const locationCheck = await prisma.company_locations.findUnique({
          where: { id: headquartersLocation.id },
        });

        if (!locationCheck) {
          throw new Error('Issue in Create default Location - Location verification failed');
        }

        return {
          id: newCompany.id,
          companyId: newCompany.company_id,
          name: newCompany.name,
          slug: newCompany.slug,
          industry: newCompany.industry,
          description: newCompany.description,
          logoUrl: newCompany.logo_url,
          website: newCompany.website,
          taxId: newCompany.tax_id,
          email: newCompany.email,
          phone: newCompany.phone,
          addressLine1: newCompany.address_line_1,
          addressLine2: newCompany.address_line_2,
          city: newCompany.city,
          state: newCompany.state,
          country: newCompany.country,
          pincode: newCompany.pincode,
          contactInfo: newCompany.contact_info,
          establishedDate: newCompany.established_date,
          businessType: newCompany.business_type,
          certifications: newCompany.certifications,
          defaultLocation: newCompany.default_location,
          role: ownerLink.role,
          joinedAt: ownerLink.created_at,
        };
      });

      // FINAL VALIDATION: Verify both company and location exist in database after transaction
      const [companyExists, locationExists] = await Promise.all([
        globalPrisma.companies.findUnique({ where: { id: result.id } }),
        globalPrisma.company_locations.findFirst({
          where: {
            company_id: result.id,
            is_headquarters: true,
            is_default: true,
          },
        }),
      ]);

      if (!companyExists) {
        throw new Error('Failed to create company - Company not found in database');
      }

      if (!locationExists) {
        // Clean up company if location wasn't created
        await globalPrisma.companies.delete({ where: { id: result.id } });
        await globalPrisma.user_companies.deleteMany({ where: { company_id: result.id } });
        throw new Error('Issue in Create default Location');
      }

      return result;
    } catch (error) {
      console.error('Error creating company:', error);
      if (error.message.includes('Issue in Create default Location')) {
        throw error; // Re-throw specific location error
      }
      throw new Error('Failed to create company');
    }
  }

  // Get all companies for a user with their roles
  async getUserCompanies(userId: string) {
    try {
      const userCompanies = await globalPrisma.user_companies.findMany({
        where: {
          user_id: userId,
          is_active: true,
        },
        include: {
          companies: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return userCompanies.map(uc => {
        const company = uc.companies;
        return {
          id: company.id,
          companyId: company.company_id,
          name: company.name,
          slug: company.slug,
          industry: company.industry,
          description: company.description,
          logoUrl: company.logo_url,
          website: company.website,
          taxId: company.tax_id,
          email: company.email,
          phone: company.phone,
          addressLine1: company.address_line_1,
          addressLine2: company.address_line_2,
          city: company.city,
          state: company.state,
          country: company.country,
          pincode: company.pincode,
          contactInfo: company.contact_info,
          establishedDate: company.established_date,
          businessType: company.business_type,
          certifications: company.certifications,
          defaultLocation: company.default_location,
          role: uc.role,
          joinedAt: uc.created_at,
        };
      });
    } catch (error) {
      console.error('Error fetching user companies:', error);
      throw new Error('Failed to fetch user companies');
    }
  }

  // Get company by ID with access validation
  async getCompanyById(userId: string, companyId: string) {
    try {
      const userCompany = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: userId,
          company_id: companyId,
          is_active: true,
        },
        include: {
          companies: true,
        },
      });

      if (!userCompany) {
        throw new Error('Access denied or company not found');
      }

      const company = userCompany.companies;

      return {
        id: company.id,
        companyId: company.company_id,
        name: company.name,
        slug: company.slug,
        industry: company.industry,
        description: company.description,
        logoUrl: company.logo_url,
        website: company.website,
        taxId: company.tax_id,
        email: company.email,
        phone: company.phone,
        addressLine1: company.address_line_1,
        addressLine2: company.address_line_2,
        city: company.city,
        state: company.state,
        country: company.country,
        pincode: company.pincode,
        contactInfo: company.contact_info,
        establishedDate: company.established_date,
        businessType: company.business_type,
        certifications: company.certifications,
        defaultLocation: company.default_location,
        role: userCompany.role,
        joinedAt: userCompany.created_at,
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
      const userCompany = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: userId,
          company_id: companyId,
          is_active: true,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!userCompany) {
        throw new Error('Access denied. Only OWNER or ADMIN can update company.');
      }

      // Map updateData (camelCase) to Prisma fields (snake_case)
      const data: any = {
        updated_at: new Date(),
      };

      if (updateData.name !== undefined) data.name = updateData.name;
      if ((updateData as any).slug !== undefined) data.slug = (updateData as any).slug;
      if (updateData.industry !== undefined) data.industry = updateData.industry;
      if (updateData.description !== undefined) data.description = updateData.description;
      if ((updateData as any).logoUrl !== undefined) data.logo_url = (updateData as any).logoUrl;
      if ((updateData as any).website !== undefined) data.website = (updateData as any).website;
      if ((updateData as any).taxId !== undefined) data.tax_id = (updateData as any).taxId;
      if ((updateData as any).email !== undefined) data.email = (updateData as any).email;
      if ((updateData as any).phone !== undefined) data.phone = (updateData as any).phone;

      const addr1 = (updateData as any).addressLine1 ?? (updateData as any).address1;
      if (addr1 !== undefined) data.address_line_1 = addr1;
      const addr2 = (updateData as any).addressLine2 ?? (updateData as any).address2;
      if (addr2 !== undefined) data.address_line_2 = addr2;

      if (updateData.city !== undefined) data.city = updateData.city;
      if (updateData.state !== undefined) data.state = updateData.state;
      if ((updateData as any).country !== undefined) data.country = (updateData as any).country;
      if (updateData.pincode !== undefined) data.pincode = updateData.pincode;
      if ((updateData as any).contactInfo !== undefined)
        data.contact_info = (updateData as any).contactInfo;
      if ((updateData as any).establishedDate !== undefined)
        data.established_date = (updateData as any).establishedDate;
      if ((updateData as any).businessType !== undefined)
        data.business_type = (updateData as any).businessType;
      if ((updateData as any).certifications !== undefined)
        data.certifications = (updateData as any).certifications;
      if ((updateData as any).defaultLocation !== undefined)
        data.default_location = (updateData as any).defaultLocation;
      if ((updateData as any).isActive !== undefined) data.is_active = (updateData as any).isActive;

      const updatedCompany = await globalPrisma.companies.update({
        where: { id: companyId },
        data,
      });

      return {
        id: updatedCompany.id,
        companyId: updatedCompany.company_id,
        name: updatedCompany.name,
        slug: updatedCompany.slug,
        industry: updatedCompany.industry,
        description: updatedCompany.description,
        logoUrl: updatedCompany.logo_url,
        website: updatedCompany.website,
        taxId: updatedCompany.tax_id,
        email: updatedCompany.email,
        phone: updatedCompany.phone,
        addressLine1: updatedCompany.address_line_1,
        addressLine2: updatedCompany.address_line_2,
        city: updatedCompany.city,
        state: updatedCompany.state,
        country: updatedCompany.country,
        pincode: updatedCompany.pincode,
        contactInfo: updatedCompany.contact_info,
        establishedDate: updatedCompany.established_date,
        businessType: updatedCompany.business_type,
        certifications: updatedCompany.certifications,
        defaultLocation: updatedCompany.default_location,
        isActive: updatedCompany.is_active,
        createdAt: updatedCompany.created_at,
        updatedAt: updatedCompany.updated_at,
      };
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  // Switch company context
  async switchCompany(userId: string, companyId: string) {
    try {
      const userCompany = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: userId,
          company_id: companyId,
          is_active: true,
        },
        include: {
          companies: {
            select: {
              id: true,
              company_id: true,
              name: true,
              slug: true,
              default_location: true,
            },
          },
        },
      });

      if (!userCompany) {
        throw new Error('Access denied to this company');
      }

      return {
        companyId: userCompany.companies.id,
        companyCode: userCompany.companies.company_id,
        name: userCompany.companies.name,
        slug: userCompany.companies.slug,
        role: userCompany.role,
        defaultLocation: userCompany.companies.default_location,
      };
    } catch (error) {
      console.error('Error switching company:', error);
      throw error;
    }
  }

  // Check slug availability
  async checkSlugAvailability(slug: string): Promise<boolean> {
    try {
      const existing = await globalPrisma.companies.findUnique({
        where: { slug },
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
      const userCompany = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: userId,
          company_id: companyId,
          is_active: true,
          role: 'OWNER',
        },
      });

      if (!userCompany) {
        throw new Error('Only company owners can delete companies');
      }

      await globalPrisma.companies.update({
        where: { id: companyId },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  // Invite user to company (OWNER/ADMIN only)
  async inviteUser(
    userId: string,
    companyId: string,
    email: string,
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  ) {
    try {
      // Check permissions
      const inviterUserCompany = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: userId,
          company_id: companyId,
          is_active: true,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!inviterUserCompany) {
        throw new Error('Access denied. Only OWNER or ADMIN can invite users.');
      }

      // Find user by email
      const userToInvite = await globalPrisma.users.findUnique({
        where: { email },
      });

      if (!userToInvite) {
        throw new Error('User with this email does not exist');
      }

      // Check if user is already in company
      const existingUserCompany = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: userToInvite.id,
          company_id: companyId,
        },
      });

      if (existingUserCompany) {
        throw new Error('User is already a member of this company');
      }

      // Create user-company relationship
      const newUserCompany = await globalPrisma.user_companies.create({
        data: {
          id: uuidv4(),
          user_id: userToInvite.id,
          company_id: companyId,
          role,
          updated_at: new Date(),
        },
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      return {
        id: newUserCompany.id,
        userId: newUserCompany.user_id,
        companyId: newUserCompany.company_id,
        role: newUserCompany.role,
        user: {
          id: newUserCompany.users.id,
          firstName: newUserCompany.users.first_name,
          lastName: newUserCompany.users.last_name,
          email: newUserCompany.users.email,
          phone: newUserCompany.users.phone,
        },
      };
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  }
}

export default new CompanyService();
