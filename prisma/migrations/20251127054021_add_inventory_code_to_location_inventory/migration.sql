-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('NEW', 'IN_USE', 'UNDER_MAINTENANCE', 'UNDER_REPAIR', 'IDLE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "OperationalStatus" AS ENUM ('FREE', 'BUSY', 'RESERVED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('DAILY_CHECK', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "MaintenanceRecordStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BreakdownSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "BreakdownStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BreakdownPriority" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');

-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('ORDER', 'PRODUCTION', 'TRANSFER', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE', 'SALE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'PRODUCTION_IN', 'PRODUCTION_OUT', 'RETURN_IN', 'RETURN_OUT', 'DAMAGE');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK', 'EXPIRY_WARNING');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "care_instructions" TEXT,
ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "color_fastness" TEXT,
ADD COLUMN     "fabric_type" TEXT,
ADD COLUMN     "gsm" DECIMAL(8,2),
ADD COLUMN     "origin_country" TEXT,
ADD COLUMN     "seasonal_tag" TEXT,
ADD COLUMN     "shrinkage" DECIMAL(5,2),
ADD COLUMN     "supplier_info" JSONB,
ADD COLUMN     "thread_count" INTEGER,
ADD COLUMN     "weave_type" TEXT;

-- CreateTable
CREATE TABLE "product_pricing" (
    "id" TEXT NOT NULL,
    "pricing_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "tier_name" TEXT NOT NULL,
    "min_quantity" INTEGER NOT NULL DEFAULT 1,
    "max_quantity" INTEGER,
    "price" DECIMAL(12,2) NOT NULL,
    "discount_percent" DECIMAL(5,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "machine_code" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "location_id" TEXT,
    "name" TEXT NOT NULL,
    "machine_type" TEXT,
    "model" TEXT,
    "manufacturer" TEXT,
    "serial_number" TEXT,
    "purchase_date" TIMESTAMP(3),
    "warranty_expiry" TIMESTAMP(3),
    "specifications" JSONB,
    "image_url" TEXT,
    "qr_code" TEXT,
    "status" "MachineStatus" NOT NULL DEFAULT 'NEW',
    "operational_status" "OperationalStatus" NOT NULL DEFAULT 'FREE',
    "current_operator_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_status_history" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "previous_status" "MachineStatus",
    "new_status" "MachineStatus" NOT NULL,
    "changed_by" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_schedules" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "maintenance_type" "MaintenanceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency_days" INTEGER,
    "last_completed" TIMESTAMP(3),
    "next_due" TIMESTAMP(3) NOT NULL,
    "estimated_hours" DECIMAL(5,2),
    "assigned_technician" TEXT,
    "checklist" JSONB,
    "parts_required" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "company_id" TEXT NOT NULL,
    "maintenance_type" "MaintenanceType" NOT NULL,
    "performed_by" TEXT,
    "performed_date" TIMESTAMP(3) NOT NULL,
    "duration_hours" DECIMAL(5,2),
    "tasks_completed" JSONB,
    "parts_used" JSONB,
    "cost" DECIMAL(10,2),
    "notes" TEXT,
    "next_maintenance_date" TIMESTAMP(3),
    "status" "MaintenanceRecordStatus" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breakdown_reports" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "reported_by" TEXT,
    "severity" "BreakdownSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "breakdown_time" TIMESTAMP(3) NOT NULL,
    "resolved_time" TIMESTAMP(3),
    "assigned_technician" TEXT,
    "root_cause" TEXT,
    "resolution_notes" TEXT,
    "parts_used" JSONB,
    "labor_hours" DECIMAL(5,2),
    "repair_cost" DECIMAL(10,2),
    "downtime_hours" DECIMAL(8,2),
    "production_loss" DECIMAL(12,2),
    "status" "BreakdownStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "BreakdownPriority" NOT NULL DEFAULT 'MEDIUM',
    "images" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "breakdown_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_assignments" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "operator_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "shift_type" "ShiftType",
    "assigned_date" TIMESTAMP(3) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_inventory" (
    "id" TEXT NOT NULL,
    "inventory_code" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "stock_quantity" DECIMAL(12,3) NOT NULL,
    "reserved_quantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "available_quantity" DECIMAL(12,3) NOT NULL,
    "reorder_level" DECIMAL(12,3),
    "max_stock_level" DECIMAL(12,3),
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "location_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_reservations" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "order_id" TEXT,
    "reserved_quantity" DECIMAL(12,3) NOT NULL,
    "reservation_type" "ReservationType" NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "movement_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "from_location_id" TEXT,
    "to_location_id" TEXT,
    "movement_type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit_cost" DECIMAL(12,2),
    "total_cost" DECIMAL(12,2),
    "reference_type" TEXT,
    "reference_id" TEXT,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_alerts" (
    "id" TEXT NOT NULL,
    "alert_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "alert_type" "AlertType" NOT NULL,
    "current_stock" DECIMAL(12,3) NOT NULL,
    "threshold_level" DECIMAL(12,3) NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_pricing_product_id_idx" ON "product_pricing"("product_id");

-- CreateIndex
CREATE INDEX "product_pricing_company_id_idx" ON "product_pricing"("company_id");

-- CreateIndex
CREATE INDEX "product_pricing_tier_name_idx" ON "product_pricing"("tier_name");

-- CreateIndex
CREATE INDEX "product_pricing_effective_from_idx" ON "product_pricing"("effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "product_pricing_company_id_pricing_id_key" ON "product_pricing"("company_id", "pricing_id");

-- CreateIndex
CREATE INDEX "machines_company_id_idx" ON "machines"("company_id");

-- CreateIndex
CREATE INDEX "machines_location_id_idx" ON "machines"("location_id");

-- CreateIndex
CREATE INDEX "machines_status_idx" ON "machines"("status");

-- CreateIndex
CREATE INDEX "machines_machine_type_idx" ON "machines"("machine_type");

-- CreateIndex
CREATE UNIQUE INDEX "machines_company_id_machine_id_key" ON "machines"("company_id", "machine_id");

-- CreateIndex
CREATE UNIQUE INDEX "machines_company_id_machine_code_key" ON "machines"("company_id", "machine_code");

-- CreateIndex
CREATE INDEX "machine_status_history_machine_id_idx" ON "machine_status_history"("machine_id");

-- CreateIndex
CREATE INDEX "machine_status_history_company_id_idx" ON "machine_status_history"("company_id");

-- CreateIndex
CREATE INDEX "machine_status_history_created_at_idx" ON "machine_status_history"("created_at");

-- CreateIndex
CREATE INDEX "maintenance_schedules_machine_id_idx" ON "maintenance_schedules"("machine_id");

-- CreateIndex
CREATE INDEX "maintenance_schedules_company_id_idx" ON "maintenance_schedules"("company_id");

-- CreateIndex
CREATE INDEX "maintenance_schedules_next_due_idx" ON "maintenance_schedules"("next_due");

-- CreateIndex
CREATE INDEX "maintenance_schedules_maintenance_type_idx" ON "maintenance_schedules"("maintenance_type");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_schedules_company_id_schedule_id_key" ON "maintenance_schedules"("company_id", "schedule_id");

-- CreateIndex
CREATE INDEX "maintenance_records_machine_id_idx" ON "maintenance_records"("machine_id");

-- CreateIndex
CREATE INDEX "maintenance_records_schedule_id_idx" ON "maintenance_records"("schedule_id");

-- CreateIndex
CREATE INDEX "maintenance_records_company_id_idx" ON "maintenance_records"("company_id");

-- CreateIndex
CREATE INDEX "maintenance_records_performed_date_idx" ON "maintenance_records"("performed_date");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_records_company_id_record_id_key" ON "maintenance_records"("company_id", "record_id");

-- CreateIndex
CREATE INDEX "breakdown_reports_machine_id_idx" ON "breakdown_reports"("machine_id");

-- CreateIndex
CREATE INDEX "breakdown_reports_company_id_idx" ON "breakdown_reports"("company_id");

-- CreateIndex
CREATE INDEX "breakdown_reports_status_idx" ON "breakdown_reports"("status");

-- CreateIndex
CREATE INDEX "breakdown_reports_severity_idx" ON "breakdown_reports"("severity");

-- CreateIndex
CREATE INDEX "breakdown_reports_breakdown_time_idx" ON "breakdown_reports"("breakdown_time");

-- CreateIndex
CREATE UNIQUE INDEX "breakdown_reports_company_id_ticket_id_key" ON "breakdown_reports"("company_id", "ticket_id");

-- CreateIndex
CREATE INDEX "machine_assignments_machine_id_idx" ON "machine_assignments"("machine_id");

-- CreateIndex
CREATE INDEX "machine_assignments_operator_id_idx" ON "machine_assignments"("operator_id");

-- CreateIndex
CREATE INDEX "machine_assignments_company_id_idx" ON "machine_assignments"("company_id");

-- CreateIndex
CREATE INDEX "machine_assignments_assigned_date_idx" ON "machine_assignments"("assigned_date");

-- CreateIndex
CREATE INDEX "location_inventory_company_id_idx" ON "location_inventory"("company_id");

-- CreateIndex
CREATE INDEX "location_inventory_location_id_idx" ON "location_inventory"("location_id");

-- CreateIndex
CREATE INDEX "location_inventory_product_id_idx" ON "location_inventory"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_inventory_company_id_inventory_code_key" ON "location_inventory"("company_id", "inventory_code");

-- CreateIndex
CREATE UNIQUE INDEX "location_inventory_product_id_location_id_key" ON "location_inventory"("product_id", "location_id");

-- CreateIndex
CREATE INDEX "stock_reservations_company_id_idx" ON "stock_reservations"("company_id");

-- CreateIndex
CREATE INDEX "stock_reservations_product_id_idx" ON "stock_reservations"("product_id");

-- CreateIndex
CREATE INDEX "stock_reservations_location_id_idx" ON "stock_reservations"("location_id");

-- CreateIndex
CREATE INDEX "stock_reservations_order_id_idx" ON "stock_reservations"("order_id");

-- CreateIndex
CREATE INDEX "stock_reservations_status_idx" ON "stock_reservations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "stock_reservations_company_id_reservation_id_key" ON "stock_reservations"("company_id", "reservation_id");

-- CreateIndex
CREATE INDEX "stock_movements_company_id_idx" ON "stock_movements"("company_id");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "stock_movements_from_location_id_idx" ON "stock_movements"("from_location_id");

-- CreateIndex
CREATE INDEX "stock_movements_to_location_id_idx" ON "stock_movements"("to_location_id");

-- CreateIndex
CREATE INDEX "stock_movements_movement_type_idx" ON "stock_movements"("movement_type");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_company_id_movement_id_key" ON "stock_movements"("company_id", "movement_id");

-- CreateIndex
CREATE INDEX "stock_alerts_company_id_idx" ON "stock_alerts"("company_id");

-- CreateIndex
CREATE INDEX "stock_alerts_product_id_idx" ON "stock_alerts"("product_id");

-- CreateIndex
CREATE INDEX "stock_alerts_location_id_idx" ON "stock_alerts"("location_id");

-- CreateIndex
CREATE INDEX "stock_alerts_status_idx" ON "stock_alerts"("status");

-- CreateIndex
CREATE INDEX "stock_alerts_alert_type_idx" ON "stock_alerts"("alert_type");

-- CreateIndex
CREATE UNIQUE INDEX "stock_alerts_company_id_alert_id_key" ON "stock_alerts"("company_id", "alert_id");

-- AddForeignKey
ALTER TABLE "product_pricing" ADD CONSTRAINT "product_pricing_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "company_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_current_operator_id_fkey" FOREIGN KEY ("current_operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_status_history" ADD CONSTRAINT "machine_status_history_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "maintenance_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breakdown_reports" ADD CONSTRAINT "breakdown_reports_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_assignments" ADD CONSTRAINT "machine_assignments_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_inventory" ADD CONSTRAINT "location_inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_inventory" ADD CONSTRAINT "location_inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "company_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "company_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "company_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "company_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "company_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
