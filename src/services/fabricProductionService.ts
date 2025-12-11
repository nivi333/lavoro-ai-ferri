import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interfaces
export interface CreateFabricProductionData {
  fabricType: string;
  fabricName: string;
  composition: string;
  weightGsm: number;
  widthInches: number;
  color: string;
  pattern?: string;
  finishType?: string;
  quantityMeters: number;
  productionDate: Date;
  batchNumber: string;
  qualityGrade: string;
  locationId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateFabricProductionData {
  fabricType?: string;
  fabricName?: string;
  composition?: string;
  weightGsm?: number;
  widthInches?: number;
  color?: string;
  pattern?: string;
  finishType?: string;
  quantityMeters?: number;
  productionDate?: Date;
  batchNumber?: string;
  qualityGrade?: string;
  locationId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface FabricProductionFilters {
  fabricType?: string;
  qualityGrade?: string;
  locationId?: string;
  isActive?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

class FabricProductionService {
  // Generate next fabric ID for company
  private async generateFabricId(companyId: string): Promise<string> {
    const lastFabric = await prisma.fabric_production.findFirst({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      select: { fabric_id: true },
    });

    if (!lastFabric) {
      return 'FP001';
    }

    const lastNumber = parseInt(lastFabric.fabric_id.substring(2));
    const nextNumber = lastNumber + 1;
    return `FP${nextNumber.toString().padStart(3, '0')}`;
  }

  // Create fabric production record
  async createFabricProduction(companyId: string, data: CreateFabricProductionData) {
    try {
      // Validate company exists
      const company = await prisma.companies.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new Error('Company not found');
      }

      // Validate location if provided
      if (data.locationId) {
        const location = await prisma.company_locations.findFirst({
          where: {
            id: data.locationId,
            company_id: companyId,
          },
        });

        if (!location) {
          throw new Error('Location not found or does not belong to company');
        }
      }

      // Generate fabric ID
      const fabricId = await this.generateFabricId(companyId);

      // Create fabric production record
      const fabricProduction = await prisma.fabric_production.create({
        data: {
          fabric_id: fabricId,
          company_id: companyId,
          location_id: data.locationId,
          fabric_type: data.fabricType as any,
          fabric_name: data.fabricName,
          composition: data.composition,
          weight_gsm: data.weightGsm,
          width_inches: data.widthInches,
          color: data.color,
          pattern: data.pattern,
          finish_type: data.finishType,
          quantity_meters: data.quantityMeters,
          production_date: data.productionDate,
          batch_number: data.batchNumber,
          quality_grade: data.qualityGrade as any,
          notes: data.notes,
          is_active: data.isActive ?? true,
          updated_at: new Date(),
        } as any,
      });

      return {
        id: fabricProduction.id,
        fabricId: fabricProduction.fabric_id,
        companyId: fabricProduction.company_id,
        locationId: fabricProduction.location_id,
        fabricType: fabricProduction.fabric_type,
        fabricName: fabricProduction.fabric_name,
        composition: fabricProduction.composition,
        weightGsm: Number(fabricProduction.weight_gsm),
        widthInches: Number(fabricProduction.width_inches),
        color: fabricProduction.color,
        pattern: fabricProduction.pattern,
        finishType: fabricProduction.finish_type,
        quantityMeters: Number(fabricProduction.quantity_meters),
        productionDate: fabricProduction.production_date,
        batchNumber: fabricProduction.batch_number,
        qualityGrade: fabricProduction.quality_grade,
        notes: fabricProduction.notes,
        isActive: fabricProduction.is_active,
        createdAt: fabricProduction.created_at,
        updatedAt: fabricProduction.updated_at,
      };
    } catch (error: any) {
      throw new Error(`Failed to create fabric production: ${error.message}`);
    }
  }

  // Get fabric production records with filters
  async getFabricProductions(companyId: string, filters: FabricProductionFilters = {}) {
    try {
      const where: any = {
        company_id: companyId,
      };

      if (filters.fabricType) {
        where.fabric_type = filters.fabricType;
      }

      if (filters.qualityGrade) {
        where.quality_grade = filters.qualityGrade;
      }

      if (filters.locationId) {
        where.location_id = filters.locationId;
      }

      if (filters.isActive !== undefined) {
        where.is_active = filters.isActive;
      }

      if (filters.search) {
        where.OR = [
          { fabric_name: { contains: filters.search, mode: 'insensitive' } },
          { fabric_id: { contains: filters.search, mode: 'insensitive' } },
          { batch_number: { contains: filters.search, mode: 'insensitive' } },
          { color: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.startDate || filters.endDate) {
        where.production_date = {};
        if (filters.startDate) {
          where.production_date.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.production_date.lte = filters.endDate;
        }
      }

      const fabricProductions = await prisma.fabric_production.findMany({
        where,
        include: {
          location: {
            select: {
              id: true,
              name: true,
              location_id: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return fabricProductions.map(fp => ({
        id: fp.id,
        fabricId: fp.fabric_id,
        companyId: fp.company_id,
        locationId: fp.location_id,
        fabricType: fp.fabric_type,
        fabricName: fp.fabric_name,
        composition: fp.composition,
        weightGsm: Number(fp.weight_gsm),
        widthInches: Number(fp.width_inches),
        color: fp.color,
        pattern: fp.pattern,
        finishType: fp.finish_type,
        quantityMeters: Number(fp.quantity_meters),
        productionDate: fp.production_date,
        batchNumber: fp.batch_number,
        qualityGrade: fp.quality_grade,
        notes: fp.notes,
        isActive: fp.is_active,
        createdAt: fp.created_at,
        updatedAt: fp.updated_at,
        location: fp.location
          ? {
              id: fp.location.id,
              name: fp.location.name,
              locationId: fp.location.location_id,
            }
          : null,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch fabric productions: ${error.message}`);
    }
  }

  // Get fabric production by ID
  async getFabricProductionById(companyId: string, fabricId: string) {
    try {
      const fabricProduction = await prisma.fabric_production.findFirst({
        where: {
          fabric_id: fabricId,
          company_id: companyId,
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
              location_id: true,
            },
          },
        },
      });

      if (!fabricProduction) {
        throw new Error('Fabric production not found');
      }

      return {
        id: fabricProduction.id,
        fabricId: fabricProduction.fabric_id,
        companyId: fabricProduction.company_id,
        locationId: fabricProduction.location_id,
        fabricType: fabricProduction.fabric_type,
        fabricName: fabricProduction.fabric_name,
        composition: fabricProduction.composition,
        weightGsm: Number(fabricProduction.weight_gsm),
        widthInches: Number(fabricProduction.width_inches),
        color: fabricProduction.color,
        pattern: fabricProduction.pattern,
        finishType: fabricProduction.finish_type,
        quantityMeters: Number(fabricProduction.quantity_meters),
        productionDate: fabricProduction.production_date,
        batchNumber: fabricProduction.batch_number,
        qualityGrade: fabricProduction.quality_grade,
        notes: fabricProduction.notes,
        isActive: fabricProduction.is_active,
        createdAt: fabricProduction.created_at,
        updatedAt: fabricProduction.updated_at,
        location: fabricProduction.location
          ? {
              id: fabricProduction.location.id,
              name: fabricProduction.location.name,
              locationId: fabricProduction.location.location_id,
            }
          : null,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch fabric production: ${error.message}`);
    }
  }

  // Update fabric production
  async updateFabricProduction(
    companyId: string,
    fabricId: string,
    data: UpdateFabricProductionData
  ) {
    try {
      // Check if fabric production exists
      const existingFabric = await prisma.fabric_production.findFirst({
        where: {
          fabric_id: fabricId,
          company_id: companyId,
        },
      });

      if (!existingFabric) {
        throw new Error('Fabric production not found');
      }

      // Validate location if provided
      if (data.locationId) {
        const location = await prisma.company_locations.findFirst({
          where: {
            id: data.locationId,
            company_id: companyId,
          },
        });

        if (!location) {
          throw new Error('Location not found or does not belong to company');
        }
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date(),
      };

      if (data.fabricType !== undefined) updateData.fabric_type = data.fabricType;
      if (data.fabricName !== undefined) updateData.fabric_name = data.fabricName;
      if (data.composition !== undefined) updateData.composition = data.composition;
      if (data.weightGsm !== undefined) updateData.weight_gsm = data.weightGsm;
      if (data.widthInches !== undefined) updateData.width_inches = data.widthInches;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.pattern !== undefined) updateData.pattern = data.pattern;
      if (data.finishType !== undefined) updateData.finish_type = data.finishType;
      if (data.quantityMeters !== undefined) updateData.quantity_meters = data.quantityMeters;
      if (data.productionDate !== undefined) updateData.production_date = data.productionDate;
      if (data.batchNumber !== undefined) updateData.batch_number = data.batchNumber;
      if (data.qualityGrade !== undefined) updateData.quality_grade = data.qualityGrade;
      if (data.locationId !== undefined) updateData.location_id = data.locationId;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const fabricProduction = await prisma.fabric_production.update({
        where: { id: existingFabric.id },
        data: updateData,
        include: {
          location: {
            select: {
              id: true,
              name: true,
              location_id: true,
            },
          },
        },
      });

      return {
        id: fabricProduction.id,
        fabricId: fabricProduction.fabric_id,
        companyId: fabricProduction.company_id,
        locationId: fabricProduction.location_id,
        fabricType: fabricProduction.fabric_type,
        fabricName: fabricProduction.fabric_name,
        composition: fabricProduction.composition,
        weightGsm: Number(fabricProduction.weight_gsm),
        widthInches: Number(fabricProduction.width_inches),
        color: fabricProduction.color,
        pattern: fabricProduction.pattern,
        finishType: fabricProduction.finish_type,
        quantityMeters: Number(fabricProduction.quantity_meters),
        productionDate: fabricProduction.production_date,
        batchNumber: fabricProduction.batch_number,
        qualityGrade: fabricProduction.quality_grade,
        notes: fabricProduction.notes,
        isActive: fabricProduction.is_active,
        createdAt: fabricProduction.created_at,
        updatedAt: fabricProduction.updated_at,
        location: fabricProduction.location
          ? {
              id: fabricProduction.location.id,
              name: fabricProduction.location.name,
              locationId: fabricProduction.location.location_id,
            }
          : null,
      };
    } catch (error: any) {
      throw new Error(`Failed to update fabric production: ${error.message}`);
    }
  }

  // Delete fabric production
  async deleteFabricProduction(companyId: string, fabricId: string) {
    try {
      const existingFabric = await prisma.fabric_production.findFirst({
        where: {
          fabric_id: fabricId,
          company_id: companyId,
        },
      });

      if (!existingFabric) {
        throw new Error('Fabric production not found');
      }

      await prisma.fabric_production.delete({
        where: { id: existingFabric.id },
      });

      return { message: 'Fabric production deleted successfully' };
    } catch (error: any) {
      throw new Error(`Failed to delete fabric production: ${error.message}`);
    }
  }
}

export default new FabricProductionService();
