/*
  Warnings:

  - The `industry` column on the `companies` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "IndustryType" AS ENUM ('TEXTILE', 'FOOD_BEVERAGE', 'AUTOMOTIVE', 'PHARMACEUTICAL', 'ELECTRONICS', 'GENERAL');

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "industry",
ADD COLUMN     "industry" "IndustryType" NOT NULL DEFAULT 'TEXTILE';
