/*
  Warnings:

  - A unique constraint covering the columns `[report_code]` on the table `compliance_reports` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('OWN_MANUFACTURE', 'VENDOR_SUPPLIED', 'OUTSOURCED', 'RAW_MATERIAL', 'FINISHED_GOODS', 'SEMI_FINISHED');

-- AlterEnum
ALTER TYPE "CheckpointType" ADD VALUE 'BATCH_TEST';

-- AlterTable
ALTER TABLE "compliance_reports" ADD COLUMN     "report_code" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "product_type" "ProductType" NOT NULL DEFAULT 'OWN_MANUFACTURE';

-- AlterTable
ALTER TABLE "quality_checkpoints" ADD COLUMN     "batch_number" TEXT,
ADD COLUMN     "lot_number" TEXT,
ADD COLUMN     "product_id" TEXT,
ADD COLUMN     "sample_size" INTEGER,
ADD COLUMN     "tested_quantity" INTEGER,
ADD COLUMN     "total_batch" INTEGER;

-- AlterTable
ALTER TABLE "quality_defects" ADD COLUMN     "affected_items" INTEGER,
ADD COLUMN     "batch_number" TEXT,
ADD COLUMN     "lot_number" TEXT,
ADD COLUMN     "product_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "compliance_reports_report_code_key" ON "compliance_reports"("report_code");

-- CreateIndex
CREATE INDEX "quality_checkpoints_batch_number_idx" ON "quality_checkpoints"("batch_number");

-- CreateIndex
CREATE INDEX "quality_checkpoints_product_id_idx" ON "quality_checkpoints"("product_id");

-- CreateIndex
CREATE INDEX "quality_defects_batch_number_idx" ON "quality_defects"("batch_number");

-- CreateIndex
CREATE INDEX "quality_defects_product_id_idx" ON "quality_defects"("product_id");

-- AddForeignKey
ALTER TABLE "quality_checkpoints" ADD CONSTRAINT "quality_checkpoints_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_defects" ADD CONSTRAINT "quality_defects_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
