import { PrismaClient as GlobalPrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { CreateCompanyData } from '../types';
import { industryToEnum, industryToDisplay } from '../utils/industryMapper';

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
    // CRITICAL: Validate userId (UUID format and existence)
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Missing required field: userId is required');
    }

    // Validate UUID format for userId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new Error('Invalid userId: Must be a valid UUID format');
    }

    // Verify user exists in database
    const userExists = await globalPrisma.users.findUnique({
      where: { id: userId },
      select: { id: true, is_active: true },
    });

    if (!userExists) {
      throw new Error('Invalid userId: User does not exist in database');
    }

    if (!userExists.is_active) {
      throw new Error('Invalid userId: User account is inactive');
    }

    // Input validation
    if (!companyData.name) {
      throw new Error('Missing required field: name is required');
    }

    // Validate business rules
    if (companyData.name.length < 2 || companyData.name.length > 100) {
      throw new Error('Company name must be between 2 and 100 characters');
    }

    // CRITICAL: Validate required address fields for default location creation
    if (!companyData.addressLine1 || !companyData.addressLine1.trim()) {
      throw new Error('Address Line 1 is required for creating default location');
    }
    if (!companyData.city || !companyData.city.trim()) {
      throw new Error('City is required for creating default location');
    }
    if (!companyData.state || !companyData.state.trim()) {
      throw new Error('State is required for creating default location');
    }
    if (!companyData.country || !companyData.country.trim()) {
      throw new Error('Country is required for creating default location');
    }
    if (!companyData.contactInfo) {
      throw new Error('Contact information is required for creating default location');
    }

    try {
      // Use database transaction for data consistency
      // Increased timeout to 15 seconds to handle large base64 image uploads
      const result = await globalPrisma.$transaction(
        async prisma => {
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

          // CRITICAL: Validate generated IDs before proceeding
          if (!companyId || typeof companyId !== 'string' || companyId.trim().length === 0) {
            throw new Error('Failed to generate companyId');
          }

          if (!locationId || typeof locationId !== 'string' || locationId.trim().length === 0) {
            throw new Error('Failed to generate locationId');
          }

          const tenantId = uuidv4(); // Generate UUID for company (this becomes tenantId)

          const newCompany = await prisma.companies.create({
            data: {
              id: tenantId,
              company_id: companyId,
              name: companyData.name,
              slug: uniqueSlug,
              industry: industryToEnum(companyData.industry) as any,
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
              is_active: companyData.isActive !== undefined ? companyData.isActive : true, // Default to true
              updated_at: new Date(),
            },
          });

          // CRITICAL: Validate company was created with valid tenantId (UUID)
          if (!newCompany || !newCompany.id) {
            throw new Error('Failed to create company - Missing company ID (tenantId)');
          }

          if (!uuidRegex.test(newCompany.id)) {
            throw new Error('Invalid tenantId: Company ID must be a valid UUID format');
          }

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

          // CRITICAL: Create headquarters location with same address and contact info as company
          // All required fields MUST be present (validated above)
          let headquartersLocation;
          try {
            const locationUuid = uuidv4(); // Generate UUID for location

            headquartersLocation = await prisma.company_locations.create({
              data: {
                id: locationUuid,
                location_id: locationId,
                company_id: newCompany.id,
                name: defaultLocation,
                // Required fields - copied from company
                address_line_1: newCompany.address_line_1!, // Required
                city: newCompany.city!, // Required
                state: newCompany.state!, // Required
                country: newCompany.country!, // Required
                contact_info: newCompany.contact_info, // Required (JSON)
                // Optional fields - copied from company
                address_line_2: newCompany.address_line_2,
                email: newCompany.email,
                phone: newCompany.phone,
                pincode: newCompany.pincode,
                // Location metadata
                is_default: true,
                is_headquarters: true,
                location_type: 'BRANCH',
                is_active: true,
                updated_at: new Date(),
              },
            });

            // CRITICAL VALIDATION: Ensure location was created successfully
            if (!headquartersLocation || !headquartersLocation.id) {
              throw new Error('Failed to create default location - Location object is invalid');
            }

            // Validate location UUID format
            if (!uuidRegex.test(headquartersLocation.id)) {
              throw new Error('Invalid location UUID: Location ID must be a valid UUID format');
            }

            // Validate locationId was set correctly
            if (
              !headquartersLocation.location_id ||
              headquartersLocation.location_id !== locationId
            ) {
              throw new Error('Failed to create default location - locationId mismatch');
            }
          } catch (locationError: any) {
            console.error('Location creation error:', locationError);
            // Throw specific error for location creation failure
            throw new Error(
              `Issue in Create default Location: ${locationError.message || 'Unknown error'}`
            );
          }

          // Additional validation: Verify location exists and has all required fields
          const locationCheck = await prisma.company_locations.findUnique({
            where: { id: headquartersLocation.id },
          });

          if (!locationCheck) {
            throw new Error('Issue in Create default Location - Location verification failed');
          }

          // Validate all required fields are present in created location
          if (
            !locationCheck.address_line_1 ||
            !locationCheck.city ||
            !locationCheck.state ||
            !locationCheck.country
          ) {
            throw new Error(
              'Issue in Create default Location - Required address fields are missing'
            );
          }

          return {
            id: newCompany.id,
            companyId: newCompany.company_id,
            name: newCompany.name,
            slug: newCompany.slug,
            industry: industryToDisplay(newCompany.industry),
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
        },
        {
          maxWait: 15000, // Maximum time to wait for a transaction slot (15 seconds)
          timeout: 15000, // Maximum time the transaction can run (15 seconds)
        }
      );

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
    } catch (error: any) {
      console.error('Error creating company:', error);

      // Re-throw specific location errors with clear messaging
      if (error.message && error.message.includes('Issue in Create default Location')) {
        throw error;
      }

      // Re-throw validation errors
      if (
        error.message &&
        (error.message.includes('required') || error.message.includes('Required'))
      ) {
        throw error;
      }

      // Generic error for other failures
      throw new Error(`Failed to create company: ${error.message || 'Unknown error'}`);
    }
  }

  // Get all companies for a user with their roles (including pending invitations)
  async getUserCompanies(userId: string) {
    try {
      // Get confirmed companies
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

      // Get pending invitations
      const pendingInvitations = await globalPrisma.$queryRaw`
        SELECT 
          ui.id as invitation_id,
          ui.role,
          ui.status,
          ui.created_at as invited_at,
          c.*
        FROM user_invitations ui
        JOIN companies c ON ui.company_id = c.id
        WHERE ui.user_id = ${userId} AND ui.status = 'PENDING'
        ORDER BY ui.created_at DESC
      `;

      // Map confirmed companies
      const confirmedCompanies = userCompanies.map(uc => {
        const company = uc.companies;
        return {
          id: company.id,
          companyId: company.company_id,
          name: company.name,
          slug: company.slug,
          industry: industryToDisplay(company.industry),
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
          isActive: company.is_active,
          role: uc.role,
          joinedAt: uc.created_at,
          status: 'CONFIRMED' as const,
        };
      });

      // Map pending invitations
      const pendingCompanies = (pendingInvitations as any[]).map(inv => ({
        id: inv.id,
        companyId: inv.company_id,
        name: inv.name,
        slug: inv.slug,
        industry: industryToDisplay(inv.industry),
        description: inv.description,
        logoUrl: inv.logo_url,
        website: inv.website,
        taxId: inv.tax_id,
        email: inv.email,
        phone: inv.phone,
        addressLine1: inv.address_line_1,
        addressLine2: inv.address_line_2,
        city: inv.city,
        state: inv.state,
        country: inv.country,
        pincode: inv.pincode,
        contactInfo: inv.contact_info,
        establishedDate: inv.established_date,
        businessType: inv.business_type,
        certifications: inv.certifications,
        defaultLocation: inv.default_location,
        isActive: inv.is_active,
        role: inv.role,
        joinedAt: inv.invited_at,
        status: 'PENDING' as const,
        invitationId: inv.invitation_id,
      }));

      // Combine and return both confirmed and pending
      return [...confirmedCompanies, ...pendingCompanies];
    } catch (error) {
      console.error('Error fetching user companies:', error);
      // Return empty array instead of throwing to prevent login issues
      return [];
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
        industry: industryToDisplay(company.industry),
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
      if (updateData.industry !== undefined) data.industry = industryToEnum(updateData.industry);
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
      // CRITICAL: Validate userId exists and is valid UUID
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new Error('Missing required field: userId is required for company selection');
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error('Invalid userId: Must be a valid UUID format');
      }

      // CRITICAL: Validate companyId (tenantId) exists and is valid UUID
      if (!companyId || typeof companyId !== 'string' || companyId.trim().length === 0) {
        throw new Error(
          'Missing required field: companyId (tenantId) is required for company selection'
        );
      }

      if (!uuidRegex.test(companyId)) {
        throw new Error('Invalid companyId: Must be a valid UUID format');
      }

      // Verify user exists and is active
      const user = await globalPrisma.users.findUnique({
        where: { id: userId },
        select: { id: true, is_active: true },
      });

      if (!user) {
        throw new Error('Invalid userId: User does not exist');
      }

      if (!user.is_active) {
        throw new Error('Invalid userId: User account is inactive');
      }

      // Verify company exists and is active
      const company = await globalPrisma.companies.findUnique({
        where: { id: companyId },
        select: { id: true, company_id: true, is_active: true },
      });

      if (!company) {
        throw new Error('Invalid companyId: Company does not exist');
      }

      if (!company.is_active) {
        throw new Error('Invalid companyId: Company is inactive');
      }

      // CRITICAL: Verify user-company relationship exists
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
        throw new Error('Access denied: User does not have access to this company');
      }

      // CRITICAL: Verify default location exists for this company
      const defaultLocation = await globalPrisma.company_locations.findFirst({
        where: {
          company_id: companyId,
          is_default: true,
          is_headquarters: true,
          is_active: true,
        },
        select: {
          id: true,
          location_id: true,
          name: true,
        },
      });

      if (!defaultLocation) {
        throw new Error('Invalid company state: Default location does not exist for this company');
      }

      // CRITICAL: Validate locationId exists
      if (!defaultLocation.location_id || defaultLocation.location_id.trim().length === 0) {
        throw new Error('Invalid company state: Default location missing locationId');
      }

      return {
        companyId: userCompany.companies.id,
        companyCode: userCompany.companies.company_id,
        name: userCompany.companies.name,
        slug: userCompany.companies.slug,
        role: userCompany.role,
        defaultLocation: userCompany.companies.default_location,
        locationId: defaultLocation.location_id, // Include locationId in response
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

  // Invite user to company (OWNER/ADMIN only) - Creates invitation, not direct membership
  async inviteUser(
    userId: string,
    companyId: string,
    emailOrPhone: string,
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
    locationId?: string
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

      // Find user by email or phone
      const userToInvite = await globalPrisma.users.findFirst({
        where: {
          OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
        },
      });

      if (!userToInvite) {
        throw new Error('User does not exist in the system');
      }

      // Check if user already has a pending invitation
      const existingInvitation = await globalPrisma.$queryRaw`
        SELECT * FROM user_invitations 
        WHERE user_id = ${userToInvite.id} 
        AND company_id = ${companyId} 
        AND status = 'PENDING'
      `;

      if (Array.isArray(existingInvitation) && existingInvitation.length > 0) {
        throw new Error('User already has a pending invitation to this company');
      }

      // Check if user is already a member of this company
      const existingUserCompany = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: userToInvite.id,
          company_id: companyId,
        },
      });

      if (existingUserCompany) {
        throw new Error('User is already a member of this company');
      }

      // Create invitation (not direct membership)
      const invitationId = uuidv4();
      await globalPrisma.$executeRaw`
        INSERT INTO user_invitations (id, user_id, company_id, invited_by, role, location_id, status, created_at, updated_at)
        VALUES (${invitationId}, ${userToInvite.id}, ${companyId}, ${userId}, ${role}, ${locationId || null}, 'PENDING', NOW(), NOW())
      `;

      return {
        id: invitationId,
        userId: userToInvite.id,
        companyId: companyId,
        role: role,
        status: 'PENDING',
        user: {
          id: userToInvite.id,
          firstName: userToInvite.first_name,
          lastName: userToInvite.last_name,
          email: userToInvite.email,
          phone: userToInvite.phone,
        },
      };
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  }

  // Accept invitation and add user to company
  async acceptInvitation(userId: string, invitationId: string) {
    try {
      // Find the invitation
      const invitation = await globalPrisma.$queryRaw`
        SELECT * FROM user_invitations 
        WHERE id = ${invitationId} 
        AND user_id = ${userId} 
        AND status = 'PENDING'
      `;

      if (!Array.isArray(invitation) || invitation.length === 0) {
        throw new Error('Invitation not found or already processed');
      }

      const inv = invitation[0] as any;

      // Check if user is already a member of this company
      const existingUserCompany = await globalPrisma.user_companies.findFirst({
        where: {
          user_id: userId,
          company_id: inv.company_id,
        },
      });

      if (existingUserCompany) {
        throw new Error('User is already a member of this company');
      }

      // Create user_companies entry and update invitation status in transaction
      await globalPrisma.$transaction(async prisma => {
        // Add user to company
        await prisma.$executeRaw`
          INSERT INTO user_companies (id, user_id, company_id, role, is_active, created_at, updated_at)
          VALUES (${uuidv4()}, ${userId}, ${inv.company_id}, ${inv.role}::"Role", true, NOW(), NOW())
        `;

        // Update invitation status to ACCEPTED
        await prisma.$executeRaw`
          UPDATE user_invitations 
          SET status = 'ACCEPTED', updated_at = NOW()
          WHERE id = ${invitationId}
        `;
      });

      return {
        companyId: inv.company_id,
        role: inv.role,
        status: 'ACCEPTED',
      };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }
}

export default new CompanyService();
