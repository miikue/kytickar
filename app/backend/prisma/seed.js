import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const media = [
  { nazev: 'Zemina', popis: 'Univerzální substrát pro pokojovky' },
  { nazev: 'Voda', popis: 'Čistá voda pro hydroponii nebo zakořeňování' },
  { nazev: 'Perlit', popis: 'Anorganický materiál pro provzdušnění' },
  { nazev: 'Kůra', popis: 'Borovicová nebo modřínová kůra' },
  { nazev: 'Písek', popis: 'Křemičitý písek pro lepší drenáž' },
  { nazev: 'Keramzit', popis: 'Drenážní vrstva na dno květináče' },
  { nazev: 'Kokos', popis: 'Kokosové chipsy nebo vlákno' },
  { nazev: 'Rašeliník', popis: 'Sphagnum moss pro air-layering' },
  { nazev: 'Vodka', popis: 'Pro lepší zážitek při přesazování' },
];

const rody = [
  'Monstera', 'Ficus', 'Peperomia', 'Philodendron', 
  'Alocasia', 'Syngonium', 'Epipremnum', 'Sansevieria', 
  'Calathea', 'Anthurium', 'Hoya'
];

const umisteniSeed = [
  'Obyvak - okno jih',
  'Loznice - police',
  'Pracovna - stul',
  'Koupelna - parapet',
];

const druhySeed = [
  { nazev: 'Monstera deliciosa', popis: 'Velke dekorativni listy s perforaci', rodNazev: 'Monstera' },
  { nazev: 'Monstera adansonii', popis: 'Rychle rostouci popinava monstera', rodNazev: 'Monstera' },
  { nazev: 'Ficus elastica', popis: 'Pryzovnik, odolny a vhodny i pro zacatecniky', rodNazev: 'Ficus' },
  { nazev: 'Philodendron hederaceum', popis: 'Popinavy filodendron se srdcitym listem', rodNazev: 'Philodendron' },
  { nazev: 'Epipremnum aureum', popis: 'Potos, nenarocna rostlina do bytu', rodNazev: 'Epipremnum' },
  { nazev: 'Sansevieria trifasciata', popis: 'Tchynin jazyk, snasi susi podminky', rodNazev: 'Sansevieria' },
];

const rostlinySeed = [
  { vlastniJmeno: 'Moni', druhNazev: 'Monstera deliciosa', mediumNazev: 'Zemina', umisteniNazev: 'Obyvak - okno jih', aktualniZdravi: 5 },
  { vlastniJmeno: 'Ada', druhNazev: 'Monstera adansonii', mediumNazev: 'Kokos', umisteniNazev: 'Pracovna - stul', aktualniZdravi: 4 },
  { vlastniJmeno: 'Fikusak', druhNazev: 'Ficus elastica', mediumNazev: 'Zemina', umisteniNazev: 'Loznice - police', aktualniZdravi: 4 },
  { vlastniJmeno: 'Philo', druhNazev: 'Philodendron hederaceum', mediumNazev: 'Perlit', umisteniNazev: 'Koupelna - parapet', aktualniZdravi: 3 },
  { vlastniJmeno: 'Potos', druhNazev: 'Epipremnum aureum', mediumNazev: 'Voda', umisteniNazev: 'Obyvak - okno jih', aktualniZdravi: 5 },
  { vlastniJmeno: 'Tchyne', druhNazev: 'Sansevieria trifasciata', mediumNazev: 'Pisek', umisteniNazev: 'Loznice - police', aktualniZdravi: 2 },
];

const typyAkci = [
  'Zalévání', 'Hnojení', 'Přesazování', 'Rosení', 
  'Kontrola škůdců', 'Otírání prachu', 'Stříhání'
];

async function main() {
  for (const item of media) {
    await prisma.media.upsert({
      where: { nazev: item.nazev },
      update: { popis: item.popis },
      create: { nazev: item.nazev, popis: item.popis },
    });
  }

  for (const nazev of rody) {
    await prisma.rod.upsert({
      where: { nazev },
      update: {},
      create: { nazev },
    });
  }

  for (let i = 0; i < typyAkci.length; i++) {
    await prisma.typAkce.upsert({
      where: { id: i + 1 },
      update: { typAkce: typyAkci[i] },
      create: { id: i + 1, typAkce: typyAkci[i] },
    });
  }

  for (const nazev of umisteniSeed) {
    await prisma.umisteni.create({
      data: { nazev, parentId: null },
    }).catch(() => null);
  }

  for (const item of druhySeed) {
    const rod = await prisma.rod.findUnique({ where: { nazev: item.rodNazev } });

    await prisma.druh.upsert({
      where: { nazev: item.nazev },
      update: {
        popis: item.popis,
        rodId: rod?.id || null,
      },
      create: {
        nazev: item.nazev,
        popis: item.popis,
        rodId: rod?.id || null,
      },
    });
  }

  for (const item of rostlinySeed) {
    const [druh, medium, umisteni] = await Promise.all([
      prisma.druh.findUnique({ where: { nazev: item.druhNazev } }),
      prisma.media.findUnique({ where: { nazev: item.mediumNazev } }),
      prisma.umisteni.findFirst({ where: { nazev: item.umisteniNazev } }),
    ]);

    if (!druh) {
      continue;
    }

    const existing = await prisma.rostlina.findFirst({
      where: {
        vlastniJmeno: item.vlastniJmeno,
        druhId: druh.id,
      },
    });

    if (existing) {
      await prisma.rostlina.update({
        where: { id: existing.id },
        data: {
          aktualniZdravi: item.aktualniZdravi,
          mediumId: medium?.id || null,
          umisteniId: umisteni?.id || null,
        },
      });
      continue;
    }

    await prisma.rostlina.create({
      data: {
        vlastniJmeno: item.vlastniJmeno,
        druhId: druh.id,
        mediumId: medium?.id || null,
        umisteniId: umisteni?.id || null,
        aktualniZdravi: item.aktualniZdravi,
      },
    });
  }

  console.log('Seed hotový s diakritikou.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });