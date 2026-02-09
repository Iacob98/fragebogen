-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "submission_items" ADD COLUMN     "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0;
