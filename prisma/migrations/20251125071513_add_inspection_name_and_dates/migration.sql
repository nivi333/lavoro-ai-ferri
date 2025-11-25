-- DropForeignKey
ALTER TABLE "quality_inspections" DROP CONSTRAINT "quality_inspections_inspector_id_fkey";

-- AlterTable
ALTER TABLE "quality_inspections" ADD COLUMN     "inspection_date" TIMESTAMP(3),
ADD COLUMN     "inspector_name" TEXT,
ADD COLUMN     "next_inspection_date" TIMESTAMP(3),
ALTER COLUMN "inspector_id" DROP NOT NULL,
ALTER COLUMN "scheduled_date" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
