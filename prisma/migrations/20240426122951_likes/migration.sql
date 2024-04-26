/*
  Warnings:

  - You are about to drop the column `likes` on the `Tweet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tweet" DROP COLUMN "likes";

-- CreateTable
CREATE TABLE "Like" (
    "id" SERIAL NOT NULL,
    "tweetId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
