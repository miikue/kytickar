import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const dbPath = '/Users/miikue/.gemini/antigravity/brain/375b1bba-7eae-49c6-8a6a-637ce9305c93/scratch/kytickar/app/backend/prisma/dev.db';
const uploadsDir = '/Users/miikue/.gemini/antigravity/brain/375b1bba-7eae-49c6-8a6a-637ce9305c93/scratch/kytickar/app/backend/uploads';
const publicSpeciesDir = path.join(rootDir, 'app', 'public', 'species');
const defaultDataDir = path.join(rootDir, 'default-data');
const outputSeedZipPath = path.join(defaultDataDir, 'natka_seed.zip');
const appDefaultDataPath = path.join(rootDir, 'app', 'src', 'data', 'defaultData.json');
const defaultDbJsonPath = path.join(defaultDataDir, 'db.json');

function querySqlite(query) {
  const jsonStr = execSync(`sqlite3 -json "${dbPath}" "${query}"`, { encoding: 'utf8' });
  return jsonStr ? JSON.parse(jsonStr) : [];
}

function toIsoString(val) {
  if (!val) return new Date().toISOString();
  if (typeof val === 'number') {
    return new Date(val).toISOString();
  }
  const num = Number(val);
  if (!isNaN(num) && num > 1000000000) {
    return new Date(num).toISOString();
  }
  try {
    return new Date(val).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

async function run() {
  console.log('1. Reading data from SQLite...');

  // Media
  const rawMedia = querySqlite('SELECT * FROM media ORDER BY id;');
  const media = rawMedia.map(m => ({
    id: m.id,
    nazev: m.nazev,
    popis: m.popis || ''
  }));

  // Umisteni
  const rawUmisteni = querySqlite('SELECT * FROM umisteni ORDER BY id;');
  const umisteni = rawUmisteni.map(u => ({
    id: u.id,
    nazev: u.nazev,
    parentId: u.parent_id || null
  }));

  // Rody
  const rawRody = querySqlite('SELECT * FROM rody ORDER BY id;');
  const rody = rawRody.map(r => ({
    id: r.id,
    nazev: r.nazev,
    popis: r.popis || ''
  }));

  // Existing species photos check
  const existingSpeciesFiles = fs.existsSync(publicSpeciesDir)
    ? fs.readdirSync(publicSpeciesDir)
    : [];

  function slugify(name) {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  // Druhy
  const rawDruhy = querySqlite('SELECT * FROM druhy ORDER BY id;');
  const druhy = rawDruhy.map(d => {
    let fotka1 = d.fotka1_name || null;
    let fotka2 = d.fotka2_name || null;
    if (!fotka1) {
      const slug = slugify(d.nazev) + '.jpg';
      if (existingSpeciesFiles.includes(slug)) {
        fotka1 = slug;
      }
    }
    return {
      id: d.id,
      nazev: d.nazev,
      popis: d.popis || '',
      rodId: d.rod_id || null,
      fotka1Name: fotka1,
      fotka2Name: fotka2
    };
  });

  // Rostliny
  const rawRostliny = querySqlite('SELECT * FROM rostliny ORDER BY id;');
  const rostliny = rawRostliny.map(r => ({
    id: r.id,
    vlastniJmeno: r.vlastni_jmeno,
    aktualniZdravi: r.aktualni_zdravi ?? 5,
    datumPorizeni: toIsoString(r.datum_porizeni),
    mediumId: r.medium_id || null,
    umisteniId: r.umisteni_id || null,
    druhId: r.druh_id
  }));

  // Typy akci with proper icons and intervals
  const actionMeta = {
    1: { ikona: '💧', intervalDny: 7, odlozitDny: 2 },
    2: { ikona: '🌱', intervalDny: 14, odlozitDny: 3 },
    3: { ikona: '🪴', intervalDny: 365, odlozitDny: 14 },
    4: { ikona: '💨', intervalDny: 2, odlozitDny: 1 },
    5: { ikona: '🔍', intervalDny: 14, odlozitDny: 3 },
    6: { ikona: '🧽', intervalDny: 21, odlozitDny: 5 },
    7: { ikona: '✂️', intervalDny: 60, odlozitDny: 7 },
    8: { ikona: '🌊', intervalDny: 7, odlozitDny: 2 },
    9: { ikona: '🧪', intervalDny: 14, odlozitDny: 3 }
  };

  const rawTypyAkci = querySqlite('SELECT * FROM typy_akci ORDER BY id;');
  const typyAkci = rawTypyAkci.map(t => ({
    id: t.id,
    typAkce: t.typ_akce,
    ikona: actionMeta[t.id]?.ikona || '💧',
    intervalDny: actionMeta[t.id]?.intervalDny || 7,
    odlozitDny: actionMeta[t.id]?.odlozitDny || 2
  }));

  // Historie pece
  const rawHistorie = querySqlite('SELECT * FROM historie_pece ORDER BY id;');
  const historiePece = rawHistorie.map(h => ({
    id: h.id,
    rostlinaId: h.rostlina_id,
    datum: toIsoString(h.datum),
    typAkceId: h.typ_akce_id
  }));

  // Odlozene akce
  const rawOdlozene = querySqlite('SELECT * FROM odlozene_akce ORDER BY id;');
  const odlozeneAkce = rawOdlozene.map(o => ({
    id: o.id,
    rostlinaId: o.rostlina_id,
    datum: toIsoString(o.datum),
    datumPripomenuti: toIsoString(o.datum_pripomenuti),
    typAkceId: o.typ_akce_id
  }));

  // Galerie fotky
  const rawGalerie = querySqlite('SELECT * FROM galerie_fotky ORDER BY id;');
  const galerieFotky = rawGalerie.map(g => ({
    id: g.id,
    rostlinaId: g.rostlina_id,
    fotkaName: g.fotka_name,
    datumPorizeni: toIsoString(g.datum_porizeni),
    poznamka: g.poznamka || null
  }));

  // Activity log
  const rawActivity = querySqlite('SELECT * FROM activity_log ORDER BY id;');
  const activityLog = rawActivity.map(a => ({
    id: a.id,
    createdAt: toIsoString(a.created_at),
    eventType: a.event_type,
    section: a.section,
    label: a.label || null,
    entityId: a.entity_id || null,
    details: a.details || null
  }));

  const dbPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'Kytickar',
    data: {
      media,
      umisteni,
      rody,
      druhy,
      rostliny,
      typyAkci,
      historiePece,
      odlozeneAkce,
      galerieFotky,
      activityLog
    }
  };

  console.log(`Extracted counts:
  - Media: ${media.length}
  - Umisteni: ${umisteni.length}
  - Rody: ${rody.length}
  - Druhy: ${druhy.length}
  - Rostliny: ${rostliny.length}
  - Typy akci: ${typyAkci.length}
  - Historie pece: ${historiePece.length}
  - Odlozene akce: ${odlozeneAkce.length}
  - Galerie fotky: ${galerieFotky.length}
  - Activity log: ${activityLog.length}`);

  // 2. Optimize and gather photos
  console.log('2. Processing and optimizing photos...');
  const optDir = '/Users/miikue/.gemini/antigravity/brain/375b1bba-7eae-49c6-8a6a-637ce9305c93/scratch/optimized_photos';
  fs.mkdirSync(optDir, { recursive: true });

  const photoFiles = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`Optimizing ${photoFiles.length} photos with sips...`);

  let count = 0;
  for (const f of photoFiles) {
    const src = path.join(uploadsDir, f);
    const dest = path.join(optDir, f);
    if (!fs.existsSync(dest)) {
      execSync(`sips -s formatOptions 82 -Z 1280 "${src}" --out "${dest}" > /dev/null 2>&1`);
    }
    // Also copy to public/species so the app can display them immediately!
    const pubDest = path.join(publicSpeciesDir, f);
    fs.copyFileSync(dest, pubDest);
    count++;
    if (count % 20 === 0 || count === photoFiles.length) {
      console.log(`  Processed ${count}/${photoFiles.length} photos...`);
    }
  }

  // 3. Build natka_seed.zip
  console.log('3. Building natka_seed.zip...');
  const zip = new JSZip();
  zip.file('db.json', JSON.stringify(dbPayload, null, 2));
  const fotkyFolder = zip.folder('fotky');

  for (const f of photoFiles) {
    const pPath = path.join(optDir, f);
    fotkyFolder.file(f, fs.readFileSync(pPath));
  }

  // Also include any catalog species images that are in druhy
  for (const d of druhy) {
    if (d.fotka1Name && fs.existsSync(path.join(publicSpeciesDir, d.fotka1Name))) {
      fotkyFolder.file(d.fotka1Name, fs.readFileSync(path.join(publicSpeciesDir, d.fotka1Name)));
    }
  }

  const zipContent = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  fs.writeFileSync(outputSeedZipPath, zipContent);
  console.log(`Saved ${outputSeedZipPath} (${Math.round(zipContent.length / 1024)} KB)`);

  // 4. Update defaultData.json and default-data/db.json
  console.log('4. Updating defaultData.json and db.json for testing...');
  const jsonStr = JSON.stringify(dbPayload, null, 2);
  fs.writeFileSync(appDefaultDataPath, jsonStr);
  fs.writeFileSync(defaultDbJsonPath, jsonStr);
  console.log('Updated app/src/data/defaultData.json and default-data/db.json');

  console.log('Done!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
