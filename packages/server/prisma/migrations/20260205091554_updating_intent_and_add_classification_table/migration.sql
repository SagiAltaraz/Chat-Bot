/*
  Warnings:

  - You are about to drop the column `name` on the `intents` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `intents` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `intents` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `intents_name_key` ON `intents`;

-- AlterTable
ALTER TABLE `intents` DROP COLUMN `name`,
    ADD COLUMN `slug` VARCHAR(50) NOT NULL;

-- CreateTable
CREATE TABLE `intent_classifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` VARCHAR(255) NOT NULL,
    `userInput` TEXT NOT NULL,
    `intentId` INTEGER NOT NULL,
    `confidence` DOUBLE NOT NULL,
    `parameters` JSON NULL,
    `modelUsed` VARCHAR(50) NOT NULL DEFAULT 'gpt-4o-mini',
    `promptVersion` VARCHAR(20) NOT NULL DEFAULT 'v1',
    `isCorrect` BOOLEAN NULL,
    `correction` TEXT NULL,
    `classifiedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `intent_classifications_conversationId_idx`(`conversationId`),
    INDEX `intent_classifications_confidence_idx`(`confidence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `intents_slug_key` ON `intents`(`slug`);

-- AddForeignKey
ALTER TABLE `intent_classifications` ADD CONSTRAINT `intent_classifications_intentId_fkey` FOREIGN KEY (`intentId`) REFERENCES `intents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
