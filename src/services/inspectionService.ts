import { PrismaClient, InspectionType, InspectionStatus, EvaluationType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const globalPrisma = new PrismaClient();

// Interfaces for Inspection System
export interface CreateInspectionData {
  inspectionType: InspectionType;
  referenceType: string;
  referenceId: string;
  locationId?: string;
  inspectorId?: string;
  inspectorName?: string;
  templateId?: string;
  scheduledDate?: Date;
  inspectionDate?: Date;
  nextInspectionDate?: Date;
  status?: InspectionStatus;
  qualityScore?: number;
  inspectorNotes?: string;
  recommendations?: string;
  isActive?: boolean;
}

export interface UpdateInspectionData {
  status?: InspectionStatus;
  startedAt?: Date;
  completedAt?: Date;
  overallResult?: string;
  qualityScore?: number;
  inspectorNotes?: string;
  recommendations?: string;
  inspectorName?: string;
  inspectionDate?: Date;
  nextInspectionDate?: Date;
  isActive?: boolean;
}

export interface CreateInspectionTemplateData {
  name: string;
  description?: string;
  category: string;
  applicableTo: string[];
  passingScore?: number;
  checkpoints: CreateTemplateCheckpointData[];
}

export interface CreateTemplateCheckpointData {
  name: string;
  description?: string;
  evaluationType: EvaluationType;
  isRequired?: boolean;
  orderIndex: number;
}

export interface CreateInspectionCheckpointData {
  name: string;
  description?: string;
  evaluationType: EvaluationType;
  result?: string;
  notes?: string;
  photos?: string[];
  orderIndex: number;
}

export interface ListInspectionFilters {
  inspectionType?: InspectionType;
  status?: InspectionStatus;
  inspectorId?: string;
  referenceType?: string;
  referenceId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface InspectionMetricsData {
  periodStart: Date;
  periodEnd: Date;
}

export class InspectionService {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = globalPrisma) {
    this.prisma = client;
  }

  // Generate inspection number (INS001, INS002, etc.)
  private async generateInspectionNumber(companyId: string): Promise<string> {
    const lastInspection = await this.prisma.quality_inspections.findFirst({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      select: { inspection_number: true },
    });

    if (!lastInspection) {
      return 'INS001';
    }

    const lastNumber = parseInt(lastInspection.inspection_number.substring(3));
    const nextNumber = lastNumber + 1;
    return `INS${nextNumber.toString().padStart(3, '0')}`;
  }

  // Create Inspection
  async createInspection(companyId: string, data: CreateInspectionData) {
    const inspectionNumber = await this.generateInspectionNumber(companyId);
    const now = new Date();

    const inspection = await this.prisma.quality_inspections.create({
      data: {
        id: uuidv4(),
        company_id: companyId,
        inspection_number: inspectionNumber,
        inspection_type: data.inspectionType,
        reference_type: data.referenceType,
        reference_id: data.referenceId,
        location_id: data.locationId || null,
        inspector_id: data.inspectorId || null,
        inspector_name: data.inspectorName || null,
        template_id: data.templateId || null,
        scheduled_date: data.scheduledDate || null,
        inspection_date: data.inspectionDate || null,
        next_inspection_date: data.nextInspectionDate || null,
        status: data.status || InspectionStatus.PENDING,
        quality_score: data.qualityScore || null,
        inspector_notes: data.inspectorNotes || null,
        recommendations: data.recommendations || null,
        is_active: data.isActive !== undefined ? data.isActive : true,
        created_at: now,
        updated_at: now,
      },
      include: {
        inspector: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            checkpoints: true,
          },
        },
      },
    });

    // If template is provided, create checkpoints from template
    if (inspection.template) {
      const checkpoints = inspection.template.checkpoints.map((cp, index) => ({
        id: uuidv4(),
        inspection_id: inspection.id,
        name: cp.name,
        description: cp.description,
        evaluation_type: cp.evaluation_type,
        order_index: cp.order_index,
        created_at: now,
      }));

      await this.prisma.inspection_checkpoints.createMany({
        data: checkpoints,
      });
    }

    return {
      id: inspection.id,
      inspectionNumber: inspection.inspection_number,
      companyId: inspection.company_id,
      inspectionType: inspection.inspection_type,
      referenceType: inspection.reference_type,
      referenceId: inspection.reference_id,
      locationId: inspection.location_id || undefined,
      inspector: inspection.inspector ? {
        id: inspection.inspector.id,
        firstName: inspection.inspector.first_name,
        lastName: inspection.inspector.last_name,
        email: inspection.inspector.email || '',
      } : null,
      inspectorName: inspection.inspector_name || undefined,
      templateId: inspection.template_id || undefined,
      scheduledDate: inspection.scheduled_date || undefined,
      inspectionDate: inspection.inspection_date || undefined,
      nextInspectionDate: inspection.next_inspection_date || undefined,
      status: inspection.status,
      qualityScore: inspection.quality_score || undefined,
      inspectorNotes: inspection.inspector_notes || undefined,
      recommendations: inspection.recommendations || undefined,
      isActive: inspection.is_active,
      createdAt: inspection.created_at,
      updatedAt: inspection.updated_at,
    };
  }

  // Get Inspections
  async getInspections(companyId: string, filters?: ListInspectionFilters) {
    const where: any = { company_id: companyId };

    if (filters?.inspectionType) {
      where.inspection_type = filters.inspectionType;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.inspectorId) {
      where.inspector_id = filters.inspectorId;
    }

    if (filters?.referenceType) {
      where.reference_type = filters.referenceType;
    }

    if (filters?.referenceId) {
      where.reference_id = filters.referenceId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.scheduled_date = {};
      if (filters.startDate) {
        where.scheduled_date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.scheduled_date.lte = filters.endDate;
      }
    }

    if (filters?.search) {
      where.OR = [
        { inspection_number: { contains: filters.search, mode: 'insensitive' } },
        { reference_id: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const inspections = await this.prisma.quality_inspections.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        inspector: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar_url: true,
          },
        },
        checkpoints: {
          select: {
            id: true,
            result: true,
          },
        },
      },
    });

    return inspections.map(inspection => ({
      id: inspection.id,
      inspectionNumber: inspection.inspection_number,
      inspectionType: inspection.inspection_type,
      referenceType: inspection.reference_type,
      referenceId: inspection.reference_id,
      inspector: inspection.inspector ? {
        id: inspection.inspector.id,
        firstName: inspection.inspector.first_name,
        lastName: inspection.inspector.last_name,
        avatarUrl: inspection.inspector.avatar_url || undefined,
      } : null,
      inspectorName: inspection.inspector_name || undefined,
      scheduledDate: inspection.scheduled_date || undefined,
      inspectionDate: inspection.inspection_date || undefined,
      nextInspectionDate: inspection.next_inspection_date || undefined,
      startedAt: inspection.started_at || undefined,
      completedAt: inspection.completed_at || undefined,
      status: inspection.status,
      overallResult: inspection.overall_result || undefined,
      qualityScore: inspection.quality_score || undefined,
      checkpointsTotal: inspection.checkpoints.length,
      checkpointsCompleted: inspection.checkpoints.filter(cp => cp.result).length,
      isActive: inspection.is_active,
      createdAt: inspection.created_at,
      updatedAt: inspection.updated_at,
    }));
  }

  // Get Inspection by ID
  async getInspectionById(companyId: string, inspectionId: string) {
    const inspection = await this.prisma.quality_inspections.findFirst({
      where: {
        id: inspectionId,
        company_id: companyId,
      },
      include: {
        inspector: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            avatar_url: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        checkpoints: {
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (!inspection) {
      throw new Error('Inspection not found');
    }

    return {
      id: inspection.id,
      inspectionNumber: inspection.inspection_number,
      companyId: inspection.company_id,
      inspectionType: inspection.inspection_type,
      referenceType: inspection.reference_type,
      referenceId: inspection.reference_id,
      locationId: inspection.location_id || undefined,
      inspector: {
        id: inspection.inspector.id,
        firstName: inspection.inspector.first_name,
        lastName: inspection.inspector.last_name,
        email: inspection.inspector.email || '',
        avatarUrl: inspection.inspector.avatar_url || undefined,
      },
      template: inspection.template ? {
        id: inspection.template.id,
        name: inspection.template.name,
        description: inspection.template.description || undefined,
      } : undefined,
      scheduledDate: inspection.scheduled_date,
      startedAt: inspection.started_at || undefined,
      completedAt: inspection.completed_at || undefined,
      status: inspection.status,
      overallResult: inspection.overall_result || undefined,
      qualityScore: inspection.quality_score || undefined,
      inspectorNotes: inspection.inspector_notes || undefined,
      recommendations: inspection.recommendations || undefined,
      checkpoints: inspection.checkpoints.map(cp => ({
        id: cp.id,
        name: cp.name,
        description: cp.description || undefined,
        evaluationType: cp.evaluation_type,
        result: cp.result || undefined,
        notes: cp.notes || undefined,
        photos: cp.photos,
        orderIndex: cp.order_index,
      })),
      createdAt: inspection.created_at,
      updatedAt: inspection.updated_at,
    };
  }

  // Update Inspection
  async updateInspection(companyId: string, inspectionId: string, data: UpdateInspectionData) {
    const updateData: any = { updated_at: new Date() };

    if (data.status) updateData.status = data.status;
    if (data.startedAt) updateData.started_at = data.startedAt;
    if (data.completedAt) updateData.completed_at = data.completedAt;
    if (data.overallResult) updateData.overall_result = data.overallResult;
    if (data.qualityScore !== undefined) updateData.quality_score = data.qualityScore;
    if (data.inspectorNotes !== undefined) updateData.inspector_notes = data.inspectorNotes;
    if (data.recommendations !== undefined) updateData.recommendations = data.recommendations;

    const inspection = await this.prisma.quality_inspections.update({
      where: { id: inspectionId },
      data: updateData,
    });

    return {
      id: inspection.id,
      inspectionNumber: inspection.inspection_number,
      status: inspection.status,
      qualityScore: inspection.quality_score || undefined,
      updatedAt: inspection.updated_at,
    };
  }

  // Complete Inspection
  async completeInspection(companyId: string, inspectionId: string, result: string, qualityScore: number, notes?: string, recommendations?: string) {
    const now = new Date();
    
    const inspection = await this.prisma.quality_inspections.update({
      where: { id: inspectionId },
      data: {
        status: result === 'PASS' ? InspectionStatus.PASSED : result === 'FAIL' ? InspectionStatus.FAILED : InspectionStatus.CONDITIONAL,
        completed_at: now,
        overall_result: result,
        quality_score: qualityScore,
        inspector_notes: notes || null,
        recommendations: recommendations || null,
        updated_at: now,
      },
    });

    // Update metrics
    await this.updateInspectionMetrics(companyId, inspection.scheduled_date);

    return {
      id: inspection.id,
      inspectionNumber: inspection.inspection_number,
      status: inspection.status,
      overallResult: inspection.overall_result,
      qualityScore: inspection.quality_score,
      completedAt: inspection.completed_at,
    };
  }

  // Update Checkpoint
  async updateCheckpoint(companyId: string, checkpointId: string, result: string, notes?: string, photos?: string[]) {
    const checkpoint = await this.prisma.inspection_checkpoints.update({
      where: { id: checkpointId },
      data: {
        result,
        notes: notes || null,
        photos: photos || [],
      },
    });

    return {
      id: checkpoint.id,
      result: checkpoint.result,
      notes: checkpoint.notes || undefined,
      photos: checkpoint.photos,
    };
  }

  // Delete Inspection
  async deleteInspection(companyId: string, inspectionId: string) {
    await this.prisma.quality_inspections.delete({
      where: {
        id: inspectionId,
        company_id: companyId,
      },
    });
  }

  // Create Inspection Template
  async createTemplate(companyId: string, userId: string, data: CreateInspectionTemplateData) {
    const now = new Date();

    const template = await this.prisma.inspection_templates.create({
      data: {
        id: uuidv4(),
        company_id: companyId,
        name: data.name,
        description: data.description || null,
        category: data.category,
        applicable_to: data.applicableTo,
        passing_score: data.passingScore || 70,
        created_by: userId,
        created_at: now,
        updated_at: now,
      },
    });

    // Create checkpoints
    if (data.checkpoints && data.checkpoints.length > 0) {
      const checkpoints = data.checkpoints.map(cp => ({
        id: uuidv4(),
        template_id: template.id,
        name: cp.name,
        description: cp.description || null,
        evaluation_type: cp.evaluationType,
        is_required: cp.isRequired !== false,
        order_index: cp.orderIndex,
        created_at: now,
      }));

      await this.prisma.template_checkpoints.createMany({
        data: checkpoints,
      });
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description || undefined,
      category: template.category,
      applicableTo: template.applicable_to,
      passingScore: template.passing_score,
      createdAt: template.created_at,
    };
  }

  // Get Templates
  async getTemplates(companyId: string, category?: string) {
    const where: any = { company_id: companyId, is_active: true };

    if (category) {
      where.category = category;
    }

    const templates = await this.prisma.inspection_templates.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        checkpoints: {
          orderBy: { order_index: 'asc' },
        },
        _count: {
          select: {
            inspections: true,
          },
        },
      },
    });

    return templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description || undefined,
      category: template.category,
      applicableTo: template.applicable_to,
      passingScore: template.passing_score,
      checkpointsCount: template.checkpoints.length,
      usageCount: template._count.inspections,
      createdAt: template.created_at,
    }));
  }

  // Get Template by ID
  async getTemplateById(companyId: string, templateId: string) {
    const template = await this.prisma.inspection_templates.findFirst({
      where: {
        id: templateId,
        company_id: companyId,
      },
      include: {
        checkpoints: {
          orderBy: { order_index: 'asc' },
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description || undefined,
      category: template.category,
      applicableTo: template.applicable_to,
      passingScore: template.passing_score,
      creator: {
        id: template.creator.id,
        firstName: template.creator.first_name,
        lastName: template.creator.last_name,
      },
      checkpoints: template.checkpoints.map(cp => ({
        id: cp.id,
        name: cp.name,
        description: cp.description || undefined,
        evaluationType: cp.evaluation_type,
        isRequired: cp.is_required,
        orderIndex: cp.order_index,
      })),
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    };
  }

  // Delete Template
  async deleteTemplate(companyId: string, templateId: string) {
    await this.prisma.inspection_templates.update({
      where: {
        id: templateId,
        company_id: companyId,
      },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  }

  // Get Inspection Metrics
  async getInspectionMetrics(companyId: string, periodStart: Date, periodEnd: Date) {
    const metrics = await this.prisma.inspection_metrics.findFirst({
      where: {
        company_id: companyId,
        period_start: periodStart,
        period_end: periodEnd,
      },
    });

    if (!metrics) {
      // Calculate metrics if not exists
      return await this.calculateInspectionMetrics(companyId, periodStart, periodEnd);
    }

    return {
      totalInspections: metrics.total_inspections,
      passedInspections: metrics.passed_inspections,
      failedInspections: metrics.failed_inspections,
      passRate: metrics.pass_rate,
      totalDefects: metrics.total_defects,
      criticalDefects: metrics.critical_defects,
      avgInspectionTime: metrics.avg_inspection_time || undefined,
    };
  }

  // Calculate and Update Inspection Metrics
  private async calculateInspectionMetrics(companyId: string, periodStart: Date, periodEnd: Date) {
    const inspections = await this.prisma.quality_inspections.findMany({
      where: {
        company_id: companyId,
        scheduled_date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    const totalInspections = inspections.length;
    const passedInspections = inspections.filter(i => i.status === InspectionStatus.PASSED).length;
    const failedInspections = inspections.filter(i => i.status === InspectionStatus.FAILED).length;
    const passRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;

    // Calculate average inspection time
    const completedInspections = inspections.filter(i => i.started_at && i.completed_at);
    let avgInspectionTime = null;
    if (completedInspections.length > 0) {
      const totalTime = completedInspections.reduce((sum, i) => {
        const duration = i.completed_at!.getTime() - i.started_at!.getTime();
        return sum + duration;
      }, 0);
      avgInspectionTime = totalTime / completedInspections.length / (1000 * 60); // Convert to minutes
    }

    return {
      totalInspections,
      passedInspections,
      failedInspections,
      passRate,
      totalDefects: 0, // This would need to be calculated from defects table
      criticalDefects: 0,
      avgInspectionTime,
    };
  }

  // Update Inspection Metrics (called after completing an inspection)
  private async updateInspectionMetrics(companyId: string, date: Date) {
    const periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const metrics = await this.calculateInspectionMetrics(companyId, periodStart, periodEnd);

    await this.prisma.inspection_metrics.upsert({
      where: {
        company_id_period_start_period_end: {
          company_id: companyId,
          period_start: periodStart,
          period_end: periodEnd,
        },
      },
      create: {
        id: uuidv4(),
        company_id: companyId,
        period_start: periodStart,
        period_end: periodEnd,
        total_inspections: metrics.totalInspections,
        passed_inspections: metrics.passedInspections,
        failed_inspections: metrics.failedInspections,
        pass_rate: metrics.passRate,
        total_defects: metrics.totalDefects,
        critical_defects: metrics.criticalDefects,
        avg_inspection_time: metrics.avgInspectionTime,
        created_at: new Date(),
        updated_at: new Date(),
      },
      update: {
        total_inspections: metrics.totalInspections,
        passed_inspections: metrics.passedInspections,
        failed_inspections: metrics.failedInspections,
        pass_rate: metrics.passRate,
        total_defects: metrics.totalDefects,
        critical_defects: metrics.criticalDefects,
        avg_inspection_time: metrics.avgInspectionTime,
        updated_at: new Date(),
      },
    });
  }
}

export const inspectionService = new InspectionService();
