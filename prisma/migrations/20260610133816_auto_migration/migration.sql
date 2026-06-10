/*
  Warnings:

  - You are about to drop the column `name` on the `selectionists` table. All the data in the column will be lost.
  - Added the required column `nameTID` to the `selectionists` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "selectionists" DROP COLUMN "name",
ADD COLUMN     "nameTID" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "selectionists" ADD CONSTRAINT "selectionists_nameTID_fkey" FOREIGN KEY ("nameTID") REFERENCES "translations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
