/*
  Warnings:

  - The values [COMPLETED] on the enum `MaintenanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `clientId` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MaintenanceStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'ARCHIVED', 'NEEDS_VISIT', 'INCOMPLETE', 'CANCELLED', 'REJECTED');
ALTER TABLE "public"."MaintenanceLog" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "MaintenanceLog" ALTER COLUMN "status" TYPE "MaintenanceStatus_new" USING ("status"::text::"MaintenanceStatus_new");
ALTER TYPE "MaintenanceStatus" RENAME TO "MaintenanceStatus_old";
ALTER TYPE "MaintenanceStatus_new" RENAME TO "MaintenanceStatus";
DROP TYPE "public"."MaintenanceStatus_old";
ALTER TABLE "MaintenanceLog" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_clientId_fkey";

-- AlterTable
ALTER TABLE "MaintenanceLog" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "clientId";

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClientToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClientToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ClientToUser_B_index" ON "_ClientToUser"("B");

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientToUser" ADD CONSTRAINT "_ClientToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientToUser" ADD CONSTRAINT "_ClientToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
