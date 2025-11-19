import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { CreateLocationData, UpdateLocationData } from '../types';

const globalPrisma = new PrismaClient();

// Generate unique location ID (L001, L002, etc.)
export async function generateLocationId(companyId: string): Promise<string> {
  try {
    const lastLocation = await globalPrisma.companyLocation.findFirst({
      where: { companyId },
      orderBy: { locationId: 'desc' },
      select: { locationId: true }
    });

    if (!lastLocation) {
      return 'L001';
    }

    // Extract numeric part and increment
    const lastNumber = parseInt(lastLocation.locationId.substring(1));
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
      const existingLocations = await this.prisma.companyLocation.findMany({
        where: { companyId },
        select: { id: true }
      });

      const isDefault = existingLocations.length === 0;

      // If marking as headquarters, ensure no other headquarters exists
      if (data.isHeadquarters) {
        await this.prisma.companyLocation.updateMany({
          where: { 
            companyId, 
            isHeadquarters: true 
          },
          data: { isHeadquarters: false }
        });
      }

      const newLocation = await this.prisma.companyLocation.create({
        data: {
          locationId,
          companyId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          country: data.country,
          pincode: data.pincode,
          locationType: data.locationType || 'BRANCH',
          isHeadquarters: data.isHeadquarters || false,
          isDefault,
          isActive: true,
        },
        include: {
          company: {
            select: {
              id: true,
              companyId: true,
              name: true,
            }
          }
        }
      });

      return newLocation;
    } catch (error) {
      console.error('Error creating location:', error);
      throw new Error('Failed to create location');
    }
  }

  async getLocations(companyId: string) {
    try {
      const locations = await this.prisma.companyLocation.findMany({
        where: { 
          companyId,
          isActive: true 
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          locationId: true,
          name: true,
          email: true,
          phone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
          isDefault: true,
          isHeadquarters: true,
          locationType: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
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
      const location = await this.prisma.companyLocation.findFirst({
        where: { 
          id: locationId,
          companyId,
          isActive: true 
        },
        select: {
          id: true,
          locationId: true,
          name: true,
          email: true,
          phone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
          isDefault: true,
          isHeadquarters: true,
          locationType: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
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
      const existingLocation = await this.prisma.companyLocation.findFirst({
        where: { 
          id: locationId,
          companyId 
        }
      });

      if (!existingLocation) {
        throw new Error('Location not found');
      }

      // Prevent deactivating default location
      if (data.isActive === false && existingLocation.isDefault) {
        throw new Error('Cannot deactivate default location');
      }

      // Prevent deactivating headquarters location
      if (data.isActive === false && existingLocation.isHeadquarters) {
        throw new Error('Cannot deactivate headquarters location');
      }

      // If updating to headquarters, ensure no other headquarters exists
      if (data.isHeadquarters && !existingLocation.isHeadquarters) {
        await this.prisma.companyLocation.updateMany({
          where: { 
            companyId, 
            isHeadquarters: true 
          },
          data: { isHeadquarters: false }
        });
      }

      const updatedLocation = await this.prisma.companyLocation.update({
        where: { id: locationId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.addressLine1 !== undefined && { addressLine1: data.addressLine1 }),
          ...(data.addressLine2 !== undefined && { addressLine2: data.addressLine2 }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.state !== undefined && { state: data.state }),
          ...(data.country !== undefined && { country: data.country }),
          ...(data.pincode !== undefined && { pincode: data.pincode }),
          ...(data.locationType && { locationType: data.locationType }),
          ...(data.isHeadquarters !== undefined && { isHeadquarters: data.isHeadquarters }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        select: {
          id: true,
          locationId: true,
          name: true,
          email: true,
          phone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
          isDefault: true,
          isHeadquarters: true,
          locationType: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
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
      const existingLocation = await this.prisma.companyLocation.findFirst({
        where: { 
          id: locationId,
          companyId 
        }
      });

      if (!existingLocation) {
        throw new Error('Location not found');
      }

      // Prevent deleting default location
      if (existingLocation.isDefault) {
        throw new Error('Cannot delete default location');
      }

      // Prevent deleting headquarters location
      if (existingLocation.isHeadquarters) {
        throw new Error('Cannot delete headquarters location');
      }

      await this.prisma.companyLocation.delete({
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
      const location = await this.prisma.companyLocation.findFirst({
        where: { 
          id: locationId,
          companyId,
          isActive: true 
        }
      });

      if (!location) {
        throw new Error('Location not found');
      }

      // Remove default status from all other locations
      await this.prisma.companyLocation.updateMany({
        where: { 
          companyId,
          isDefault: true 
        },
        data: { isDefault: false }
      });

      // Set new default location
      const updatedLocation = await this.prisma.companyLocation.update({
        where: { id: locationId },
        data: { isDefault: true },
        select: {
          id: true,
          locationId: true,
          name: true,
          isDefault: true,
          isHeadquarters: true,
          locationType: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
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
