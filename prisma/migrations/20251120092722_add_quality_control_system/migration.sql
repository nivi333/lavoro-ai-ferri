-- CreateEnum
CREATE TYPE "CheckpointType" AS ENUM ('INCOMING_MATERIAL', 'IN_PROCESS', 'FINAL_INSPECTION', 'PACKAGING', 'RANDOM_SAMPLING');

-- CreateEnum
CREATE TYPE "QCStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CONDITIONAL_PASS', 'REWORK_REQUIRED');

-- CreateEnum
CREATE TYPE "DefectCategory" AS ENUM ('FABRIC', 'STITCHING', 'COLOR', 'MEASUREMENT', 'PACKAGING', 'FINISHING', 'LABELING');

-- CreateEnum
CREATE TYPE "DefectSeverity" AS ENUM ('CRITICAL', 'MAJOR', 'MINOR');

-- CreateEnum
CREATE TYPE "ResolutionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComplianceType" AS ENUM ('ISO_9001', 'ISO_14001', 'OEKO_TEX', 'GOTS', 'WRAP', 'SA8000', 'BSCI', 'SEDEX');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('COMPLIANT', 'NON_COMPLIANT', 'PENDING_REVIEW', 'EXPIRED');

-- CreateTable
CREATE TABLE "quality_checkpoints" (
    "id" TEXT NOT NULL,
    "checkpoint_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "location_id" TEXT,
    "order_id" TEXT,
    "checkpoint_type" "CheckpointType" NOT NULL,
    "checkpoint_name" TEXT NOT NULL,
    "inspector_name" TEXT NOT NULL,
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "status" "QCStatus" NOT NULL,
    "overall_score" DECIMAL(5,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_defects" (
    "id" TEXT NOT NULL,
    "defect_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "checkpoint_id" TEXT NOT NULL,
    "defect_category" "DefectCategory" NOT NULL,
    "defect_type" TEXT NOT NULL,
    "severity" "DefectSeverity" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "resolution_status" "ResolutionStatus" NOT NULL,
    "resolution_notes" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_defects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_metrics" (
    "id" TEXT NOT NULL,
    "metric_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "checkpoint_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "metric_value" DECIMAL(10,4) NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "min_threshold" DECIMAL(10,4),
    "max_threshold" DECIMAL(10,4),
    "is_within_range" BOOLEAN NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_reports" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "report_type" "ComplianceType" NOT NULL,
    "report_date" TIMESTAMP(3) NOT NULL,
    "auditor_name" TEXT NOT NULL,
    "certification" TEXT,
    "validity_period" TEXT,
    "status" "ComplianceStatus" NOT NULL,
    "findings" TEXT,
    "recommendations" TEXT,
    "document_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quality_checkpoints_checkpoint_id_key" ON "quality_checkpoints"("checkpoint_id");

-- CreateIndex
CREATE INDEX "quality_checkpoints_company_id_idx" ON "quality_checkpoints"("company_id");

-- CreateIndex
CREATE INDEX "quality_checkpoints_checkpoint_type_idx" ON "quality_checkpoints"("checkpoint_type");

-- CreateIndex
CREATE INDEX "quality_checkpoints_status_idx" ON "quality_checkpoints"("status");

-- CreateIndex
CREATE UNIQUE INDEX "quality_defects_defect_id_key" ON "quality_defects"("defect_id");

-- CreateIndex
CREATE INDEX "quality_defects_company_id_idx" ON "quality_defects"("company_id");

-- CreateIndex
CREATE INDEX "quality_defects_defect_category_idx" ON "quality_defects"("defect_category");

-- CreateIndex
CREATE INDEX "quality_defects_severity_idx" ON "quality_defects"("severity");

-- CreateIndex
CREATE INDEX "quality_defects_resolution_status_idx" ON "quality_defects"("resolution_status");

-- CreateIndex
CREATE UNIQUE INDEX "quality_metrics_metric_id_key" ON "quality_metrics"("metric_id");

-- CreateIndex
CREATE INDEX "quality_metrics_company_id_idx" ON "quality_metrics"("company_id");

-- CreateIndex
CREATE INDEX "quality_metrics_checkpoint_id_idx" ON "quality_metrics"("checkpoint_id");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_reports_report_id_key" ON "compliance_reports"("report_id");

-- CreateIndex
CREATE INDEX "compliance_reports_company_id_idx" ON "compliance_reports"("company_id");

-- CreateIndex
CREATE INDEX "compliance_reports_report_type_idx" ON "compliance_reports"("report_type");

-- CreateIndex
CREATE INDEX "compliance_reports_status_idx" ON "compliance_reports"("status");

-- AddForeignKey
ALTER TABLE "quality_checkpoints" ADD CONSTRAINT "quality_checkpoints_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checkpoints" ADD CONSTRAINT "quality_checkpoints_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "company_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checkpoints" ADD CONSTRAINT "quality_checkpoints_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_defects" ADD CONSTRAINT "quality_defects_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_defects" ADD CONSTRAINT "quality_defects_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "quality_checkpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_metrics" ADD CONSTRAINT "quality_metrics_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_metrics" ADD CONSTRAINT "quality_metrics_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "quality_checkpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
