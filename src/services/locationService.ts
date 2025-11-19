import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { CreateLocationData, UpdateLocationData } from '../types';

const globalPrisma = new PrismaClient();

// Generate unique location ID (L001, L002, etc.)
export async function generateLocationId(companyId: string): Promise<string> {
  try {
    const lastLocation = await globalPrisma.company_locations.findFirst({
      where: { company_id: companyId },
      orderBy: { location_id: 'desc' },
      select: { location_id: true }
    });

    if (!lastLocation) {
      return 'L001';
    }

    // Extract numeric part and increment
    const lastNumber = parseInt(lastLocation.location_id.substring(1));
    const nextNumber = lastNumber + 1;
    return `L${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating location ID:', error);
    return `L${Date.now().toString().slice(-3)}`;
  }
}

// Validation schemas
export const createLocationSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().max(20).optional(),
  addressLine1: Joi.string().max(255).optional(),
  addressLine2: Joi.string().max(255).allow('').optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  pincode: Joi.string().max(20).optional(),
  locationType: Joi.string().valid('BRANCH', 'WAREHOUSE', 'FACTORY', 'STORE').default('BRANCH'),
  isHeadquarters: Joi.boolean().default(false),
});

export const updateLocationSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().max(20).optional(),
  addressLine1: Joi.string().max(255).optional(),
  addressLine2: Joi.string().max(255).allow('').optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  pincode: Joi.string().max(20).optional(),
  locationType: Joi.string().valid('BRANCH', 'WAREHOUSE', 'FACTORY', 'STORE').optional(),
  isHeadquarters: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
});

export class LocationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient = globalPrisma) {
    this.prisma = prisma;
  }

  async createLocation(companyId: string, data: CreateLocationData) {
    try {
      const locationId = await generateLocationId(companyId);

      // If this is the first location, make it default
      const existingLocations = await this.prisma.company_locations.findMany({
        where: { company_id: companyId },
        select: { id: true }
      });

      const isDefault = existingLocations.length === 0;

      // If marking as headquarters, ensure no other headquarters exists
      if (data.isHeadquarters) {
        await this.prisma.company_locations.updateMany({
          where: { 
            company_id: companyId, 
            is_headquarters: true 
          },
          data: { is_headquarters: false }
        });
      }

      const newLocation = await this.prisma.company_locations.create({
        data: {
          id: uuidv4(),
          location_id: locationId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          address_line_1: data.addressLine1,
          address_line_2: data.addressLine2,
          city: data.city,
          state: data.state,
          country: data.country,
          pincode: data.pincode,
          location_type: data.locationType || 'BRANCH',
          is_headquarters: data.isHeadquarters || false,
          is_default: isDefault,
          is_active: true,
          updated_at: new Date(),
          companies: {
            connect: { id: companyId },
          },
        },
        include: {
          companies: {
            select: {
              id: true,
              company_id: true,
              name: true,
            },
          },
        },
      });

      return newLocation;
    } catch (error) {
      console.error('Error creating location:', error);
      throw new Error('Failed to create location');
    }
  }

  async getLocations(companyId: string) {
    try {
      const locations = await this.prisma.company_locations.findMany({
        where: { 
          company_id: companyId,
          is_active: true 
        },
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          location_id: true,
          name: true,
          email: true,
          phone: true,
          address_line_1: true,
          address_line_2: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
          is_default: true,
          is_headquarters: true,
          location_type: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        }
      });

      return locations;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw new Error('Failed to fetch locations');
    }
  }

  async getLocationById(locationId: string, companyId: string) {
    try {
      const location = await this.prisma.company_locations.findFirst({
        where: { 
          id: locationId,
          company_id: companyId,
          is_active: true 
        },
        select: {
          id: true,
          location_id: true,
          name: true,
          email: true,
          phone: true,
          address_line_1: true,
          address_line_2: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
          is_default: true,
          is_headquarters: true,
          location_type: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        }
      });

      if (!location) {
        throw new Error('Location not found');
      }

      return location;
    } catch (error) {
      console.error('Error fetching location:', error);
      throw error;
    }
  }

  async updateLocation(locationId: string, companyId: string, data: UpdateLocationData) {
    try {
      // Check if location exists and belongs to company
      const existingLocation = await this.prisma.company_locations.findFirst({
        where: { 
          id: locationId,
          company_id: companyId, 
        }
      });

      if (!existingLocation) {
        throw new Error('Location not found');
      }

      // Prevent deactivating default location
      if (data.isActive === false && existingLocation.is_default) {
        throw new Error('Cannot deactivate default location');
      }

      // Prevent deactivating headquarters location
      if (data.isActive === false && existingLocation.is_headquarters) {
        throw new Error('Cannot deactivate headquarters location');
      }

      // If updating to headquarters, ensure no other headquarters exists
      if (data.isHeadquarters && !existingLocation.is_headquarters) {
        await this.prisma.company_locations.updateMany({
          where: { 
            company_id: companyId, 
            is_headquarters: true 
          },
          data: { is_headquarters: false }
        });
      }

      const updatedLocation = await this.prisma.company_locations.update({
        where: { id: locationId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.addressLine1 !== undefined && { address_line_1: data.addressLine1 }),
          ...(data.addressLine2 !== undefined && { address_line_2: data.addressLine2 }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.state !== undefined && { state: data.state }),
          ...(data.country !== undefined && { country: data.country }),
          ...(data.pincode !== undefined && { pincode: data.pincode }),
          ...(data.locationType && { location_type: data.locationType }),
          ...(data.isHeadquarters !== undefined && { is_headquarters: data.isHeadquarters }),
          ...(data.isActive !== undefined && { is_active: data.isActive }),
        },
        select: {
          id: true,
          location_id: true,
          name: true,
          email: true,
          phone: true,
          address_line_1: true,
          address_line_2: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
          is_default: true,
          is_headquarters: true,
          location_type: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        }
      });

      return updatedLocation;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  async deleteLocation(locationId: string, companyId: string) {
    try {
      // Check if location exists and belongs to company
      const existingLocation = await this.prisma.company_locations.findFirst({
        where: { 
          id: locationId,
          company_id: companyId, 
        }
      });

      if (!existingLocation) {
        throw new Error('Location not found');
      }

      // Prevent deleting default location
      if (existingLocation.is_default) {
        throw new Error('Cannot delete default location');
      }

      // Prevent deleting headquarters location
      if (existingLocation.is_headquarters) {
        throw new Error('Cannot delete headquarters location');
      }

      await this.prisma.company_locations.delete({
        where: { id: locationId }
      });

      return { success: true, message: 'Location deleted successfully' };
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  async setDefaultLocation(locationId: string, companyId: string) {
    try {
      // Check if location exists and belongs to company
      const location = await this.prisma.company_locations.findFirst({
        where: { 
          id: locationId,
          company_id: companyId,
          is_active: true 
        }
      });

      if (!location) {
        throw new Error('Location not found');
      }

      // Remove default status from all other locations
      await this.prisma.company_locations.updateMany({
        where: { 
          company_id: companyId,
          is_default: true 
        },
        data: { is_default: false }
      });

      // Set new default location
      const updatedLocation = await this.prisma.company_locations.update({
        where: { id: locationId },
        data: { is_default: true },
        select: {
          id: true,
          location_id: true,
          name: true,
          is_default: true,
          is_headquarters: true,
          location_type: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        }
      });

      return updatedLocation;
    } catch (error) {
      console.error('Error setting default location:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();
