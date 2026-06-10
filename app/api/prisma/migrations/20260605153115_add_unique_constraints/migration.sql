/*
  Warnings:

  - A unique constraint covering the columns `[memberId,category]` on the table `Preference` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[spinId,memberId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Preference_memberId_category_key" ON "Preference"("memberId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_spinId_memberId_key" ON "Vote"("spinId", "memberId");
