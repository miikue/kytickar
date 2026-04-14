import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT || 4000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads');

await mkdir(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : '';
    cb(null, `${randomUUID()}${safeExt}`);
  },
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }

    cb(new Error('Povoleny jsou pouze obrazky.'));
  },
});

const devTableQueries = {
  media: () => prisma.media.findMany({ orderBy: { id: 'desc' }, take: 100 }),
  rody: () => prisma.rod.findMany({ orderBy: { id: 'desc' }, take: 100 }),
  druhy: () => prisma.druh.findMany({ orderBy: { id: 'desc' }, take: 100 }),
  umisteni: () => prisma.umisteni.findMany({ orderBy: { id: 'desc' }, take: 100 }),
  rostliny: () => prisma.rostlina.findMany({ orderBy: { id: 'desc' }, take: 100 }),
  typyAkci: () => prisma.typAkce.findMany({ orderBy: { id: 'desc' }, take: 100 }),
  historiePece: () => prisma.historiePece.findMany({ orderBy: { id: 'desc' }, take: 100 }),
  odlozeneAkce: () => prisma.odlozenaAkce.findMany({ orderBy: { id: 'desc' }, take: 100 }),
  galerieFotky: () => prisma.galerieFotka.findMany({ orderBy: { id: 'desc' }, take: 100 }),
};

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'DB neni dostupna', error: String(error) });
  }
});

app.post('/api/files/upload', uploadImage.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Soubor nebyl predan. Pouzij field name: file' });
  }

  return res.status(201).json({
    fileName: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    readUrl: `/api/files/${req.file.filename}`,
  });
});

app.get('/api/files/:fileName', (req, res) => {
  const { fileName } = req.params;
  const safeName = path.basename(fileName);
  const filePath = path.join(UPLOAD_DIR, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Soubor nebyl nalezen.' });
  }

  return res.sendFile(filePath);
});

app.get('/api/druhy', async (_req, res) => {
  const data = await prisma.druh.findMany({
    include: { rod: true },
    orderBy: { nazev: 'asc' },
  });
  res.json(data);
});

app.post('/api/druhy', async (req, res) => {
  const { nazev, popis, rodId, fotka1Name, fotka2Name } = req.body;

  if (!nazev) {
    return res.status(400).json({ message: 'Povinne pole: nazev' });
  }

  try {
    const created = await prisma.druh.create({
      data: {
        nazev: String(nazev),
        popis: popis ? String(popis) : null,
        rodId: rodId ? Number(rodId) : null,
        fotka1Name: fotka1Name ? String(fotka1Name) : null,
        fotka2Name: fotka2Name ? String(fotka2Name) : null,
      },
      include: { rod: true },
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se vytvorit druh', error: String(error) });
  }
});

app.put('/api/druhy/:id', async (req, res) => {
  const druhId = Number(req.params.id);
  const { nazev, popis, rodId, fotka1Name, fotka2Name } = req.body;

  if (Number.isNaN(druhId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  if (!nazev) {
    return res.status(400).json({ message: 'Povinne pole: nazev' });
  }

  try {
    const updated = await prisma.druh.update({
      where: { id: druhId },
      data: {
        nazev: String(nazev),
        popis: popis ? String(popis) : null,
        rodId: rodId ? Number(rodId) : null,
        fotka1Name: fotka1Name ? String(fotka1Name) : null,
        fotka2Name: fotka2Name ? String(fotka2Name) : null,
      },
      include: { rod: true },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se upravit druh', error: String(error) });
  }
});

app.delete('/api/druhy/:id', async (req, res) => {
  const druhId = Number(req.params.id);

  if (Number.isNaN(druhId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  try {
    await prisma.druh.delete({ where: { id: druhId } });
    return res.status(204).send();
  } catch (error) {
    return res.status(409).json({
      message: 'Druh nelze smazat. Pravdepodobne je pouzit u rostlin.',
      error: String(error),
    });
  }
});

app.get('/api/media', async (_req, res) => {
  const data = await prisma.media.findMany({ orderBy: { nazev: 'asc' } });
  res.json(data);
});

app.post('/api/media', async (req, res) => {
  const { nazev, popis } = req.body;

  if (!nazev) {
    return res.status(400).json({ message: 'Povinne pole: nazev' });
  }

  try {
    const created = await prisma.media.create({
      data: { nazev: String(nazev), popis: popis ? String(popis) : null },
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se vytvorit medium', error: String(error) });
  }
});

app.put('/api/media/:id', async (req, res) => {
  const mediaId = Number(req.params.id);
  const { nazev, popis } = req.body;

  if (Number.isNaN(mediaId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  if (!nazev) {
    return res.status(400).json({ message: 'Povinne pole: nazev' });
  }

  try {
    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: { nazev: String(nazev), popis: popis ? String(popis) : null },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se upravit medium', error: String(error) });
  }
});

app.delete('/api/media/:id', async (req, res) => {
  const mediaId = Number(req.params.id);

  if (Number.isNaN(mediaId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  try {
    await prisma.media.delete({ where: { id: mediaId } });
    return res.status(204).send();
  } catch (error) {
    return res.status(409).json({
      message: 'Medium nelze smazat. Pravdepodobne je pouzite u druhu nebo rostlin.',
      error: String(error),
    });
  }
});

app.get('/api/rody', async (_req, res) => {
  const data = await prisma.rod.findMany({ orderBy: { nazev: 'asc' } });
  res.json(data);
});

app.post('/api/rody', async (req, res) => {
  const { nazev, popis } = req.body;

  if (!nazev) {
    return res.status(400).json({ message: 'Povinne pole: nazev' });
  }

  try {
    const created = await prisma.rod.create({
      data: {
        nazev: String(nazev),
        popis: popis ? String(popis) : null,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se vytvorit род', error: String(error) });
  }
});

app.put('/api/rody/:id', async (req, res) => {
  const rodId = Number(req.params.id);
  const { nazev, popis } = req.body;

  if (Number.isNaN(rodId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  if (!nazev) {
    return res.status(400).json({ message: 'Povinne pole: nazev' });
  }

  try {
    const updated = await prisma.rod.update({
      where: { id: rodId },
      data: {
        nazev: String(nazev),
        popis: popis ? String(popis) : null,
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se upravit род', error: String(error) });
  }
});

app.delete('/api/rody/:id', async (req, res) => {
  const rodId = Number(req.params.id);

  if (Number.isNaN(rodId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  try {
    await prisma.rod.delete({ where: { id: rodId } });
    return res.status(204).send();
  } catch (error) {
    return res.status(409).json({
      message: 'Rod nelze smazat. Pravdepodobne je pouzit u druhu.',
      error: String(error),
    });
  }
});

app.get('/api/umisteni', async (_req, res) => {
  const data = await prisma.umisteni.findMany({
    include: { children: true, parent: true },
    orderBy: [{ parentId: 'asc' }, { nazev: 'asc' }],
  });
  res.json(data);
});

app.post('/api/umisteni', async (req, res) => {
  const { nazev, parentId } = req.body;

  if (!nazev) {
    return res.status(400).json({ message: 'Povinne pole: nazev' });
  }

  try {
    const created = await prisma.umisteni.create({
      data: {
        nazev: String(nazev),
        parentId: parentId ? Number(parentId) : null,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se vytvorit umisteni', error: String(error) });
  }
});

app.put('/api/umisteni/:id', async (req, res) => {
  const umisteniId = Number(req.params.id);
  const { nazev, parentId } = req.body;

  if (Number.isNaN(umisteniId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  if (!nazev) {
    return res.status(400).json({ message: 'Povinne pole: nazev' });
  }

  try {
    const updated = await prisma.umisteni.update({
      where: { id: umisteniId },
      data: {
        nazev: String(nazev),
        parentId: parentId ? Number(parentId) : null,
      },
      include: { children: true, parent: true },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se upravit umisteni', error: String(error) });
  }
});

app.delete('/api/umisteni/:id', async (req, res) => {
  const umisteniId = Number(req.params.id);

  if (Number.isNaN(umisteniId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  try {
    await prisma.umisteni.delete({ where: { id: umisteniId } });
    return res.status(204).send();
  } catch (error) {
    return res.status(409).json({
      message: 'Umisteni nelze smazat. Pravdepodobne je pouzite u rostlin nebo ma potomky.',
      error: String(error),
    });
  }
});

app.get('/api/rostliny', async (_req, res) => {
  const data = await prisma.rostlina.findMany({
    include: {
      medium: true,
      umisteni: true,
      druh: {
        include: { rod: true },
      },
      galerieFotky: {
        orderBy: { datumPorizeni: 'desc' },
        take: 1,
      },
    },
    orderBy: { id: 'desc' },
  });
  res.json(data);
});

app.get('/api/rostliny/nejdelsi-od-zaliti', async (_req, res) => {
  try {
    const [typyAkci, aktivniRostliny] = await Promise.all([
      prisma.typAkce.findMany(),
      prisma.rostlina.findMany({
        where: { aktualniZdravi: { gt: 0 } },
        include: { druh: { include: { rod: true } } },
      }),
    ]);

    const wateringTypIds = typyAkci
      .filter((item) => item.typAkce.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('zal'))
      .map((item) => item.id);

    const historieZalevani = wateringTypIds.length
      ? await prisma.historiePece.findMany({
          where: { typAkceId: { in: wateringTypIds } },
          orderBy: { datum: 'desc' },
        })
      : [];

    const now = new Date();
    const aktivniOdlozeni = wateringTypIds.length
      ? await prisma.odlozenaAkce.findMany({
          where: {
            typAkceId: { in: wateringTypIds },
            datumPripomenuti: { gt: now },
          },
          orderBy: { datumPripomenuti: 'desc' },
        })
      : [];

    const latestByRostlinaId = new Map();
    for (const item of historieZalevani) {
      if (!latestByRostlinaId.has(item.rostlinaId)) {
        latestByRostlinaId.set(item.rostlinaId, item.datum);
      }
    }

    const odlozeneRostliny = new Set(aktivniOdlozeni.map((item) => item.rostlinaId));

    const payload = aktivniRostliny
      .filter((rostlina) => !odlozeneRostliny.has(rostlina.id))
      .map((rostlina) => {
        const posledniZaliti = latestByRostlinaId.get(rostlina.id) ?? null;
        const dnyOdPoslednihoZaliti = posledniZaliti
          ? Math.floor((now.getTime() - new Date(posledniZaliti).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          id: rostlina.id,
          vlastniJmeno: rostlina.vlastniJmeno,
          aktualniZdravi: rostlina.aktualniZdravi,
          druh: { id: rostlina.druh.id, nazev: rostlina.druh.nazev, rodNazev: rostlina.druh.rod?.nazev || null },
          posledniZaliti: posledniZaliti ? new Date(posledniZaliti).toISOString() : null,
          dnyOdPoslednihoZaliti,
        };
      })
      .sort((a, b) => {
        if (a.dnyOdPoslednihoZaliti === null && b.dnyOdPoslednihoZaliti === null) return 0;
        if (a.dnyOdPoslednihoZaliti === null) return -1;
        if (b.dnyOdPoslednihoZaliti === null) return 1;
        return b.dnyOdPoslednihoZaliti - a.dnyOdPoslednihoZaliti;
      });

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se nacist prehled zalevani', error: String(error) });
  }
});

app.post('/api/odlozene-akce/odlozit-zaliti', async (req, res) => {
  const { rostlinaId, dny } = req.body;
  const parsedRostlinaId = Number(rostlinaId);
  const postponeDays = Number(dny || 2);

  if (Number.isNaN(parsedRostlinaId)) {
    return res.status(400).json({ message: 'rostlinaId musi byt cislo' });
  }

  if (Number.isNaN(postponeDays) || postponeDays < 1) {
    return res.status(400).json({ message: 'dny musi byt kladne cislo' });
  }

  try {
    const [typyAkci, rostlina] = await Promise.all([
      prisma.typAkce.findMany(),
      prisma.rostlina.findUnique({ where: { id: parsedRostlinaId } }),
    ]);

    if (!rostlina) {
      return res.status(404).json({ message: 'Rostlina nebyla nalezena.' });
    }

    if (rostlina.aktualniZdravi === 0) {
      return res.status(400).json({ message: 'Rostliny se stavem 0 se neplanuji pro zalevani.' });
    }

    const wateringTyp = typyAkci.find((item) =>
      item.typAkce.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('zal'),
    );

    if (!wateringTyp) {
      return res.status(400).json({ message: 'Typ akce pro zalevani nebyl nalezen.' });
    }

    const now = new Date();
    const datumPripomenuti = new Date(now.getTime() + postponeDays * 24 * 60 * 60 * 1000);

    const existingActive = await prisma.odlozenaAkce.findFirst({
      where: {
        rostlinaId: parsedRostlinaId,
        typAkceId: wateringTyp.id,
        datumPripomenuti: { gt: now },
      },
      orderBy: { datumPripomenuti: 'desc' },
    });

    const result = existingActive
      ? await prisma.odlozenaAkce.update({
          where: { id: existingActive.id },
          data: {
            datum: now,
            datumPripomenuti,
          },
        })
      : await prisma.odlozenaAkce.create({
          data: {
            rostlinaId: parsedRostlinaId,
            typAkceId: wateringTyp.id,
            datum: now,
            datumPripomenuti,
          },
        });

    return res.status(existingActive ? 200 : 201).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se odlozit zalevani', error: String(error) });
  }
});

app.get('/api/dev/overview', async (_req, res) => {
  try {
    const [
      mediaCount,
      druhyCount,
      umisteniCount,
      rostlinyCount,
      typyAkciCount,
      historieCount,
      odlozeneCount,
      galerieCount,
      posledniRostliny,
      posledniHistorie,
      posledniMedia,
    ] = await Promise.all([
      prisma.media.count(),
      prisma.druh.count(),
      prisma.umisteni.count(),
      prisma.rostlina.count(),
      prisma.typAkce.count(),
      prisma.historiePece.count(),
      prisma.odlozenaAkce.count(),
      prisma.galerieFotka.count(),
      prisma.rostlina.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        include: { druh: true, medium: true, umisteni: true },
      }),
      prisma.historiePece.findMany({
        take: 8,
        orderBy: { datum: 'desc' },
        include: { rostlina: true, typAkce: true },
      }),
      prisma.media.findMany({
        take: 8,
        orderBy: { id: 'desc' },
      }),
    ]);

    res.json({
      generatedAt: new Date().toISOString(),
      counts: {
        media: mediaCount,
        druhy: druhyCount,
        umisteni: umisteniCount,
        rostliny: rostlinyCount,
        typyAkci: typyAkciCount,
        historiePece: historieCount,
        odlozeneAkce: odlozeneCount,
        galerieFotky: galerieCount,
      },
      posledniRostliny,
      posledniHistorie,
      posledniMedia,
    });
  } catch (error) {
    res.status(500).json({ message: 'Nepodarilo se nacist dev overview', error: String(error) });
  }
});

app.get('/api/dev/table/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const query = devTableQueries[tableName];

  if (!query) {
    return res.status(400).json({
      message: 'Neplatna tabulka',
      allowedTables: Object.keys(devTableQueries),
    });
  }

  try {
    const rows = await query();
    return res.json({ tableName, rowCount: rows.length, rows });
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se nacist obsah tabulky', error: String(error) });
  }
});

app.post('/api/rostliny', async (req, res) => {
  const { vlastniJmeno, druhId, mediumId, umisteniId, aktualniZdravi } = req.body;

  if (!vlastniJmeno || !druhId) {
    return res.status(400).json({ message: 'Povinne pole: vlastniJmeno, druhId' });
  }

  if (aktualniZdravi !== undefined && (aktualniZdravi < 0 || aktualniZdravi > 5)) {
    return res.status(400).json({ message: 'aktualniZdravi musi byt 0-5' });
  }

  try {
    const created = await prisma.rostlina.create({
      data: {
        vlastniJmeno,
        druhId: Number(druhId),
        mediumId: mediumId ? Number(mediumId) : null,
        umisteniId: umisteniId ? Number(umisteniId) : null,
        aktualniZdravi: aktualniZdravi ? Number(aktualniZdravi) : undefined,
      },
      include: {
        medium: true,
        umisteni: true,
        druh: true,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se vytvorit rostlinu', error: String(error) });
  }
});

app.put('/api/rostliny/:id', async (req, res) => {
  const rostlinaId = Number(req.params.id);
  const { vlastniJmeno, druhId, mediumId, umisteniId, aktualniZdravi } = req.body;

  if (Number.isNaN(rostlinaId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  if (!vlastniJmeno || !druhId) {
    return res.status(400).json({ message: 'Povinne pole: vlastniJmeno, druhId' });
  }

  if (aktualniZdravi !== undefined && (aktualniZdravi < 0 || aktualniZdravi > 5)) {
    return res.status(400).json({ message: 'aktualniZdravi musi byt 0-5' });
  }

  try {
    const updated = await prisma.rostlina.update({
      where: { id: rostlinaId },
      data: {
        vlastniJmeno,
        druhId: Number(druhId),
        mediumId: mediumId ? Number(mediumId) : null,
        umisteniId: umisteniId ? Number(umisteniId) : null,
        aktualniZdravi: aktualniZdravi !== undefined ? Number(aktualniZdravi) : undefined,
      },
      include: {
        medium: true,
        umisteni: true,
        druh: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se upravit rostlinu', error: String(error) });
  }
});

app.delete('/api/rostliny/:id', async (req, res) => {
  const rostlinaId = Number(req.params.id);

  if (Number.isNaN(rostlinaId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  try {
    await prisma.rostlina.delete({ where: { id: rostlinaId } });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se smazat rostlinu', error: String(error) });
  }
});

app.post('/api/historie-pece', async (req, res) => {
  const { rostlinaId, typAkceId, datum } = req.body;

  if (!rostlinaId || !typAkceId) {
    return res.status(400).json({ message: 'Povinne pole: rostlinaId, typAkceId' });
  }

  try {
    const created = await prisma.historiePece.create({
      data: {
        rostlinaId: Number(rostlinaId),
        typAkceId: Number(typAkceId),
        datum: datum ? new Date(datum) : undefined,
      },
      include: {
        rostlina: true,
        typAkce: true,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se ulozit historii pece', error: String(error) });
  }
});

app.get('/api/historie-pece/:rostlinaId', async (req, res) => {
  const rostlinaId = Number(req.params.rostlinaId);

  if (Number.isNaN(rostlinaId)) {
    return res.status(400).json({ message: 'rostlinaId musi byt cislo' });
  }

  const data = await prisma.historiePece.findMany({
    where: { rostlinaId },
    orderBy: { datum: 'desc' },
    include: {
      typAkce: true,
    },
  });

  return res.json(data);
});

app.delete('/api/historie-pece/:id', async (req, res) => {
  const historieId = Number(req.params.id);

  if (Number.isNaN(historieId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  try {
    await prisma.historiePece.delete({ where: { id: historieId } });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se smazat akci historie pece', error: String(error) });
  }
});

app.get('/api/typy-akci', async (_req, res) => {
  const data = await prisma.typAkce.findMany({ orderBy: { typAkce: 'asc' } });
  return res.json(data);
});

app.post('/api/typy-akci', async (req, res) => {
  const { typAkce } = req.body;

  if (!typAkce) {
    return res.status(400).json({ message: 'Povinne pole: typAkce' });
  }

  try {
    const created = await prisma.typAkce.create({
      data: {
        typAkce: String(typAkce),
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se vytvorit typ akce', error: String(error) });
  }
});

app.put('/api/typy-akci/:id', async (req, res) => {
  const typAkceId = Number(req.params.id);
  const { typAkce } = req.body;

  if (Number.isNaN(typAkceId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  if (!typAkce) {
    return res.status(400).json({ message: 'Povinne pole: typAkce' });
  }

  try {
    const updated = await prisma.typAkce.update({
      where: { id: typAkceId },
      data: {
        typAkce: String(typAkce),
      },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se upravit typ akce', error: String(error) });
  }
});

app.delete('/api/typy-akci/:id', async (req, res) => {
  const typAkceId = Number(req.params.id);

  if (Number.isNaN(typAkceId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  try {
    await prisma.typAkce.delete({ where: { id: typAkceId } });
    return res.status(204).send();
  } catch (error) {
    return res.status(409).json({
      message: 'Typ akce nelze smazat. Pravdepodobne je pouzit v historii pece nebo v odlozenych akcich.',
      error: String(error),
    });
  }
});

app.get('/api/galerie-fotky/:rostlinaId', async (req, res) => {
  const rostlinaId = Number(req.params.rostlinaId);

  if (Number.isNaN(rostlinaId)) {
    return res.status(400).json({ message: 'rostlinaId musi byt cislo' });
  }

  const data = await prisma.galerieFotka.findMany({
    where: { rostlinaId },
    orderBy: { datumPorizeni: 'desc' },
  });

  return res.json(data);
});

app.post('/api/galerie-fotky', async (req, res) => {
  const { rostlinaId, fotkaName, poznamka } = req.body;

  if (!rostlinaId || !fotkaName) {
    return res.status(400).json({ message: 'Povinne pole: rostlinaId, fotkaName' });
  }

  try {
    const created = await prisma.galerieFotka.create({
      data: {
        rostlinaId: Number(rostlinaId),
        fotkaName: String(fotkaName),
        poznamka: poznamka ? String(poznamka) : null,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se vytvorit galerii fotku', error: String(error) });
  }
});

app.delete('/api/galerie-fotky/:id', async (req, res) => {
  const fotkaId = Number(req.params.id);

  if (Number.isNaN(fotkaId)) {
    return res.status(400).json({ message: 'id musi byt cislo' });
  }

  try {
    const existing = await prisma.galerieFotka.findUnique({ where: { id: fotkaId } });

    if (!existing) {
      return res.status(404).json({ message: 'Fotka nebyla nalezena.' });
    }

    await prisma.galerieFotka.delete({ where: { id: fotkaId } });

    const safeName = path.basename(existing.fotkaName);
    const filePath = path.join(UPLOAD_DIR, safeName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Nepodarilo se smazat galerii fotku', error: String(error) });
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Interni chyba serveru' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend bezi na http://0.0.0.0:${port}`);
});
