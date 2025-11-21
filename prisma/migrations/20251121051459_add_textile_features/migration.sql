-- CreateEnum
CREATE TYPE "FabricType" AS ENUM ('COTTON', 'SILK', 'WOOL', 'POLYESTER', 'NYLON', 'LINEN', 'RAYON', 'SPANDEX', 'BLEND');

-- CreateEnum
CREATE TYPE "QualityGrade" AS ENUM ('A_GRADE', 'B_GRADE', 'C_GRADE', 'REJECT');

-- CreateEnum
CREATE TYPE "YarnType" AS ENUM ('COTTON', 'POLYESTER', 'WOOL', 'SILK', 'ACRYLIC', 'NYLON', 'BLEND');

-- CreateEnum
CREATE TYPE "YarnProcess" AS ENUM ('SPINNING', 'WEAVING', 'KNITTING', 'TWISTING');

-- CreateEnum
CREATE TYPE "DyeingProcess" AS ENUM ('DYEING', 'PRINTING', 'FINISHING', 'WASHING', 'BLEACHING', 'MERCERIZING');

-- CreateEnum
CREATE TYPE "GarmentType" AS ENUM ('SHIRT', 'T_SHIRT', 'PANTS', 'JEANS', 'DRESS', 'SKIRT', 'JACKET', 'COAT', 'SWEATER', 'SHORTS', 'UNDERWEAR', 'SOCKS');

-- CreateEnum
CREATE TYPE "ProductionStage" AS ENUM ('CUTTING', 'SEWING', 'FINISHING', 'QUALITY_CHECK', 'PACKING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DesignCategory" AS ENUM ('PRINT', 'EMBROIDERY', 'WEAVE', 'KNIT', 'APPLIQUE', 'DIGITAL_PRINT');

-- CreateEnum
CREATE TYPE "DesignStatus" AS ENUM ('CONCEPT', 'APPROVED', 'IN_PRODUCTION', 'ARCHIVED');

-- CreateTable
CREATE TABLE "fabric_production" (
    "id" TEXT NOT NULL,
    "fabric_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "location_id" TEXT,
    "fabric_type" "FabricType" NOT NULL,
    "fabric_name" TEXT NOT NULL,
    "composition" TEXT NOT NULL,
    "weight_gsm" DECIMAL(8,2) NOT NULL,
    "width_inches" DECIMAL(6,2) NOT NULL,
    "color" TEXT NOT NULL,
    "pattern" TEXT,
    "finish_type" TEXT,
    "quantity_meters" DECIMAL(10,2) NOT NULL,
    "production_date" TIMESTAMP(3) NOT NULL,
    "batch_number" TEXT NOT NULL,
    "quality_grade" "QualityGrade" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabric_production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_manufacturing" (
    "id" TEXT NOT NULL,
    "yarn_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "location_id" TEXT,
    "yarn_type" "YarnType" NOT NULL,
    "yarn_count" TEXT NOT NULL,
    "twist_per_inch" DECIMAL(6,2),
    "ply" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "dye_lot" TEXT,
    "quantity_kg" DECIMAL(10,2) NOT NULL,
    "production_date" TIMESTAMP(3) NOT NULL,
    "batch_number" TEXT NOT NULL,
    "process_type" "YarnProcess" NOT NULL,
    "quality_grade" "QualityGrade" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yarn_manufacturing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dyeing_finishing" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "location_id" TEXT,
    "fabric_id" TEXT,
    "process_type" "DyeingProcess" NOT NULL,
    "color_code" TEXT NOT NULL,
    "color_name" TEXT NOT NULL,
    "dye_method" TEXT,
    "recipe_code" TEXT,
    "quantity_meters" DECIMAL(10,2) NOT NULL,
    "process_date" TIMESTAMP(3) NOT NULL,
    "batch_number" TEXT NOT NULL,
    "machine_number" TEXT,
    "temperature_c" DECIMAL(5,2),
    "duration_minutes" INTEGER,
    "quality_check" BOOLEAN NOT NULL DEFAULT false,
    "color_fastness" TEXT,
    "shrinkage_percent" DECIMAL(5,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dyeing_finishing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garment_manufacturing" (
    "id" TEXT NOT NULL,
    "garment_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "location_id" TEXT,
    "order_id" TEXT,
    "garment_type" "GarmentType" NOT NULL,
    "style_number" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "fabric_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "production_stage" "ProductionStage" NOT NULL,
    "cut_date" TIMESTAMP(3),
    "sew_date" TIMESTAMP(3),
    "finish_date" TIMESTAMP(3),
    "pack_date" TIMESTAMP(3),
    "operator_name" TEXT,
    "line_number" TEXT,
    "quality_passed" BOOLEAN NOT NULL DEFAULT false,
    "defect_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garment_manufacturing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_patterns" (
    "id" TEXT NOT NULL,
    "design_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "design_name" TEXT NOT NULL,
    "design_category" "DesignCategory" NOT NULL,
    "designer_name" TEXT,
    "season" TEXT,
    "color_palette" TEXT[],
    "pattern_repeat" TEXT,
    "design_file_url" TEXT,
    "sample_image_url" TEXT,
    "status" "DesignStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fabric_production_company_id_idx" ON "fabric_production"("company_id");

-- CreateIndex
CREATE INDEX "fabric_production_fabric_type_idx" ON "fabric_production"("fabric_type");

-- CreateIndex
CREATE INDEX "fabric_production_quality_grade_idx" ON "fabric_production"("quality_grade");

-- CreateIndex
CREATE UNIQUE INDEX "fabric_production_company_id_fabric_id_key" ON "fabric_production"("company_id", "fabric_id");

-- CreateIndex
CREATE INDEX "yarn_manufacturing_company_id_idx" ON "yarn_manufacturing"("company_id");

-- CreateIndex
CREATE INDEX "yarn_manufacturing_yarn_type_idx" ON "yarn_manufacturing"("yarn_type");

-- CreateIndex
CREATE INDEX "yarn_manufacturing_process_type_idx" ON "yarn_manufacturing"("process_type");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_manufacturing_company_id_yarn_id_key" ON "yarn_manufacturing"("company_id", "yarn_id");

-- CreateIndex
CREATE INDEX "dyeing_finishing_company_id_idx" ON "dyeing_finishing"("company_id");

-- CreateIndex
CREATE INDEX "dyeing_finishing_process_type_idx" ON "dyeing_finishing"("process_type");

-- CreateIndex
CREATE UNIQUE INDEX "dyeing_finishing_company_id_process_id_key" ON "dyeing_finishing"("company_id", "process_id");

-- CreateIndex
CREATE INDEX "garment_manufacturing_company_id_idx" ON "garment_manufacturing"("company_id");

-- CreateIndex
CREATE INDEX "garment_manufacturing_garment_type_idx" ON "garment_manufacturing"("garment_type");

-- CreateIndex
CREATE INDEX "garment_manufacturing_production_stage_idx" ON "garment_manufacturing"("production_stage");

-- CreateIndex
CREATE INDEX "garment_manufacturing_order_id_idx" ON "garment_manufacturing"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "garment_manufacturing_company_id_garment_id_key" ON "garment_manufacturing"("company_id", "garment_id");

-- CreateIndex
CREATE INDEX "design_patterns_company_id_idx" ON "design_patterns"("company_id");

-- CreateIndex
CREATE INDEX "design_patterns_design_category_idx" ON "design_patterns"("design_category");

-- CreateIndex
CREATE INDEX "design_patterns_status_idx" ON "design_patterns"("status");

-- CreateIndex
CREATE UNIQUE INDEX "design_patterns_company_id_design_id_key" ON "design_patterns"("company_id", "design_id");

-- AddForeignKey
ALTER TABLE "fabric_production" ADD CONSTRAINT "fabric_production_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabric_production" ADD CONSTRAINT "fabric_production_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "company_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_manufacturing" ADD CONSTRAINT "yarn_manufacturing_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_manufacturing" ADD CONSTRAINT "yarn_manufacturing_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "company_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dyeing_finishing" ADD CONSTRAINT "dyeing_finishing_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dyeing_finishing" ADD CONSTRAINT "dyeing_finishing_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "company_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garment_manufacturing" ADD CONSTRAINT "garment_manufacturing_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garment_manufacturing" ADD CONSTRAINT "garment_manufacturing_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "company_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garment_manufacturing" ADD CONSTRAINT "garment_manufacturing_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_patterns" ADD CONSTRAINT "design_patterns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
