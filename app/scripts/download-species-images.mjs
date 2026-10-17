import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const publicSpeciesDir = path.join(appRoot, 'public', 'species');
const defaultDataPath = path.join(appRoot, 'src', 'data', 'defaultData.json');
const repoDbPath = defaultDataPath;

if (!fs.existsSync(publicSpeciesDir)) {
  fs.mkdirSync(publicSpeciesDir, { recursive: true });
}

const SPECIES_SEARCH_MAP = {
  1: { slug: 'monstera_deliciosa', terms: ['Monstera deliciosa'] },
  2: { slug: 'monstera_adansonii', terms: ['Monstera adansonii'] },
  3: { slug: 'monstera_standleyana', terms: ['Monstera standleyana', 'Monstera'] },
  4: { slug: 'philodendron_hederaceum', terms: ['Philodendron hederaceum', 'Philodendron scandens'] },
  5: { slug: 'philodendron_birkin', terms: ['Philodendron', 'Philodendron erubescens'] },
  6: { slug: 'philodendron_pink_princess', terms: ['Philodendron erubescens', 'Philodendron'] },
  7: { slug: 'philodendron_brasil', terms: ['Philodendron hederaceum', 'Philodendron'] },
  8: { slug: 'philodendron_verrucosum', terms: ['Philodendron verrucosum'] },
  9: { slug: 'epipremnum_aureum', terms: ['Epipremnum aureum'] },
  10: { slug: 'epipremnum_cebu_blue', terms: ['Epipremnum pinnatum'] },
  11: { slug: 'epipremnum_marble_queen', terms: ['Epipremnum aureum'] },
  12: { slug: 'scindapsus_pictus', terms: ['Scindapsus pictus'] },
  13: { slug: 'scindapsus_treubii', terms: ['Scindapsus treubii', 'Scindapsus'] },
  14: { slug: 'ficus_elastica', terms: ['Ficus elastica'] },
  15: { slug: 'ficus_lyrata', terms: ['Ficus lyrata'] },
  16: { slug: 'ficus_benjamina', terms: ['Ficus benjamina'] },
  17: { slug: 'alocasia_amazonica_polly', terms: ['Alocasia amazonica', 'Alocasia'] },
  18: { slug: 'alocasia_zebrina', terms: ['Alocasia zebrina'] },
  19: { slug: 'alocasia_dragon_scale', terms: ['Alocasia baginda', 'Alocasia'] },
  20: { slug: 'alocasia_macrorrhizos', terms: ['Alocasia macrorrhizos'] },
  21: { slug: 'calathea_orbifolia', terms: ['Goeppertia orbifolia', 'Calathea orbifolia'] },
  22: { slug: 'calathea_makoyana', terms: ['Goeppertia makoyana', 'Calathea makoyana'] },
  23: { slug: 'calathea_medallion', terms: ['Goeppertia roseopicta', 'Calathea roseopicta'] },
  24: { slug: 'sansevieria_trifasciata', terms: ['Dracaena trifasciata', 'Sansevieria trifasciata'] },
  25: { slug: 'sansevieria_cylindrica', terms: ['Dracaena angolensis', 'Sansevieria cylindrica'] },
  26: { slug: 'sansevieria_laurentii', terms: ['Dracaena trifasciata', 'Sansevieria trifasciata'] },
  27: { slug: 'zamioculcas_zamiifolia', terms: ['Zamioculcas'] },
  28: { slug: 'zamioculcas_raven', terms: ['Zamioculcas'] },
  29: { slug: 'spathiphyllum_wallisii', terms: ['Spathiphyllum wallisii', 'Spathiphyllum'] },
  30: { slug: 'anthurium_clarinervium', terms: ['Anthurium clarinervium', 'Anthurium'] },
  31: { slug: 'anthurium_andraeanum', terms: ['Anthurium andraeanum'] },
  32: { slug: 'anthurium_crystallinum', terms: ['Anthurium crystallinum', 'Anthurium'] },
  33: { slug: 'peperomia_watermelon', terms: ['Peperomia argyreia'] },
  34: { slug: 'peperomia_obtusifolia', terms: ['Peperomia obtusifolia'] },
  35: { slug: 'peperomia_rotundifolia', terms: ['Peperomia rotundifolia'] },
  36: { slug: 'syngonium_podophyllum', terms: ['Syngonium podophyllum'] },
  37: { slug: 'syngonium_neon_robusta', terms: ['Syngonium podophyllum', 'Syngonium'] },
  38: { slug: 'pilea_peperomioides', terms: ['Pilea peperomioides'] },
  39: { slug: 'chlorophytum_comosum', terms: ['Chlorophytum comosum'] },
  40: { slug: 'dracaena_marginata', terms: ['Dracaena reflexa', 'Dracaena marginata'] },
  41: { slug: 'dracaena_fragrans', terms: ['Dracaena fragrans'] },
  42: { slug: 'begonia_maculata', terms: ['Begonia maculata'] },
  43: { slug: 'hoya_carnosa', terms: ['Hoya carnosa'] },
  44: { slug: 'hoya_kerrii', terms: ['Hoya kerrii'] },
  45: { slug: 'maranta_fascinator', terms: ['Maranta leuconeura'] },
  46: { slug: 'crassula_ovata', terms: ['Crassula ovata'] },
  47: { slug: 'aloe_vera', terms: ['Aloe vera'] },
  48: { slug: 'phalaenopsis', terms: ['Phalaenopsis'] },
  49: { slug: 'tradescantia_zebrina', terms: ['Tradescantia zebrina'] },
  50: { slug: 'ceropegia_woodii', terms: ['Ceropegia woodii'] },
  51: { slug: 'dieffenbachia_seguine', terms: ['Dieffenbachia seguine', 'Dieffenbachia'] },
};

async function fetchWikiThumbnail(title, lang = 'en') {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    title
  )}&prop=pageimages&format=json&pithumbsize=400`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'KytickarApp/1.0 (https://github.com/miikue/kytickar; contact: bot@kytickar.cz)',
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const pages = json.query?.pages || {};
    for (const pageId of Object.keys(pages)) {
      if (pages[pageId].thumbnail?.source) {
        return pages[pageId].thumbnail.source;
      }
    }
  } catch (err) {
    // ignorovat
  }
  return null;
}

async function downloadImage(imageUrl, destPath) {
  const res = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'KytickarApp/1.0 (https://github.com/miikue/kytickar; contact: bot@kytickar.cz)',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function main() {
  console.log('🌱 Kontroluji a stahuji chybějící náhledy...');

  const raw = fs.readFileSync(defaultDataPath, 'utf8');
  const defaultData = JSON.parse(raw);
  const druhy = defaultData.data.druhy;

  let successCount = 0;

  for (let i = 0; i < druhy.length; i++) {
    const druh = druhy[i];
    const mapping = SPECIES_SEARCH_MAP[druh.id];
    if (!mapping) continue;

    const slug = mapping.slug;
    const targetFileName = `${slug}.jpg`;
    const targetFilePath = path.join(publicSpeciesDir, targetFileName);
    const targetUrlPath = `/species/${targetFileName}`;

    if (fs.existsSync(targetFilePath) && fs.statSync(targetFilePath).size > 1000) {
      druh.fotka1Name = targetUrlPath;
      successCount++;
      continue;
    }

    console.log(`[${i + 1}/${druhy.length}] Stahuji ${druh.nazev} ...`);

    let imageUrl = null;
    for (const term of mapping.terms) {
      imageUrl = await fetchWikiThumbnail(term, 'en');
      if (imageUrl) break;
      imageUrl = await fetchWikiThumbnail(term, 'cs');
      if (imageUrl) break;
    }

    if (imageUrl) {
      try {
        await downloadImage(imageUrl, targetFilePath);
        const stats = fs.statSync(targetFilePath);
        const sizeKb = Math.round(stats.size / 1024);
        console.log(`  -> Uloženo: ${targetFileName} (${sizeKb} KB)`);
        druh.fotka1Name = targetUrlPath;
        successCount++;
      } catch (err) {
        console.warn(`  -> Chyba při stahování ${imageUrl}:`, err.message);
      }
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  // Uložení obou kopií default dat
  fs.writeFileSync(defaultDataPath, JSON.stringify(defaultData, null, 2), 'utf8');
  if (fs.existsSync(repoDbPath)) {
    fs.writeFileSync(repoDbPath, JSON.stringify(defaultData, null, 2), 'utf8');
  }

  console.log(`\n🎉 Hotovo! Celkem propojeno ${successCount}/${druhy.length} fotografií druhů.`);
}

main().catch(console.error);
