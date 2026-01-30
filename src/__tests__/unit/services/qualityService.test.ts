import { QualityService } from '../../../services/qualityService';
import { PrismaClient } from '@prisma/client';

// Define enum types as string literals to avoid mocking issues
type CheckpointType = 'INCOMING_MATERIAL' | 'IN_PROCESS' | 'FINAL_INSPECTION' | 'PACKAGING' | 'RANDOM_SAMPLING' | 'BATCH_TEST';
type QCStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'REWORK_REQUIRED';
type DefectCategory = 'FABRIC' | 'STITCHING' | 'COLOR' | 'MEASUREMENT' | 'PACKAGING' | 'FINISHING' | 'LABELING';
type DefectSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'COSMETIC';
type ResolutionStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type ComplianceType = 'ISO_9001' | 'OEKO_TEX' | 'GOTS' | 'WRAP' | 'SA8000' | 'BSCI' | 'SEDEX';
type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING_REVIEW' | 'EXPIRED';

// Mock database connection
jest.mock('../../../database/connection', () => ({
  globalPrisma: {
    quality_checkpoints: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    quality_defects: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    quality_metrics: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    compliance_reports: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock Prisma Client
const mockPrisma = {
  quality_checkpoints: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  quality_defects: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  quality_metrics: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  compliance_reports: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as unknown as PrismaClient;

describe('QualityService', () => {
  let qualityService: QualityService;
  const testCompanyId = 'test-company-123';
  const testCheckpointId = 'checkpoint-uuid-123';
  const testDefectId = 'defect-uuid-123';
  const testMetricId = 'metric-uuid-123';
  const testReportId = 'report-uuid-123';

  beforeEach(() => {
    qualityService = new QualityService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('Checkpoint Management', () => {
    describe('createCheckpoint', () => {
      it('should create a quality checkpoint with auto-generated ID', async () => {
        const mockCheckpointData = {
          checkpointType: 'INCOMING_MATERIAL' as CheckpointType,
          checkpointName: 'Fabric Quality Check',
          inspectorName: 'John Doe',
          inspectionDate: new Date('2024-01-15'),
          productId: 'product-123',
          batchNumber: 'BATCH-001',
          totalBatch: 100,
          sampleSize: 10,
          testedQuantity: 10,
          overallScore: 95,
          notes: 'All samples passed',
        };

        const mockCreatedCheckpoint = {
          id: testCheckpointId,
          checkpoint_id: 'QC001',
          company_id: testCompanyId,
          checkpoint_type: 'INCOMING_MATERIAL' as CheckpointType,
          checkpoint_name: 'Fabric Quality Check',
          inspector_name: 'John Doe',
          inspection_date: new Date('2024-01-15'),
          product_id: 'product-123',
          batch_number: 'BATCH-001',
          total_batch: 100,
          lot_number: null,
          sample_size: 10,
          tested_quantity: 10,
          status: 'PENDING' as QCStatus,
          overall_score: 95,
          notes: 'All samples passed',
          location_id: null,
          order_id: null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        (mockPrisma.quality_checkpoints.findFirst as jest.Mock).mockResolvedValue(null);
        (mockPrisma.quality_checkpoints.create as jest.Mock).mockResolvedValue(mockCreatedCheckpoint);

        const result = await qualityService.createCheckpoint(testCompanyId, mockCheckpointData);

        expect(result.checkpointId).toBe('QC001');
        expect(result.checkpointName).toBe('Fabric Quality Check');
        expect(result.status).toBe('PENDING' as QCStatus);
        expect(result.overallScore).toBe(95);
        expect(mockPrisma.quality_checkpoints.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              company_id: testCompanyId,
              checkpoint_type: 'INCOMING_MATERIAL' as CheckpointType,
              checkpoint_name: 'Fabric Quality Check',
              status: 'PENDING' as QCStatus,
            }),
          })
        );
      });

      it('should generate sequential checkpoint IDs', async () => {
        const mockLastCheckpoint = {
          checkpoint_id: 'QC005',
        };

        (mockPrisma.quality_checkpoints.findFirst as jest.Mock).mockResolvedValue(mockLastCheckpoint);
        (mockPrisma.quality_checkpoints.create as jest.Mock).mockResolvedValue({
          id: testCheckpointId,
          checkpoint_id: 'QC006',
          company_id: testCompanyId,
          checkpoint_type: 'IN_PROCESS' as CheckpointType,
          checkpoint_name: 'Process Check',
          inspector_name: 'Jane Smith',
          inspection_date: new Date(),
          status: 'PENDING' as QCStatus,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        });

        const result = await qualityService.createCheckpoint(testCompanyId, {
          checkpointType: 'IN_PROCESS' as CheckpointType,
          checkpointName: 'Process Check',
          inspectorName: 'Jane Smith',
          inspectionDate: new Date(),
        });

        expect(result.checkpointId).toBe('QC006');
      });

      it('should set default status to PENDING', async () => {
        (mockPrisma.quality_checkpoints.findFirst as jest.Mock).mockResolvedValue(null);
        (mockPrisma.quality_checkpoints.create as jest.Mock).mockResolvedValue({
          id: testCheckpointId,
          checkpoint_id: 'QC001',
          company_id: testCompanyId,
          status: 'PENDING' as QCStatus,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        });

        const result = await qualityService.createCheckpoint(testCompanyId, {
          checkpointType: 'FINAL_INSPECTION' as CheckpointType,
          checkpointName: 'Final Check',
          inspectorName: 'Inspector',
          inspectionDate: new Date(),
        });

        expect(result.status).toBe('PENDING' as QCStatus);
      });
    });

    describe('getCheckpoints', () => {
      it('should retrieve checkpoints filtered by company', async () => {
        const mockCheckpoints = [
          {
            id: 'cp1',
            checkpoint_id: 'QC001',
            company_id: testCompanyId,
            checkpoint_type: 'INCOMING_MATERIAL' as CheckpointType,
            checkpoint_name: 'Check 1',
            inspector_name: 'John',
            inspection_date: new Date(),
            status: 'PASSED' as QCStatus,
            overall_score: 95,
            notes: null,
            location_id: null,
            order_id: null,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            defects: [],
            metrics: [],
          },
        ];

        (mockPrisma.quality_checkpoints.findMany as jest.Mock).mockResolvedValue(mockCheckpoints);

        const result = await qualityService.getCheckpoints(testCompanyId);

        expect(result).toHaveLength(1);
        expect(result[0].checkpointId).toBe('QC001');
        expect(result[0].defectCount).toBe(0);
        expect(result[0].metricCount).toBe(0);
        expect(mockPrisma.quality_checkpoints.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { company_id: testCompanyId },
          })
        );
      });

      it('should filter checkpoints by type', async () => {
        (mockPrisma.quality_checkpoints.findMany as jest.Mock).mockResolvedValue([]);

        await qualityService.getCheckpoints(testCompanyId, {
          checkpointType: 'FINAL_INSPECTION' as CheckpointType,
        });

        expect(mockPrisma.quality_checkpoints.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              company_id: testCompanyId,
              checkpoint_type: 'FINAL_INSPECTION' as CheckpointType,
            }),
          })
        );
      });

      it('should filter checkpoints by status', async () => {
        (mockPrisma.quality_checkpoints.findMany as jest.Mock).mockResolvedValue([]);

        await qualityService.getCheckpoints(testCompanyId, {
          status: 'PASSED' as QCStatus,
        });

        expect(mockPrisma.quality_checkpoints.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              company_id: testCompanyId,
              status: 'PASSED' as QCStatus,
            }),
          })
        );
      });

      it('should filter checkpoints by date range', async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        (mockPrisma.quality_checkpoints.findMany as jest.Mock).mockResolvedValue([]);

        await qualityService.getCheckpoints(testCompanyId, {
          startDate,
          endDate,
        });

        expect(mockPrisma.quality_checkpoints.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              company_id: testCompanyId,
              inspection_date: {
                gte: startDate,
                lte: endDate,
              },
            }),
          })
        );
      });

      it('should return empty array if table does not exist', async () => {
        const error: any = new Error('Table does not exist');
        error.code = 'P2021';
        (mockPrisma.quality_checkpoints.findMany as jest.Mock).mockRejectedValue(error);

        const result = await qualityService.getCheckpoints(testCompanyId);

        expect(result).toEqual([]);
      });
    });

    describe('getCheckpointById', () => {
      it('should retrieve checkpoint with defects and metrics', async () => {
        const mockCheckpoint = {
          id: testCheckpointId,
          checkpoint_id: 'QC001',
          company_id: testCompanyId,
          checkpoint_type: 'INCOMING_MATERIAL' as CheckpointType,
          checkpoint_name: 'Check 1',
          inspector_name: 'John',
          inspection_date: new Date(),
          status: 'PASSED' as QCStatus,
          overall_score: 95,
          notes: null,
          location_id: null,
          order_id: null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          defects: [
            {
              id: 'def1',
              defect_id: 'DEF001',
              defect_category: 'FABRIC' as DefectCategory,
              defect_type: 'Stain',
              severity: 'MINOR' as DefectSeverity,
              quantity: 2,
              resolution_status: 'OPEN' as ResolutionStatus,
            },
          ],
          metrics: [
            {
              id: 'met1',
              metric_id: 'QM001',
              metric_name: 'Thread Count',
              metric_value: 200,
              unit_of_measure: 'threads/inch',
              is_within_range: true,
            },
          ],
        };

        (mockPrisma.quality_checkpoints.findFirst as jest.Mock).mockResolvedValue(mockCheckpoint);

        const result = await qualityService.getCheckpointById(testCompanyId, testCheckpointId);

        expect(result.checkpointId).toBe('QC001');
        expect(result.defects).toHaveLength(1);
        expect(result.metrics).toHaveLength(1);
        expect(result.defects[0].defectId).toBe('DEF001');
        expect(result.metrics[0].metricId).toBe('QM001');
      });

      it('should throw error if checkpoint not found', async () => {
        (mockPrisma.quality_checkpoints.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(
          qualityService.getCheckpointById(testCompanyId, 'non-existent')
        ).rejects.toThrow('Checkpoint not found');
      });
    });

    describe('updateCheckpoint', () => {
      it('should update checkpoint status', async () => {
        const mockUpdatedCheckpoint = {
          id: testCheckpointId,
          checkpoint_id: 'QC001',
          status: 'PASSED' as QCStatus,
          updated_at: new Date(),
        };

        (mockPrisma.quality_checkpoints.update as jest.Mock).mockResolvedValue(mockUpdatedCheckpoint);

        const result = await qualityService.updateCheckpoint(testCompanyId, testCheckpointId, {
          status: 'PASSED' as QCStatus,
        });

        expect(result.status).toBe('PASSED' as QCStatus);
        expect(mockPrisma.quality_checkpoints.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: testCheckpointId },
            data: expect.objectContaining({
              status: 'PASSED' as QCStatus,
            }),
          })
        );
      });

      it('should update checkpoint score and notes', async () => {
        (mockPrisma.quality_checkpoints.update as jest.Mock).mockResolvedValue({
          id: testCheckpointId,
          checkpoint_id: 'QC001',
          status: 'PASSED' as QCStatus,
          updated_at: new Date(),
        });

        await qualityService.updateCheckpoint(testCompanyId, testCheckpointId, {
          overallScore: 98,
          notes: 'Excellent quality',
        });

        expect(mockPrisma.quality_checkpoints.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              overall_score: 98,
              notes: 'Excellent quality',
            }),
          })
        );
      });
    });

    describe('deleteCheckpoint', () => {
      it('should delete checkpoint', async () => {
        (mockPrisma.quality_checkpoints.delete as jest.Mock).mockResolvedValue({});

        await qualityService.deleteCheckpoint(testCompanyId, testCheckpointId);

        expect(mockPrisma.quality_checkpoints.delete).toHaveBeenCalledWith({
          where: {
            id: testCheckpointId,
            company_id: testCompanyId,
          },
        });
      });
    });
  });

  describe('Defect Management', () => {
    describe('createDefect', () => {
      it('should create a defect with auto-generated ID', async () => {
        const mockDefectData = {
          checkpointId: testCheckpointId,
          productId: 'product-123',
          defectCategory: 'COLOR' as DefectCategory,
          defectType: 'Color Variation',
          severity: 'MAJOR' as DefectSeverity,
          quantity: 5,
          batchNumber: 'BATCH-001',
          affectedItems: 50,
          description: 'Uneven dyeing',
        };

        const mockCreatedDefect = {
          id: testDefectId,
          defect_id: 'DEF001',
          company_id: testCompanyId,
          checkpoint_id: testCheckpointId,
          product_id: 'product-123',
          defect_category: 'COLOR' as DefectCategory,
          defect_type: 'Color Variation',
          severity: 'MAJOR' as DefectSeverity,
          quantity: 5,
          batch_number: 'BATCH-001',
          lot_number: null,
          affected_items: 50,
          description: 'Uneven dyeing',
          image_url: null,
          resolution_status: 'OPEN' as ResolutionStatus,
          resolved_by: null,
          resolved_at: null,
          resolution_notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        (mockPrisma.quality_defects.findFirst as jest.Mock).mockResolvedValue(null);
        (mockPrisma.quality_defects.create as jest.Mock).mockResolvedValue(mockCreatedDefect);

        const result = await qualityService.createDefect(testCompanyId, mockDefectData);

        expect(result.defectId).toBe('DEF001');
        expect(result.defectCategory).toBe('FABRIC' as DefectCategory);
        expect(result.severity).toBe('MAJOR' as DefectSeverity);
        expect(result.resolutionStatus).toBe('OPEN' as ResolutionStatus);
      });

      it('should generate sequential defect IDs', async () => {
        const mockLastDefect = { defect_id: 'DEF010' };

        (mockPrisma.quality_defects.findFirst as jest.Mock).mockResolvedValue(mockLastDefect);
        (mockPrisma.quality_defects.create as jest.Mock).mockResolvedValue({
          id: testDefectId,
          defect_id: 'DEF011',
          company_id: testCompanyId,
          checkpoint_id: testCheckpointId,
          defect_category: 'MEASUREMENT' as DefectCategory,
          defect_type: 'Size Issue',
          severity: 'MINOR' as DefectSeverity,
          quantity: 1,
          resolution_status: 'OPEN' as ResolutionStatus,
          created_at: new Date(),
          updated_at: new Date(),
        });

        const result = await qualityService.createDefect(testCompanyId, {
          checkpointId: testCheckpointId,
          defectCategory: 'MEASUREMENT' as DefectCategory,
          defectType: 'Size Issue',
          severity: 'MINOR' as DefectSeverity,
          quantity: 1,
        });

        expect(result.defectId).toBe('DEF011');
      });
    });

    describe('getDefects', () => {
      it('should retrieve defects filtered by company', async () => {
        const mockDefects = [
          {
            id: 'def1',
            defect_id: 'DEF001',
            company_id: testCompanyId,
            defect_category: 'FABRIC' as DefectCategory,
            defect_type: 'Stain',
            severity: 'MINOR' as DefectSeverity,
            quantity: 2,
            description: null,
            image_url: null,
            resolution_status: 'OPEN' as ResolutionStatus,
            resolved_by: null,
            resolved_at: null,
            created_at: new Date(),
            updated_at: new Date(),
            checkpoint: {
              checkpoint_id: 'QC001',
              checkpoint_name: 'Fabric Check',
            },
          },
        ];

        (mockPrisma.quality_defects.findMany as jest.Mock).mockResolvedValue(mockDefects);

        const result = await qualityService.getDefects(testCompanyId);

        expect(result).toHaveLength(1);
        expect(result[0].defectId).toBe('DEF001');
        expect(result[0].checkpointId).toBe('QC001');
      });

      it('should filter defects by category', async () => {
        (mockPrisma.quality_defects.findMany as jest.Mock).mockResolvedValue([]);

        await qualityService.getDefects(testCompanyId, {
          defectCategory: 'STITCHING' as DefectCategory,
        });

        expect(mockPrisma.quality_defects.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              defect_category: 'STITCHING' as DefectCategory,
            }),
          })
        );
      });

      it('should return empty array if table does not exist', async () => {
        const error: any = new Error('Table does not exist');
        error.code = 'P2021';
        (mockPrisma.quality_defects.findMany as jest.Mock).mockRejectedValue(error);

        const result = await qualityService.getDefects(testCompanyId);

        expect(result).toEqual([]);
      });
    });

    describe('resolveDefect', () => {
      it('should mark defect as resolved', async () => {
        const mockResolvedDefect = {
          id: testDefectId,
          defect_id: 'DEF001',
          resolution_status: 'RESOLVED' as ResolutionStatus,
          resolved_by: 'John Doe',
          resolved_at: new Date(),
        };

        (mockPrisma.quality_defects.update as jest.Mock).mockResolvedValue(mockResolvedDefect);

        const result = await qualityService.resolveDefect(
          testCompanyId,
          testDefectId,
          'John Doe',
          'Fixed the issue'
        );

        expect(result.resolutionStatus).toBe('RESOLVED' as ResolutionStatus);
        expect(result.resolvedBy).toBe('John Doe');
        expect(mockPrisma.quality_defects.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              resolution_status: 'RESOLVED' as ResolutionStatus,
              resolved_by: 'John Doe',
              resolution_notes: 'Fixed the issue',
            }),
          })
        );
      });
    });

    describe('deleteDefect', () => {
      it('should delete defect', async () => {
        (mockPrisma.quality_defects.delete as jest.Mock).mockResolvedValue({});

        await qualityService.deleteDefect(testCompanyId, testDefectId);

        expect(mockPrisma.quality_defects.delete).toHaveBeenCalledWith({
          where: {
            id: testDefectId,
            company_id: testCompanyId,
          },
        });
      });
    });
  });

  describe('Metric Management', () => {
    describe('createMetric', () => {
      it('should create metric with range validation', async () => {
        const mockMetricData = {
          checkpointId: testCheckpointId,
          metricName: 'Thread Count',
          metricValue: 200,
          unitOfMeasure: 'threads/inch',
          minThreshold: 180,
          maxThreshold: 220,
        };

        const mockCreatedMetric = {
          id: testMetricId,
          metric_id: 'QM001',
          company_id: testCompanyId,
          checkpoint_id: testCheckpointId,
          metric_name: 'Thread Count',
          metric_value: 200,
          unit_of_measure: 'threads/inch',
          min_threshold: 180,
          max_threshold: 220,
          is_within_range: true,
          notes: null,
          created_at: new Date(),
        };

        (mockPrisma.quality_metrics.findFirst as jest.Mock).mockResolvedValue(null);
        (mockPrisma.quality_metrics.create as jest.Mock).mockResolvedValue(mockCreatedMetric);

        const result = await qualityService.createMetric(testCompanyId, mockMetricData);

        expect(result.metricId).toBe('QM001');
        expect(result.isWithinRange).toBe(true);
      });

      it('should mark metric as out of range when below minimum', async () => {
        (mockPrisma.quality_metrics.findFirst as jest.Mock).mockResolvedValue(null);
        (mockPrisma.quality_metrics.create as jest.Mock).mockResolvedValue({
          id: testMetricId,
          metric_id: 'QM001',
          company_id: testCompanyId,
          checkpoint_id: testCheckpointId,
          metric_name: 'Strength',
          metric_value: 50,
          unit_of_measure: 'N',
          min_threshold: 100,
          max_threshold: 200,
          is_within_range: false,
          notes: null,
          created_at: new Date(),
        });

        const result = await qualityService.createMetric(testCompanyId, {
          checkpointId: testCheckpointId,
          metricName: 'Strength',
          metricValue: 50,
          unitOfMeasure: 'N',
          minThreshold: 100,
          maxThreshold: 200,
        });

        expect(result.isWithinRange).toBe(false);
      });

      it('should mark metric as out of range when above maximum', async () => {
        (mockPrisma.quality_metrics.findFirst as jest.Mock).mockResolvedValue(null);
        (mockPrisma.quality_metrics.create as jest.Mock).mockResolvedValue({
          id: testMetricId,
          metric_id: 'QM001',
          company_id: testCompanyId,
          checkpoint_id: testCheckpointId,
          metric_name: 'Weight',
          metric_value: 250,
          unit_of_measure: 'g/m²',
          min_threshold: 100,
          max_threshold: 200,
          is_within_range: false,
          notes: null,
          created_at: new Date(),
        });

        const result = await qualityService.createMetric(testCompanyId, {
          checkpointId: testCheckpointId,
          metricName: 'Weight',
          metricValue: 250,
          unitOfMeasure: 'g/m²',
          minThreshold: 100,
          maxThreshold: 200,
        });

        expect(result.isWithinRange).toBe(false);
      });
    });

    describe('getMetricsByCheckpoint', () => {
      it('should retrieve metrics for a checkpoint', async () => {
        const mockMetrics = [
          {
            id: 'met1',
            metric_id: 'QM001',
            metric_name: 'Thread Count',
            metric_value: 200,
            unit_of_measure: 'threads/inch',
            min_threshold: 180,
            max_threshold: 220,
            is_within_range: true,
            notes: null,
            created_at: new Date(),
          },
        ];

        (mockPrisma.quality_metrics.findMany as jest.Mock).mockResolvedValue(mockMetrics);

        const result = await qualityService.getMetricsByCheckpoint(testCompanyId, testCheckpointId);

        expect(result).toHaveLength(1);
        expect(result[0].metricId).toBe('QM001');
        expect(result[0].isWithinRange).toBe(true);
      });
    });

    describe('deleteMetric', () => {
      it('should delete metric', async () => {
        (mockPrisma.quality_metrics.delete as jest.Mock).mockResolvedValue({});

        await qualityService.deleteMetric(testCompanyId, testMetricId);

        expect(mockPrisma.quality_metrics.delete).toHaveBeenCalledWith({
          where: {
            id: testMetricId,
            company_id: testCompanyId,
          },
        });
      });
    });
  });

  describe('Compliance Report Management', () => {
    describe('createComplianceReport', () => {
      it('should create compliance report with auto-generated ID', async () => {
        const mockReportData = {
          reportType: 'ISO_9001' as ComplianceType,
          reportDate: new Date('2024-01-15'),
          auditorName: 'Jane Auditor',
          certification: 'ISO 9001:2015',
          validityPeriod: '2024-2027',
          status: 'COMPLIANT' as ComplianceStatus,
          findings: 'All requirements met',
          recommendations: 'Continue current practices',
        };

        const mockCreatedReport = {
          id: testReportId,
          report_id: 'CR001',
          company_id: testCompanyId,
          report_type: 'ISO_9001' as ComplianceType,
          report_date: new Date('2024-01-15'),
          auditor_name: 'Jane Auditor',
          certification: 'ISO 9001:2015',
          validity_period: '2024-2027',
          status: 'COMPLIANT' as ComplianceStatus,
          findings: 'All requirements met',
          recommendations: 'Continue current practices',
          document_url: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        (mockPrisma.compliance_reports.findFirst as jest.Mock).mockResolvedValue(null);
        (mockPrisma.compliance_reports.create as jest.Mock).mockResolvedValue(mockCreatedReport);

        const result = await qualityService.createComplianceReport(testCompanyId, mockReportData);

        expect(result.reportId).toBe('CR001');
        expect(result.reportType).toBe('ISO_9001' as ComplianceType);
        expect(result.status).toBe('COMPLIANT' as ComplianceStatus);
      });

      it('should generate sequential report IDs', async () => {
        const mockLastReport = { report_id: 'CR005' };

        (mockPrisma.compliance_reports.findFirst as jest.Mock).mockResolvedValue(mockLastReport);
        (mockPrisma.compliance_reports.create as jest.Mock).mockResolvedValue({
          id: testReportId,
          report_id: 'CR006',
          company_id: testCompanyId,
          report_type: 'OEKO_TEX' as ComplianceType,
          report_date: new Date(),
          auditor_name: 'Auditor',
          status: 'PENDING_REVIEW' as ComplianceStatus,
          created_at: new Date(),
          updated_at: new Date(),
        });

        const result = await qualityService.createComplianceReport(testCompanyId, {
          reportType: 'OEKO_TEX' as ComplianceType,
          reportDate: new Date(),
          auditorName: 'Auditor',
          status: 'PENDING_REVIEW' as ComplianceStatus,
        });

        expect(result.reportId).toBe('CR006');
      });
    });

    describe('getComplianceReports', () => {
      it('should retrieve compliance reports filtered by company', async () => {
        const mockReports = [
          {
            id: 'rep1',
            report_id: 'CR001',
            company_id: testCompanyId,
            report_type: 'ISO_9001' as ComplianceType,
            report_date: new Date(),
            auditor_name: 'Jane Auditor',
            certification: 'ISO 9001:2015',
            validity_period: '2024-2027',
            status: 'COMPLIANT' as ComplianceStatus,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ];

        (mockPrisma.compliance_reports.findMany as jest.Mock).mockResolvedValue(mockReports);

        const result = await qualityService.getComplianceReports(testCompanyId);

        expect(result).toHaveLength(1);
        expect(result[0].reportId).toBe('CR001');
        expect(result[0].reportType).toBe('ISO_9001' as ComplianceType);
      });

      it('should filter reports by type', async () => {
        (mockPrisma.compliance_reports.findMany as jest.Mock).mockResolvedValue([]);

        await qualityService.getComplianceReports(testCompanyId, {
          reportType: 'GOTS' as ComplianceType,
        });

        expect(mockPrisma.compliance_reports.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              report_type: 'GOTS' as ComplianceType,
            }),
          })
        );
      });

      it('should return empty array if table does not exist', async () => {
        const error: any = new Error('Table does not exist');
        error.code = 'P2021';
        (mockPrisma.compliance_reports.findMany as jest.Mock).mockRejectedValue(error);

        const result = await qualityService.getComplianceReports(testCompanyId);

        expect(result).toEqual([]);
      });
    });

    describe('updateComplianceReport', () => {
      it('should update compliance report', async () => {
        const mockUpdatedReport = {
          id: testReportId,
          report_id: 'CR001',
          report_type: 'ISO_9001' as ComplianceType,
          report_date: new Date(),
          auditor_name: 'Updated Auditor',
          certification: 'ISO 9001:2015',
          validity_period: '2024-2027',
          status: 'COMPLIANT' as ComplianceStatus,
          findings: 'Updated findings',
          recommendations: 'Updated recommendations',
          document_url: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        (mockPrisma.compliance_reports.update as jest.Mock).mockResolvedValue(mockUpdatedReport);

        const result = await qualityService.updateComplianceReport(testCompanyId, testReportId, {
          auditorName: 'Updated Auditor',
          findings: 'Updated findings',
          recommendations: 'Updated recommendations',
        });

        expect(result.auditorName).toBe('Updated Auditor');
      });
    });

    describe('deleteComplianceReport', () => {
      it('should delete compliance report', async () => {
        (mockPrisma.compliance_reports.delete as jest.Mock).mockResolvedValue({});

        await qualityService.deleteComplianceReport(testCompanyId, testReportId);

        expect(mockPrisma.compliance_reports.delete).toHaveBeenCalledWith({
          where: {
            id: testReportId,
            company_id: testCompanyId,
          },
        });
      });
    });
  });
});
