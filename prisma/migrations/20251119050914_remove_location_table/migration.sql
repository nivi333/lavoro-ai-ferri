/*
  Warnings:

  - You are about to drop the `company_locations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "company_locations" DROP CONSTRAINT "company_locations_company_id_fkey";

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "default_location" TEXT;

-- DropTable
DROP TABLE "company_locations";

-- DropEnum
DROP TYPE "LocationType";
