/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Tweet` table. All the data in the column will be lost.
  - You are about to drop the column `impression` on the `Tweet` table. All the data in the column will be lost.
  - You are about to drop the column `likesCount` on the `Tweet` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Tweet` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Like_tweetId_userId_key";

-- AlterTable
ALTER TABLE "Tweet" DROP COLUMN "createdAt",
DROP COLUMN "impression",
DROP COLUMN "likesCount",
DROP COLUMN "updatedAt";

-- CreateIndex
CREATE INDEX "idx_like_tweet" ON "Like"("tweetId");

-- CreateIndex
CREATE INDEX "idx_like_user" ON "Like"("userId");

-- CreateIndex
CREATE INDEX "idx_tweet_user" ON "Tweet"("userId");
