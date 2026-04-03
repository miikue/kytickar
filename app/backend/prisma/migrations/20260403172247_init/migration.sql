-- CreateTable
CREATE TABLE "media" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nazev" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "druhy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nazev" TEXT NOT NULL,
    "popis" TEXT,
    "idealni_zalivani_interval" INTEGER,
    "idealni_medium_id" INTEGER,
    "fotka1_name" TEXT,
    "fotka2_name" TEXT,
    CONSTRAINT "druhy_idealni_medium_id_fkey" FOREIGN KEY ("idealni_medium_id") REFERENCES "media" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "umisteni" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nazev" TEXT NOT NULL,
    "parent_id" INTEGER,
    CONSTRAINT "umisteni_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "umisteni" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rostliny" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vlastni_jmeno" TEXT NOT NULL,
    "aktualni_zdravi" INTEGER NOT NULL DEFAULT 5,
    "datum_porizeni" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medium_id" INTEGER,
    "umisteni_id" INTEGER,
    "druh_id" INTEGER NOT NULL,
    CONSTRAINT "rostliny_medium_id_fkey" FOREIGN KEY ("medium_id") REFERENCES "media" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rostliny_umisteni_id_fkey" FOREIGN KEY ("umisteni_id") REFERENCES "umisteni" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rostliny_druh_id_fkey" FOREIGN KEY ("druh_id") REFERENCES "druhy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "typy_akci" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "typ_akce" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "historie_pece" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rostlina_id" INTEGER NOT NULL,
    "datum" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "typ_akce_id" INTEGER NOT NULL,
    CONSTRAINT "historie_pece_rostlina_id_fkey" FOREIGN KEY ("rostlina_id") REFERENCES "rostliny" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "historie_pece_typ_akce_id_fkey" FOREIGN KEY ("typ_akce_id") REFERENCES "typy_akci" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "odlozene_akce" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rostlina_id" INTEGER NOT NULL,
    "datum" DATETIME NOT NULL,
    "datum_pripomenuti" DATETIME NOT NULL,
    "typ_akce_id" INTEGER NOT NULL,
    CONSTRAINT "odlozene_akce_rostlina_id_fkey" FOREIGN KEY ("rostlina_id") REFERENCES "rostliny" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "odlozene_akce_typ_akce_id_fkey" FOREIGN KEY ("typ_akce_id") REFERENCES "typy_akci" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "galerie_fotky" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rostlina_id" INTEGER NOT NULL,
    "fotka_name" TEXT NOT NULL,
    "datum_porizeni" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poznamka" TEXT,
    CONSTRAINT "galerie_fotky_rostlina_id_fkey" FOREIGN KEY ("rostlina_id") REFERENCES "rostliny" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "media_nazev_key" ON "media"("nazev");

-- CreateIndex
CREATE UNIQUE INDEX "druhy_nazev_key" ON "druhy"("nazev");
