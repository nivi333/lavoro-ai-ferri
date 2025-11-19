/*
  Warnings:

  - Made the column `address_line_1` on table `company_locations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `company_locations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `country` on table `company_locations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `company_locations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "company_locations" ADD COLUMN     "contact_info" JSONB,
ALTER COLUMN "address_line_1" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL;
