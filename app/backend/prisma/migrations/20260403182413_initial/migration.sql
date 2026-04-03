/*
  Warnings:

  - You are about to drop the column `idealni_zalivani_interval` on the `druhy` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "rody" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nazev" TEXT NOT NULL,
    "popis" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_druhy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nazev" TEXT NOT NULL,
    "popis" TEXT,
    "rod_id" INTEGER,
    "idealni_medium_id" INTEGER,
    "fotka1_name" TEXT,
    "fotka2_name" TEXT,
    CONSTRAINT "druhy_rod_id_fkey" FOREIGN KEY ("rod_id") REFERENCES "rody" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "druhy_idealni_medium_id_fkey" FOREIGN KEY ("idealni_medium_id") REFERENCES "media" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_druhy" ("fotka1_name", "fotka2_name", "id", "idealni_medium_id", "nazev", "popis") SELECT "fotka1_name", "fotka2_name", "id", "idealni_medium_id", "nazev", "popis" FROM "druhy";
DROP TABLE "druhy";
ALTER TABLE "new_druhy" RENAME TO "druhy";
CREATE UNIQUE INDEX "druhy_nazev_key" ON "druhy"("nazev");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "rody_nazev_key" ON "rody"("nazev");
