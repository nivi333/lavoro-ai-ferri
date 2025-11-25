-- AlterTable
ALTER TABLE "compliance_reports" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "quality_checkpoints" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "quality_defects" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "quality_inspections" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
