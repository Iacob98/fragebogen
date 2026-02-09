-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "has_radiator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "photo_complete" BOOLEAN NOT NULL DEFAULT false;
