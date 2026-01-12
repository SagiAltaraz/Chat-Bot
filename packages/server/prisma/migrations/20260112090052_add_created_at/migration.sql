/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `summaries` table. All the data in the column will be lost.
  - Added the required column `updateAt` to the `summaries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `summaries` DROP COLUMN `updatedAt`,
    ADD COLUMN `updateAt` DATETIME(3) NOT NULL;
