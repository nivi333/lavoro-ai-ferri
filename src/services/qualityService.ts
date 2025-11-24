import { PrismaClient, CheckpointType, QCStatus, DefectCategory, DefectSeverity, ResolutionStatus, ComplianceType, ComplianceStatus, InspectionType, InspectionStatus, DefectStatus, EvaluationType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const globalPrisma = new PrismaClient();

interface CreateCheckpointData {
  checkpointType: CheckpointType;
  checkpointName: string;
  inspectorName: string;
  inspectionDate: Date;
  orderId?: string;
  locationId?: string;
  productId?: string;
  batchNumber?: string;
  totalBatch?: number;
  lotNumber?: string;
  sampleSize?: number;
  testedQuantity?: number;
  overallScore?: number;
  notes?: string;
}

interface CreateDefectData {
  checkpointId: string;
  productId?: string;
  defectCategory: DefectCategory;
  defectType: string;
  severity: DefectSeverity;
  quantity: number;
  batchNumber?: string;
  lotNumber?: string;
  affectedItems?: number;
  description?: string;
  imageUrl?: string;
}

interface CreateMetricData {
  checkpointId: string;
  metricName: string;
  metricValue: number;
  unitOfMeasure: string;
  minThreshold?: number;
  maxThreshold?: number;
  notes?: string;
}

interface CreateComplianceReportData {
  reportType: ComplianceType;
  reportDate: Date;
  auditorName: string;
  certification?: string;
  validityPeriod?: string;
  status: ComplianceStatus;
  findings?: string;
  recommendations?: string;
  documentUrl?: string;
}

interface UpdateComplianceReportData {
  reportType?: ComplianceType;
  reportDate?: Date;
  auditorName?: string;
  certification?: string;
  validityPeriod?: string;
  status?: ComplianceStatus;
  findings?: string;
  recommendations?: string;
  documentUrl?: string;
}

export class QualityService {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = globalPrisma) {
    this.prisma = client;
  }

  // Generate checkpoint ID (QC001, QC002, etc.) - GLOBALLY UNIQUE but company-scoped
  private async generateCheckpointId(companyId: string): Promise<string> {
    // Find the last checkpoint GLOBALLY to ensure unique IDs across all companies
    // This prevents duplicate checkpoint_id violations in the database
    const lastCheckpoint = await this.prisma.quality_checkpoints.findFirst({
      orderBy: { created_at: 'desc' },
      select: { checkpoint_id: true },
    });

    if (!lastCheckpoint) {
      return 'QC001';
    }

    const lastNumber = parseInt(lastCheckpoint.checkpoint_id.substring(2));
    const nextNumber = lastNumber + 1;
    return `QC${nextNumber.toString().padStart(3, '0')}`;
  }

  // Generate defect ID (DEF001, DEF002, etc.) - GLOBALLY UNIQUE
  private async generateDefectId(companyId: string): Promise<string> {
    // Find the last defect globally since defect_id has @unique constraint
    const lastDefect = await this.prisma.quality_defects.findFirst({
      orderBy: { created_at: 'desc' },
      select: { defect_id: true },
    });

    if (!lastDefect) {
      return 'DEF001';
    }

    const lastNumber = parseInt(lastDefect.defect_id.substring(3));
    const nextNumber = lastNumber + 1;
    return `DEF${nextNumber.toString().padStart(3, '0')}`;
  }

  // Generate metric ID (QM001, QM002, etc.) - GLOBALLY UNIQUE
  private async generateMetricId(companyId: string): Promise<string> {
    // Find the last metric globally since metric_id has @unique constraint
    const lastMetric = await this.prisma.quality_metrics.findFirst({
      orderBy: { created_at: 'desc' },
      select: { metric_id: true },
    });

    if (!lastMetric) {
      return 'QM001';
    }

    const lastNumber = parseInt(lastMetric.metric_id.substring(2));
    const nextNumber = lastNumber + 1;
    return `QM${nextNumber.toString().padStart(3, '0')}`;
  }

  // Generate compliance report ID (CR001, CR002, etc.) - GLOBALLY UNIQUE
  private async generateReportId(companyId: string): Promise<string> {
    // Find the last report globally since report_id has @unique constraint
    const lastReport = await this.prisma.compliance_reports.findFirst({
      orderBy: { created_at: 'desc' },
      select: { report_id: true },
    });

    if (!lastReport) {
      return 'CR001';
    }

    const lastNumber = parseInt(lastReport.report_id.substring(2));
    const nextNumber = lastNumber + 1;
    return `CR${nextNumber.toString().padStart(3, '0')}`;
  }

  // Generate compliance report code (COMP001, COMP002, etc.) - GLOBALLY UNIQUE
  private async generateReportCode(companyId: string): Promise<string> {
    // Find the last report globally since report_code has @unique constraint
    const lastReport = await this.prisma.compliance_reports.findFirst({
      where: { report_code: { not: null } },
      orderBy: { created_at: 'desc' },
      select: { report_code: true },
    });

    if (!lastReport || !lastReport.report_code) {
      return 'COMP001';
    }

    const lastNumber = parseInt(lastReport.report_code.substring(4));
    const nextNumber = lastNumber + 1;
    return `COMP${nextNumber.toString().padStart(3, '0')}`;
  }

  // Create Quality Checkpoint
  async createCheckpoint(companyId: string, data: CreateCheckpointData) {
    const checkpointId = await this.generateCheckpointId(companyId);
    const now = new Date();

    const checkpoint = await this.prisma.quality_checkpoints.create({
      data: {
        id: uuidv4(),
        checkpoint_id: checkpointId,
        company_id: companyId,
        checkpoint_type: data.checkpointType,
        checkpoint_name: data.checkpointName,
        inspector_name: data.inspectorName,
        inspection_date: data.inspectionDate,
        product_id: data.productId,
        batch_number: data.batchNumber,
        total_batch: data.totalBatch,
        lot_number: data.lotNumber,
        sample_size: data.sampleSize,
        tested_quantity: data.testedQuantity,
        status: QCStatus.PENDING,
        overall_score: data.overallScore ?? null,
        notes: data.notes ?? null,
        location_id: data.locationId ?? null,
        order_id: data.orderId ?? null,
        updated_at: now,
      },
    });

    return {
      id: checkpoint.id,
      checkpointId: checkpoint.checkpoint_id,
      companyId: checkpoint.company_id,
      checkpointType: checkpoint.checkpoint_type,
      checkpointName: checkpoint.checkpoint_name,
      inspectorName: checkpoint.inspector_name,
      inspectionDate: checkpoint.inspection_date,
      status: checkpoint.status,
      overallScore: checkpoint.overall_score ?? undefined,
      notes: checkpoint.notes ?? undefined,
      locationId: checkpoint.location_id ?? undefined,
      orderId: checkpoint.order_id ?? undefined,
      createdAt: checkpoint.created_at,
      updatedAt: checkpoint.updated_at,
    };
  }

  /* 
   * Get Checkpoints - FILTERED BY COMPANY for multi-tenant isolation
   * FIX: Returns empty array if table doesn't exist (new company scenario)
   * This prevents 500 errors when quality tables haven't been migrated yet
   */
  async getCheckpoints(companyId: string, filters?: {
    checkpointType?: CheckpointType;
    status?: QCStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const where: any = { company_id: companyId };

      if (filters?.checkpointType) {
        where.checkpoint_type = filters.checkpointType;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.startDate || filters?.endDate) {
        where.inspection_date = {};
        if (filters.startDate) {
          where.inspection_date.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.inspection_date.lte = filters.endDate;
        }
      }

      const checkpoints = await this.prisma.quality_checkpoints.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          defects: true,
          metrics: true,
        },
      });

      return checkpoints.map(cp => ({
        id: cp.id,
        checkpointId: cp.checkpoint_id,
        companyId: cp.company_id,
        checkpointType: cp.checkpoint_type,
        checkpointName: cp.checkpoint_name,
        inspectorName: cp.inspector_name,
        inspectionDate: cp.inspection_date,
        status: cp.status,
        overallScore: cp.overall_score ?? undefined,
        notes: cp.notes ?? undefined,
        locationId: cp.location_id ?? undefined,
        orderId: cp.order_id ?? undefined,
        defectCount: cp.defects.length,
        metricCount: cp.metrics.length,
        createdAt: cp.created_at,
        updatedAt: cp.updated_at,
      }));
    } catch (error: any) {
      // If table doesn't exist, return empty array instead of throwing error
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn(`Quality checkpoints table not found for company ${companyId}. Returning empty array.`);
        return [];
      }
      throw error;
    }
  }

  // Get Checkpoint by ID
  async getCheckpointById(companyId: string, checkpointId: string) {
    const checkpoint = await this.prisma.quality_checkpoints.findFirst({
      where: {
        id: checkpointId,
        company_id: companyId,
      },
      include: {
        defects: true,
        metrics: true,
      },
    });

    if (!checkpoint) {
      throw new Error('Checkpoint not found');
    }

    return {
      id: checkpoint.id,
      checkpointId: checkpoint.checkpoint_id,
      companyId: checkpoint.company_id,
      checkpointType: checkpoint.checkpoint_type,
      checkpointName: checkpoint.checkpoint_name,
      inspectorName: checkpoint.inspector_name,
      inspectionDate: checkpoint.inspection_date,
      status: checkpoint.status,
      overallScore: checkpoint.overall_score ?? undefined,
      notes: checkpoint.notes ?? undefined,
      locationId: checkpoint.location_id ?? undefined,
      orderId: checkpoint.order_id ?? undefined,
      defects: checkpoint.defects.map(d => ({
        id: d.id,
        defectId: d.defect_id,
        defectCategory: d.defect_category,
        defectType: d.defect_type,
        severity: d.severity,
        quantity: d.quantity,
        resolutionStatus: d.resolution_status,
      })),
      metrics: checkpoint.metrics.map(m => ({
        id: m.id,
        metricId: m.metric_id,
        metricName: m.metric_name,
        metricValue: m.metric_value,
        unitOfMeasure: m.unit_of_measure,
        isWithinRange: m.is_within_range,
      })),
      createdAt: checkpoint.created_at,
      updatedAt: checkpoint.updated_at,
    };
  }

  // Update Checkpoint
  async updateCheckpoint(companyId: string, checkpointId: string, data: Partial<CreateCheckpointData> & { status?: QCStatus }) {
    const updateData: any = { updated_at: new Date() };

    if (data.checkpointName) updateData.checkpoint_name = data.checkpointName;
    if (data.inspectorName) updateData.inspector_name = data.inspectorName;
    if (data.inspectionDate) updateData.inspection_date = data.inspectionDate;
    if (data.status) updateData.status = data.status;
    if (data.overallScore !== undefined) updateData.overall_score = data.overallScore;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const checkpoint = await this.prisma.quality_checkpoints.update({
      where: { id: checkpointId },
      data: updateData,
    });

    return {
      id: checkpoint.id,
      checkpointId: checkpoint.checkpoint_id,
      status: checkpoint.status,
      updatedAt: checkpoint.updated_at,
    };
  }

  // Create Defect
  async createDefect(companyId: string, data: CreateDefectData) {
    const defectId = await this.generateDefectId(companyId);
    const now = new Date();

    const defect = await this.prisma.quality_defects.create({
      data: {
        id: uuidv4(),
        defect_id: defectId,
        company_id: companyId,
        checkpoint_id: data.checkpointId,
        product_id: data.productId,
        defect_category: data.defectCategory,
        defect_type: data.defectType,
        severity: data.severity,
        quantity: data.quantity,
        batch_number: data.batchNumber,
        lot_number: data.lotNumber,
        affected_items: data.affectedItems,
        description: data.description ?? null,
        image_url: data.imageUrl ?? null,
        resolution_status: ResolutionStatus.OPEN,
        updated_at: now,
      },
    });

    return {
      id: defect.id,
      defectId: defect.defect_id,
      companyId: defect.company_id,
      checkpointId: defect.checkpoint_id,
      defectCategory: defect.defect_category,
      defectType: defect.defect_type,
      severity: defect.severity,
      quantity: defect.quantity,
      description: defect.description ?? undefined,
      imageUrl: defect.image_url ?? undefined,
      resolutionStatus: defect.resolution_status,
      createdAt: defect.created_at,
      updatedAt: defect.updated_at,
    };
  }

  /* 
   * Get Defects - FILTERED BY COMPANY for multi-tenant isolation
   * FIX: Returns empty array if table doesn't exist (new company scenario)
   * This prevents 500 errors when quality tables haven't been migrated yet
   */
  async getDefects(companyId: string, filters?: {
    defectCategory?: DefectCategory;
    severity?: DefectSeverity;
    resolutionStatus?: ResolutionStatus;
  }) {
    try {
      const where: any = { company_id: companyId };

      if (filters?.defectCategory) {
        where.defect_category = filters.defectCategory;
      }

      if (filters?.severity) {
        where.severity = filters.severity;
      }

      if (filters?.resolutionStatus) {
        where.resolution_status = filters.resolutionStatus;
      }

      const defects = await this.prisma.quality_defects.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          checkpoint: {
            select: {
              checkpoint_id: true,
              checkpoint_name: true,
            },
          },
        },
      });

      return defects.map(d => ({
        id: d.id,
        defectId: d.defect_id,
        checkpointId: d.checkpoint.checkpoint_id,
        checkpointName: d.checkpoint.checkpoint_name,
        defectCategory: d.defect_category,
        defectType: d.defect_type,
        severity: d.severity,
        quantity: d.quantity,
        description: d.description ?? undefined,
        imageUrl: d.image_url ?? undefined,
        resolutionStatus: d.resolution_status,
        resolvedBy: d.resolved_by ?? undefined,
        resolvedAt: d.resolved_at ?? undefined,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    } catch (error: any) {
      // If table doesn't exist, return empty array instead of throwing error
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn(`Quality defects table not found for company ${companyId}. Returning empty array.`);
        return [];
      }
      throw error;
    }
  }

  // Resolve Defect
  async resolveDefect(companyId: string, defectId: string, resolvedBy: string, resolutionNotes?: string) {
    const defect = await this.prisma.quality_defects.update({
      where: { id: defectId },
      data: {
        resolution_status: ResolutionStatus.RESOLVED,
        resolved_by: resolvedBy,
        resolved_at: new Date(),
        resolution_notes: resolutionNotes ?? null,
        updated_at: new Date(),
      },
    });

    return {
      id: defect.id,
      defectId: defect.defect_id,
      resolutionStatus: defect.resolution_status,
      resolvedBy: defect.resolved_by,
      resolvedAt: defect.resolved_at,
    };
  }

  // Create Metric
  async createMetric(companyId: string, data: CreateMetricData) {
    const metricId = await this.generateMetricId(companyId);

    // Calculate if value is within range
    let isWithinRange = true;
    if (data.minThreshold !== undefined && data.metricValue < data.minThreshold) {
      isWithinRange = false;
    }
    if (data.maxThreshold !== undefined && data.metricValue > data.maxThreshold) {
      isWithinRange = false;
    }

    const metric = await this.prisma.quality_metrics.create({
      data: {
        id: uuidv4(),
        metric_id: metricId,
        company_id: companyId,
        checkpoint_id: data.checkpointId,
        metric_name: data.metricName,
        metric_value: data.metricValue,
        unit_of_measure: data.unitOfMeasure,
        min_threshold: data.minThreshold ?? null,
        max_threshold: data.maxThreshold ?? null,
        is_within_range: isWithinRange,
        notes: data.notes ?? null,
      },
    });

    return {
      id: metric.id,
      metricId: metric.metric_id,
      companyId: metric.company_id,
      checkpointId: metric.checkpoint_id,
      metricName: metric.metric_name,
      metricValue: metric.metric_value,
      unitOfMeasure: metric.unit_of_measure,
      minThreshold: metric.min_threshold ?? undefined,
      maxThreshold: metric.max_threshold ?? undefined,
      isWithinRange: metric.is_within_range,
      notes: metric.notes ?? undefined,
      createdAt: metric.created_at,
    };
  }

  // Get Metrics for Checkpoint
  async getMetricsByCheckpoint(companyId: string, checkpointId: string) {
    const metrics = await this.prisma.quality_metrics.findMany({
      where: {
        company_id: companyId,
        checkpoint_id: checkpointId,
      },
      orderBy: { created_at: 'asc' },
    });

    return metrics.map(m => ({
      id: m.id,
      metricId: m.metric_id,
      metricName: m.metric_name,
      metricValue: m.metric_value,
      unitOfMeasure: m.unit_of_measure,
      minThreshold: m.min_threshold ?? undefined,
      maxThreshold: m.max_threshold ?? undefined,
      isWithinRange: m.is_within_range,
      notes: m.notes ?? undefined,
      createdAt: m.created_at,
    }));
  }

  // Create Compliance Report
  async createComplianceReport(companyId: string, data: CreateComplianceReportData) {
    const reportId = await this.generateReportId(companyId);
    const now = new Date();

    const report = await this.prisma.compliance_reports.create({
      data: {
        id: uuidv4(),
        report_id: reportId,
        company_id: companyId,
        report_type: data.reportType,
        report_date: data.reportDate,
        auditor_name: data.auditorName,
        certification: data.certification ?? null,
        validity_period: data.validityPeriod ?? null,
        status: data.status,
        findings: data.findings ?? null,
        recommendations: data.recommendations ?? null,
        document_url: data.documentUrl ?? null,
        updated_at: now,
      },
    });

    return {
      id: report.id,
      reportId: report.report_id,
      companyId: report.company_id,
      reportType: report.report_type,
      reportDate: report.report_date,
      auditorName: report.auditor_name,
      certification: report.certification ?? undefined,
      validityPeriod: report.validity_period ?? undefined,
      status: report.status,
      findings: report.findings ?? undefined,
      recommendations: report.recommendations ?? undefined,
      documentUrl: report.document_url ?? undefined,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
    };
  }

  /* 
   * Get Compliance Reports - FILTERED BY COMPANY for multi-tenant isolation
   * FIX: Returns empty array if table doesn't exist (new company scenario)
   * This prevents 500 errors when quality tables haven't been migrated yet
   */
  async getComplianceReports(companyId: string, filters?: {
    reportType?: ComplianceType;
    status?: ComplianceStatus;
  }) {
    try {
      const where: any = { company_id: companyId };

      if (filters?.reportType) {
        where.report_type = filters.reportType;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      const reports = await this.prisma.compliance_reports.findMany({
        where,
        orderBy: { report_date: 'desc' },
      });

      return reports.map(r => ({
        id: r.id,
        reportId: r.report_id,
        reportType: r.report_type,
        reportDate: r.report_date,
        auditorName: r.auditor_name,
        certification: r.certification ?? undefined,
        validityPeriod: r.validity_period ?? undefined,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch (error: any) {
      // If table doesn't exist, return empty array instead of throwing error
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn(`Compliance reports table not found for company ${companyId}. Returning empty array.`);
        return [];
      }
      throw error;
    }
  }

  // Delete Checkpoint
  async deleteCheckpoint(companyId: string, checkpointId: string) {
    await this.prisma.quality_checkpoints.delete({
      where: {
        id: checkpointId,
        company_id: companyId,
      },
    });
  }

  // Delete Defect
  async deleteDefect(companyId: string, defectId: string) {
    await this.prisma.quality_defects.delete({
      where: {
        id: defectId,
        company_id: companyId,
      },
    });
  }

  // Delete Metric
  async deleteMetric(companyId: string, metricId: string) {
    await this.prisma.quality_metrics.delete({
      where: {
        id: metricId,
        company_id: companyId,
      },
    });
  }

  // Update Compliance Report
  async updateComplianceReport(companyId: string, reportId: string, data: UpdateComplianceReportData) {
    const now = new Date();

    const report = await this.prisma.compliance_reports.update({
      where: {
        id: reportId,
        company_id: companyId,
      },
      data: {
        report_type: data.reportType,
        report_date: data.reportDate,
        auditor_name: data.auditorName,
        certification: data.certification ?? null,
        validity_period: data.validityPeriod ?? null,
        status: data.status,
        findings: data.findings ?? null,
        recommendations: data.recommendations ?? null,
        document_url: data.documentUrl ?? null,
        updated_at: now,
      },
    });

    return {
      id: report.id,
      reportId: report.report_id,
      reportType: report.report_type,
      reportDate: report.report_date,
      auditorName: report.auditor_name,
      certification: report.certification ?? undefined,
      validityPeriod: report.validity_period ?? undefined,
      status: report.status,
      findings: report.findings ?? undefined,
      recommendations: report.recommendations ?? undefined,
      documentUrl: report.document_url ?? undefined,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
    };
  }

  // Delete Compliance Report
  async deleteComplianceReport(companyId: string, reportId: string) {
    await this.prisma.compliance_reports.delete({
      where: {
        id: reportId,
        company_id: companyId,
      },
    });
  }
}

export const qualityService = new QualityService();
