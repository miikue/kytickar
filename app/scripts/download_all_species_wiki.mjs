import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const publicSpeciesDir = path.join(appRoot, 'public', 'species');
const defaultDataPath = path.join(appRoot, 'src', 'data', 'defaultData.json');
const repoDbPath = path.resolve(appRoot, '..', 'default-data', 'db.json');

const WIKI_MAPPING = {
  9: { slug: 'cryptanthus_rubin_star', terms: ['Cryptanthus', 'Cryptanthus bivittatus'] },
  10: { slug: 'anacampseros_sunrise', terms: ['Anacampseros telephiastrum', 'Anacampseros'] },
  11: { slug: 'syngonium_podophyllum_sp', terms: ['Syngonium podophyllum', 'Syngonium'] },
  13: { slug: 'rhaphidophora_tetrasperma', terms: ['Rhaphidophora tetrasperma', 'Rhaphidophora'] },
  15: { slug: 'philodendron_erubescens', terms: ['Philodendron erubescens'] },
  16: { slug: 'murdannia_loriformis', terms: ['Murdannia loriformis', 'Murdannia'] },
  17: { slug: 'aglaonema_commutatum', terms: ['Aglaonema commutatum', 'Aglaonema'] },
  19: { slug: 'rhipsalis_cereuscula', terms: ['Rhipsalis cereuscula', 'Rhipsalis'] },
  22: { slug: 'syngonium_green_splash', terms: ['Syngonium podophyllum', 'Syngonium'] },
  23: { slug: 'syngonium_batik', terms: ['Syngonium podophyllum', 'Syngonium'] },
  24: { slug: 'euphorbia_pulcherrima', terms: ['Euphorbia pulcherrima', 'Poinsettia'] },
  25: { slug: 'hibiscus_rosa_sinensis', terms: ['Hibiscus rosa-sinensis', 'Hibiscus'] },
  26: { slug: 'schefflera_arboricola', terms: ['Schefflera arboricola', 'Schefflera'] },
  28: { slug: 'monstera_obliqua', terms: ['Monstera obliqua', 'Monstera'] },
  29: { slug: 'monstera_thai_constellation', terms: ['Monstera deliciosa', 'Monstera'] },
  30: { slug: 'monstera_burle_marx_flame', terms: ['Monstera subpinnata', 'Monstera'] },
  31: { slug: 'philodendron_white_princess', terms: ['Philodendron erubescens', 'Philodendron'] },
  32: { slug: 'peperomia_graveolens', terms: ['Peperomia graveolens', 'Peperomia'] },
  33: { slug: 'dracaena_sanderiana', terms: ['Dracaena sanderiana', 'Dracaena braunii'] },
  34: { slug: 'allium_sativum', terms: ['Allium sativum'] },
  35: { slug: 'houseplant_mix', terms: ['Houseplant', 'Indoor plant'] },
  36: { slug: 'syngonium_mottled', terms: ['Syngonium podophyllum', 'Syngonium'] },
  37: { slug: 'haworthiopsis_limifolia', terms: ['Haworthiopsis limifolia', 'Haworthia'] },
  38: { slug: 'ferocactus_histrix', terms: ['Ferocactus histrix', 'Ferocactus'] },
  39: { slug: 'aloe_nobilis', terms: ['Aloe perfoliata', 'Aloe nobilis', 'Aloe'] },
  41: { slug: 'haworthia_cooperi', terms: ['Haworthia cooperi', 'Haworthia'] },
  42: { slug: 'adenium_obesum', terms: ['Adenium obesum'] },
  43: { slug: 'schlumbergera_truncata', terms: ['Schlumbergera', 'Schlumbergera truncata'] },
  44: { slug: 'aloe_sunset', terms: ['Aloe succotrina', 'Aloe'] },
  45: { slug: 'stenocactus_wippermannii', terms: ['Stenocactus', 'Echinofossulocactus'] },
  46: { slug: 'lobivia_cinnabarina', terms: ['Echinopsis cinnabarina', 'Lobivia'] },
  47: { slug: 'cactus_mix', terms: ['Cactaceae', 'Cactus'] },
  48: { slug: 'pilosocereus_pachycladus', terms: ['Pilosocereus pachycladus', 'Pilosocereus'] },
  49: { slug: 'monstera_deliciosa_albo', terms: ['Monstera deliciosa', 'Monstera'] },
  50: { slug: 'mammillaria_spinosissima', terms: ['Mammillaria spinosissima', 'Mammillaria'] },
  51: { slug: 'alocasia_tandurusa', terms: ['Alocasia tandurusa', 'Alocasia'] },
  53: { slug: 'aloe_broomii', terms: ['Aloe broomii', 'Aloe'] },
  55: { slug: 'rhipsalis_baccifera_sp', terms: ['Rhipsalis baccifera', 'Rhipsalis'] },
  57: { slug: 'rhipsalis_elliptica', terms: ['Rhipsalis elliptica', 'Rhipsalis'] },
  58: { slug: 'tradescantia_pallida', terms: ['Tradescantia pallida', 'Tradescantia'] },
  60: { slug: 'ananas_comosus', terms: ['Ananas comosus', 'Pineapple'] },
  63: { slug: 'euphorbia_umbellata', terms: ['Synadenium grantii', 'Euphorbia umbellata', 'Euphorbia'] },
  64: { slug: 'hoya_pubicalyx', terms: ['Hoya pubicalyx', 'Hoya'] },
  65: { slug: 'oncidium_orchid', terms: ['Oncidium', 'Orchidaceae'] },
  66: { slug: 'gasteria_carinata', terms: ['Gasteria carinata', 'Gasteria'] },
  68: { slug: 'fragaria_vesca', terms: ['Fragaria vesca', 'Wild strawberry'] },
  69: { slug: 'aglaonema_lady_valentine', terms: ['Aglaonema commutatum', 'Aglaonema'] },
};

async function downloadImage(imageUrl, destPath) {
  const res = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'KytickarApp/1.0 (contact: bot@kytickar.cz)',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function main() {
  console.log('🌿 Stahuji chybějící fotografie druhů z Wikipedie...');
  const defaultData = JSON.parse(fs.readFileSync(defaultDataPath, 'utf8'));
  const druhy = defaultData.data.druhy;

  let downloaded = 0;
  for (const druh of druhy) {
    const mapping = WIKI_MAPPING[druh.id];
    if (!mapping) continue;

    const targetFileName = `${mapping.slug}.jpg`;
    const targetFilePath = path.join(publicSpeciesDir, targetFileName);

    let imageUrl = null;
    let matchedTitle = null;

    for (const term of mapping.terms) {
      const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
        term
      )}&gsrlimit=1&prop=pageimages&pithumbsize=600&format=json`;

      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'KytickarApp/1.0 (contact: bot@kytickar.cz)' },
        });
        const json = await res.json();
        const pages = json.query?.pages || {};
        for (const k of Object.keys(pages)) {
          if (pages[k].thumbnail?.source) {
            imageUrl = pages[k].thumbnail.source;
            matchedTitle = pages[k].title;
            break;
          }
        }
      } catch (err) {
        // ignore
      }
      if (imageUrl) break;
    }

    if (imageUrl) {
      try {
        await downloadImage(imageUrl, targetFilePath);
        const stats = fs.statSync(targetFilePath);
        console.log(`[ID ${druh.id}] ${druh.nazev} -> ${matchedTitle} (${Math.round(stats.size / 1024)} KB) -> ${targetFileName}`);
        druh.fotka1Name = targetFileName;
        downloaded++;
      } catch (e) {
        console.error(`  Chyba pri stahovani ${targetFileName}:`, e.message);
      }
    } else {
      console.warn(`  [ID ${druh.id}] Nenalezena fotka pro ${druh.nazev}`);
    }

    // Gentle delay between requests
    await new Promise((r) => setTimeout(r, 150));
  }

  // Ulozit aktualizovany JSON
  fs.writeFileSync(defaultDataPath, JSON.stringify(defaultData, null, 2), 'utf8');
  if (fs.existsSync(repoDbPath)) {
    fs.writeFileSync(repoDbPath, JSON.stringify(defaultData, null, 2), 'utf8');
  }

  console.log(`\n✅ Uspesne stazeno a prirazeno ${downloaded}/${Object.keys(WIKI_MAPPING).length} fotografii!`);
}

main().catch(console.error);
