import { PrismaClient, FabricType, QualityGrade, YarnType, YarnProcess, DyeingProcess, GarmentType, ProductionStage, DesignCategory, DesignStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const globalPrisma = new PrismaClient();

// ============================================
// FABRIC PRODUCTION INTERFACES
// ============================================
interface CreateFabricData {
  fabricType: FabricType;
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
  qualityGrade: QualityGrade;
  imageUrl?: string;
  locationId?: string;
  notes?: string;
}

// ============================================
// YARN MANUFACTURING INTERFACES
// ============================================
interface CreateYarnData {
  yarnType: YarnType;
  yarnCount: string;
  twistPerInch?: number;
  ply: number;
  color: string;
  dyeLot?: string;
  quantityKg: number;
  productionDate: Date;
  batchNumber: string;
  processType: YarnProcess;
  qualityGrade: QualityGrade;
  imageUrl?: string;
  locationId?: string;
  notes?: string;
}

// ============================================
// DYEING & FINISHING INTERFACES
// ============================================
interface CreateDyeingData {
  processType: DyeingProcess;
  colorCode: string;
  colorName: string;
  dyeMethod?: string;
  recipeCode?: string;
  quantityMeters: number;
  processDate: Date;
  batchNumber: string;
  machineNumber?: string;
  temperatureC?: number;
  durationMinutes?: number;
  qualityCheck?: boolean;
  colorFastness?: string;
  shrinkagePercent?: number;
  imageUrl?: string;
  fabricId?: string;
  locationId?: string;
  notes?: string;
}

// ============================================
// GARMENT MANUFACTURING INTERFACES
// ============================================
interface CreateGarmentData {
  garmentType: GarmentType;
  styleNumber: string;
  size: string;
  color: string;
  fabricId?: string;
  quantity: number;
  productionStage: ProductionStage;
  cutDate?: Date;
  sewDate?: Date;
  finishDate?: Date;
  packDate?: Date;
  operatorName?: string;
  lineNumber?: string;
  qualityPassed?: boolean;
  defectCount?: number;
  imageUrl?: string;
  orderId?: string;
  locationId?: string;
  notes?: string;
}

// ============================================
// DESIGN & PATTERNS INTERFACES
// ============================================
interface CreateDesignData {
  designName: string;
  designCategory: DesignCategory;
  designerName?: string;
  season?: string;
  colorPalette?: string[];
  patternRepeat?: string;
  designFileUrl?: string;
  sampleImageUrl?: string;
  status: DesignStatus;
  notes?: string;
}

export class TextileService {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = globalPrisma) {
    this.prisma = client;
  }

  // ============================================
  // FABRIC PRODUCTION METHODS
  // ============================================

  private async generateFabricId(companyId: string): Promise<string> {
    const lastFabric = await this.prisma.fabric_production.findFirst({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      select: { fabric_id: true },
    });

    if (!lastFabric) {
      return 'FAB001';
    }

    const lastNumber = parseInt(lastFabric.fabric_id.substring(3));
    const nextNumber = lastNumber + 1;
    return `FAB${nextNumber.toString().padStart(3, '0')}`;
  }

  async createFabric(companyId: string, data: CreateFabricData) {
    const fabricId = await this.generateFabricId(companyId);

    const fabric = await this.prisma.fabric_production.create({
      data: {
        id: uuidv4(),
        fabric_id: fabricId,
        company_id: companyId,
        location_id: data.locationId,
        fabric_type: data.fabricType,
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
        quality_grade: data.qualityGrade,
        image_url: data.imageUrl,
        notes: data.notes,
        updated_at: new Date(),
      },
    });

    return this.mapFabricToDTO(fabric);
  }

  async getFabrics(companyId: string, filters?: any) {
    const where: any = { company_id: companyId };

    if (filters?.fabricType) where.fabric_type = filters.fabricType;
    if (filters?.qualityGrade) where.quality_grade = filters.qualityGrade;
    if (filters?.startDate && filters?.endDate) {
      where.production_date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    const fabrics = await this.prisma.fabric_production.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return fabrics.map(this.mapFabricToDTO);
  }

  async getFabricById(id: string, companyId: string) {
    const fabric = await this.prisma.fabric_production.findFirst({
      where: { id, company_id: companyId },
    });

    if (!fabric) {
      throw new Error('Fabric not found');
    }

    return this.mapFabricToDTO(fabric);
  }

  async updateFabric(id: string, companyId: string, data: Partial<CreateFabricData>) {
    const fabric = await this.prisma.fabric_production.update({
      where: { id },
      data: {
        fabric_type: data.fabricType,
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
        quality_grade: data.qualityGrade,
        image_url: data.imageUrl,
        location_id: data.locationId,
        notes: data.notes,
        updated_at: new Date(),
      },
    });

    return this.mapFabricToDTO(fabric);
  }

  async deleteFabric(id: string, companyId: string) {
    await this.prisma.fabric_production.delete({
      where: { id },
    });

    return { message: 'Fabric deleted successfully' };
  }

  private mapFabricToDTO(fabric: any) {
    return {
      id: fabric.id,
      fabricId: fabric.fabric_id,
      companyId: fabric.company_id,
      locationId: fabric.location_id,
      fabricType: fabric.fabric_type,
      fabricName: fabric.fabric_name,
      composition: fabric.composition,
      weightGsm: parseFloat(fabric.weight_gsm),
      widthInches: parseFloat(fabric.width_inches),
      color: fabric.color,
      pattern: fabric.pattern,
      finishType: fabric.finish_type,
      quantityMeters: parseFloat(fabric.quantity_meters),
      productionDate: fabric.production_date,
      batchNumber: fabric.batch_number,
      qualityGrade: fabric.quality_grade,
      imageUrl: fabric.image_url,
      notes: fabric.notes,
      isActive: fabric.is_active,
      createdAt: fabric.created_at,
      updatedAt: fabric.updated_at,
    };
  }

  // ============================================
  // YARN MANUFACTURING METHODS
  // ============================================

  private async generateYarnId(companyId: string): Promise<string> {
    const lastYarn = await this.prisma.yarn_manufacturing.findFirst({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      select: { yarn_id: true },
    });

    if (!lastYarn) {
      return 'YARN001';
    }

    const lastNumber = parseInt(lastYarn.yarn_id.substring(4));
    const nextNumber = lastNumber + 1;
    return `YARN${nextNumber.toString().padStart(3, '0')}`;
  }

  async createYarn(companyId: string, data: CreateYarnData) {
    const yarnId = await this.generateYarnId(companyId);

    const yarn = await this.prisma.yarn_manufacturing.create({
      data: {
        id: uuidv4(),
        yarn_id: yarnId,
        company_id: companyId,
        location_id: data.locationId,
        yarn_type: data.yarnType,
        yarn_count: data.yarnCount,
        twist_per_inch: data.twistPerInch,
        ply: data.ply,
        color: data.color,
        dye_lot: data.dyeLot,
        quantity_kg: data.quantityKg,
        production_date: data.productionDate,
        batch_number: data.batchNumber,
        process_type: data.processType,
        quality_grade: data.qualityGrade,
        image_url: data.imageUrl,
        notes: data.notes,
        updated_at: new Date(),
      },
    });

    return this.mapYarnToDTO(yarn);
  }

  async getYarns(companyId: string, filters?: any) {
    const where: any = { company_id: companyId };

    if (filters?.yarnType) where.yarn_type = filters.yarnType;
    if (filters?.processType) where.process_type = filters.processType;
    if (filters?.qualityGrade) where.quality_grade = filters.qualityGrade;

    const yarns = await this.prisma.yarn_manufacturing.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return yarns.map(this.mapYarnToDTO);
  }

  async getYarnById(id: string, companyId: string) {
    const yarn = await this.prisma.yarn_manufacturing.findFirst({
      where: { id, company_id: companyId },
    });

    if (!yarn) {
      throw new Error('Yarn not found');
    }

    return this.mapYarnToDTO(yarn);
  }

  async updateYarn(id: string, companyId: string, data: Partial<CreateYarnData>) {
    const yarn = await this.prisma.yarn_manufacturing.update({
      where: { id },
      data: {
        yarn_type: data.yarnType,
        yarn_count: data.yarnCount,
        twist_per_inch: data.twistPerInch,
        ply: data.ply,
        color: data.color,
        dye_lot: data.dyeLot,
        quantity_kg: data.quantityKg,
        production_date: data.productionDate,
        batch_number: data.batchNumber,
        process_type: data.processType,
        quality_grade: data.qualityGrade,
        image_url: data.imageUrl,
        location_id: data.locationId,
        notes: data.notes,
        updated_at: new Date(),
      },
    });

    return this.mapYarnToDTO(yarn);
  }

  async deleteYarn(id: string, companyId: string) {
    await this.prisma.yarn_manufacturing.delete({
      where: { id },
    });

    return { message: 'Yarn deleted successfully' };
  }

  private mapYarnToDTO(yarn: any) {
    return {
      id: yarn.id,
      yarnId: yarn.yarn_id,
      companyId: yarn.company_id,
      locationId: yarn.location_id,
      yarnType: yarn.yarn_type,
      yarnCount: yarn.yarn_count,
      twistPerInch: yarn.twist_per_inch ? parseFloat(yarn.twist_per_inch) : null,
      ply: yarn.ply,
      color: yarn.color,
      dyeLot: yarn.dye_lot,
      quantityKg: parseFloat(yarn.quantity_kg),
      productionDate: yarn.production_date,
      batchNumber: yarn.batch_number,
      processType: yarn.process_type,
      qualityGrade: yarn.quality_grade,
      imageUrl: yarn.image_url,
      notes: yarn.notes,
      isActive: yarn.is_active,
      createdAt: yarn.created_at,
      updatedAt: yarn.updated_at,
    };
  }

  // ============================================
  // DYEING & FINISHING METHODS
  // ============================================

  private async generateProcessId(companyId: string): Promise<string> {
    const lastProcess = await this.prisma.dyeing_finishing.findFirst({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      select: { process_id: true },
    });

    if (!lastProcess) {
      return 'DYE001';
    }

    const lastNumber = parseInt(lastProcess.process_id.substring(3));
    const nextNumber = lastNumber + 1;
    return `DYE${nextNumber.toString().padStart(3, '0')}`;
  }

  async createDyeing(companyId: string, data: CreateDyeingData) {
    const processId = await this.generateProcessId(companyId);

    const dyeing = await this.prisma.dyeing_finishing.create({
      data: {
        id: uuidv4(),
        process_id: processId,
        company_id: companyId,
        location_id: data.locationId,
        fabric_id: data.fabricId,
        process_type: data.processType,
        color_code: data.colorCode,
        color_name: data.colorName,
        dye_method: data.dyeMethod,
        recipe_code: data.recipeCode,
        quantity_meters: data.quantityMeters,
        process_date: data.processDate,
        batch_number: data.batchNumber,
        machine_number: data.machineNumber,
        temperature_c: data.temperatureC,
        duration_minutes: data.durationMinutes,
        quality_check: data.qualityCheck ?? false,
        color_fastness: data.colorFastness,
        shrinkage_percent: data.shrinkagePercent,
        image_url: data.imageUrl,
        notes: data.notes,
        updated_at: new Date(),
      },
    });

    return this.mapDyeingToDTO(dyeing);
  }

  async getDyeings(companyId: string, filters?: any) {
    const where: any = { company_id: companyId };

    if (filters?.processType) where.process_type = filters.processType;
    if (filters?.startDate && filters?.endDate) {
      where.process_date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    const dyeings = await this.prisma.dyeing_finishing.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return dyeings.map(this.mapDyeingToDTO);
  }

  async getDyeingById(id: string, companyId: string) {
    const dyeing = await this.prisma.dyeing_finishing.findFirst({
      where: { id, company_id: companyId },
    });

    if (!dyeing) {
      throw new Error('Dyeing process not found');
    }

    return this.mapDyeingToDTO(dyeing);
  }

  async updateDyeing(id: string, companyId: string, data: Partial<CreateDyeingData>) {
    const dyeing = await this.prisma.dyeing_finishing.update({
      where: { id },
      data: {
        process_type: data.processType,
        color_code: data.colorCode,
        color_name: data.colorName,
        dye_method: data.dyeMethod,
        recipe_code: data.recipeCode,
        quantity_meters: data.quantityMeters,
        process_date: data.processDate,
        batch_number: data.batchNumber,
        machine_number: data.machineNumber,
        temperature_c: data.temperatureC,
        duration_minutes: data.durationMinutes,
        quality_check: data.qualityCheck,
        color_fastness: data.colorFastness,
        shrinkage_percent: data.shrinkagePercent,
        image_url: data.imageUrl,
        fabric_id: data.fabricId,
        location_id: data.locationId,
        notes: data.notes,
        updated_at: new Date(),
      },
    });

    return this.mapDyeingToDTO(dyeing);
  }

  async deleteDyeing(id: string, companyId: string) {
    await this.prisma.dyeing_finishing.delete({
      where: { id },
    });

    return { message: 'Dyeing process deleted successfully' };
  }

  private mapDyeingToDTO(dyeing: any) {
    return {
      id: dyeing.id,
      processId: dyeing.process_id,
      companyId: dyeing.company_id,
      locationId: dyeing.location_id,
      fabricId: dyeing.fabric_id,
      processType: dyeing.process_type,
      colorCode: dyeing.color_code,
      colorName: dyeing.color_name,
      dyeMethod: dyeing.dye_method,
      recipeCode: dyeing.recipe_code,
      quantityMeters: parseFloat(dyeing.quantity_meters),
      processDate: dyeing.process_date,
      batchNumber: dyeing.batch_number,
      machineNumber: dyeing.machine_number,
      temperatureC: dyeing.temperature_c ? parseFloat(dyeing.temperature_c) : null,
      durationMinutes: dyeing.duration_minutes,
      qualityCheck: dyeing.quality_check,
      colorFastness: dyeing.color_fastness,
      shrinkagePercent: dyeing.shrinkage_percent ? parseFloat(dyeing.shrinkage_percent) : null,
      imageUrl: dyeing.image_url,
      notes: dyeing.notes,
      isActive: dyeing.is_active,
      createdAt: dyeing.created_at,
      updatedAt: dyeing.updated_at,
    };
  }

  // ============================================
  // GARMENT MANUFACTURING METHODS
  // ============================================

  private async generateGarmentId(companyId: string): Promise<string> {
    const lastGarment = await this.prisma.garment_manufacturing.findFirst({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      select: { garment_id: true },
    });

    if (!lastGarment) {
      return 'GARM001';
    }

    const lastNumber = parseInt(lastGarment.garment_id.substring(4));
    const nextNumber = lastNumber + 1;
    return `GARM${nextNumber.toString().padStart(3, '0')}`;
  }

  async createGarment(companyId: string, data: CreateGarmentData) {
    const garmentId = await this.generateGarmentId(companyId);

    const garment = await this.prisma.garment_manufacturing.create({
      data: {
        id: uuidv4(),
        garment_id: garmentId,
        company_id: companyId,
        location_id: data.locationId,
        order_id: data.orderId,
        garment_type: data.garmentType,
        style_number: data.styleNumber,
        size: data.size,
        color: data.color,
        fabric_id: data.fabricId,
        quantity: data.quantity,
        production_stage: data.productionStage,
        cut_date: data.cutDate,
        sew_date: data.sewDate,
        finish_date: data.finishDate,
        pack_date: data.packDate,
        operator_name: data.operatorName,
        line_number: data.lineNumber,
        quality_passed: data.qualityPassed ?? false,
        defect_count: data.defectCount ?? 0,
        image_url: data.imageUrl,
        notes: data.notes,
        updated_at: new Date(),
      },
    });

    return this.mapGarmentToDTO(garment);
  }

  async getGarments(companyId: string, filters?: any) {
    const where: any = { company_id: companyId };

    if (filters?.garmentType) where.garment_type = filters.garmentType;
    if (filters?.productionStage) where.production_stage = filters.productionStage;
    if (filters?.orderId) where.order_id = filters.orderId;

    const garments = await this.prisma.garment_manufacturing.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return garments.map(this.mapGarmentToDTO);
  }

  async getGarmentById(id: string, companyId: string) {
    const garment = await this.prisma.garment_manufacturing.findFirst({
      where: { id, company_id: companyId },
    });

    if (!garment) {
      throw new Error('Garment not found');
    }

    return this.mapGarmentToDTO(garment);
  }

  async updateGarment(id: string, companyId: string, data: Partial<CreateGarmentData>) {
    const garment = await this.prisma.garment_manufacturing.update({
      where: { id },
      data: {
        garment_type: data.garmentType,
        style_number: data.styleNumber,
        size: data.size,
        color: data.color,
        fabric_id: data.fabricId,
        quantity: data.quantity,
        production_stage: data.productionStage,
        cut_date: data.cutDate,
        sew_date: data.sewDate,
        finish_date: data.finishDate,
        pack_date: data.packDate,
        operator_name: data.operatorName,
        line_number: data.lineNumber,
        quality_passed: data.qualityPassed,
        defect_count: data.defectCount,
        image_url: data.imageUrl,
        order_id: data.orderId,
        location_id: data.locationId,
        notes: data.notes,
        updated_at: new Date(),
      },
    });

    return this.mapGarmentToDTO(garment);
  }

  async updateGarmentStage(id: string, companyId: string, stage: ProductionStage) {
    const garment = await this.prisma.garment_manufacturing.update({
      where: { id },
      data: {
        production_stage: stage,
        updated_at: new Date(),
      },
    });

    return this.mapGarmentToDTO(garment);
  }

  async deleteGarment(id: string, companyId: string) {
    await this.prisma.garment_manufacturing.delete({
      where: { id },
    });

    return { message: 'Garment deleted successfully' };
  }

  private mapGarmentToDTO(garment: any) {
    return {
      id: garment.id,
      garmentId: garment.garment_id,
      companyId: garment.company_id,
      locationId: garment.location_id,
      orderId: garment.order_id,
      garmentType: garment.garment_type,
      styleNumber: garment.style_number,
      size: garment.size,
      color: garment.color,
      fabricId: garment.fabric_id,
      quantity: garment.quantity,
      productionStage: garment.production_stage,
      cutDate: garment.cut_date,
      sewDate: garment.sew_date,
      finishDate: garment.finish_date,
      packDate: garment.pack_date,
      operatorName: garment.operator_name,
      lineNumber: garment.line_number,
      qualityPassed: garment.quality_passed,
      defectCount: garment.defect_count,
      imageUrl: garment.image_url,
      notes: garment.notes,
      isActive: garment.is_active,
      createdAt: garment.created_at,
      updatedAt: garment.updated_at,
    };
  }

  // ============================================
  // DESIGN & PATTERNS METHODS
  // ============================================

  private async generateDesignId(companyId: string): Promise<string> {
    const lastDesign = await this.prisma.design_patterns.findFirst({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      select: { design_id: true },
    });

    if (!lastDesign) {
      return 'DES001';
    }

    const lastNumber = parseInt(lastDesign.design_id.substring(3));
    const nextNumber = lastNumber + 1;
    return `DES${nextNumber.toString().padStart(3, '0')}`;
  }

  async createDesign(companyId: string, data: CreateDesignData) {
    const designId = await this.generateDesignId(companyId);

    const design = await this.prisma.design_patterns.create({
      data: {
        id: uuidv4(),
        design_id: designId,
        company_id: companyId,
        design_name: data.designName,
        design_category: data.designCategory,
        designer_name: data.designerName,
        season: data.season,
        color_palette: data.colorPalette || [],
        pattern_repeat: data.patternRepeat,
        design_file_url: data.designFileUrl,
        sample_image_url: data.sampleImageUrl,
        status: data.status,
        notes: data.notes,
        updated_at: new Date(),
      },
    });

    return this.mapDesignToDTO(design);
  }

  async getDesigns(companyId: string, filters?: any) {
    const where: any = { company_id: companyId };

    if (filters?.designCategory) where.design_category = filters.designCategory;
    if (filters?.status) where.status = filters.status;
    if (filters?.season) where.season = filters.season;

    const designs = await this.prisma.design_patterns.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return designs.map(this.mapDesignToDTO);
  }

  async getDesignById(id: string, companyId: string) {
    const design = await this.prisma.design_patterns.findFirst({
      where: { id, company_id: companyId },
    });

    if (!design) {
      throw new Error('Design not found');
    }

    return this.mapDesignToDTO(design);
  }

  async updateDesign(id: string, companyId: string, data: Partial<CreateDesignData>) {
    const design = await this.prisma.design_patterns.update({
      where: { id },
      data: {
        design_name: data.designName,
        design_category: data.designCategory,
        designer_name: data.designerName,
        season: data.season,
        color_palette: data.colorPalette,
        pattern_repeat: data.patternRepeat,
        design_file_url: data.designFileUrl,
        sample_image_url: data.sampleImageUrl,
        status: data.status,
        notes: data.notes,
        updated_at: new Date(),
      },
    });

    return this.mapDesignToDTO(design);
  }

  async updateDesignStatus(id: string, companyId: string, status: DesignStatus) {
    const design = await this.prisma.design_patterns.update({
      where: { id },
      data: {
        status,
        updated_at: new Date(),
      },
    });

    return this.mapDesignToDTO(design);
  }

  async deleteDesign(id: string, companyId: string) {
    await this.prisma.design_patterns.delete({
      where: { id },
    });

    return { message: 'Design deleted successfully' };
  }

  private mapDesignToDTO(design: any) {
    return {
      id: design.id,
      designId: design.design_id,
      companyId: design.company_id,
      designName: design.design_name,
      designCategory: design.design_category,
      designerName: design.designer_name,
      season: design.season,
      colorPalette: design.color_palette,
      patternRepeat: design.pattern_repeat,
      designFileUrl: design.design_file_url,
      sampleImageUrl: design.sample_image_url,
      status: design.status,
      notes: design.notes,
      createdAt: design.created_at,
      updatedAt: design.updated_at,
    };
  }
}

export const textileService = new TextileService();
