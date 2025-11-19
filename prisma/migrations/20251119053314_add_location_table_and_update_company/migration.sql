-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('BRANCH', 'WAREHOUSE', 'FACTORY', 'STORE');

-- CreateTable
CREATE TABLE "company_locations" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_headquarters" BOOLEAN NOT NULL DEFAULT false,
    "location_type" "LocationType" NOT NULL DEFAULT 'BRANCH',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_locations_location_id_key" ON "company_locations"("location_id");

-- AddForeignKey
ALTER TABLE "company_locations" ADD CONSTRAINT "company_locations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
