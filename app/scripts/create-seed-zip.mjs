import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

async function createSeedZip() {
  const dbJsonPath = path.join(rootDir, 'default-data', 'db.json');
  const speciesDir = path.join(rootDir, 'app', 'public', 'species');
  const outputZipPath = path.join(rootDir, 'default-data', 'kytickar_seed.zip');

  if (!fs.existsSync(dbJsonPath)) {
    console.error('db.json not found at', dbJsonPath);
    process.exit(1);
  }

  const zip = new JSZip();

  // 1. Add db.json
  const dbContent = fs.readFileSync(dbJsonPath, 'utf8');
  zip.file('db.json', dbContent);
  console.log('Added db.json to ZIP');

  // 2. Add species photos into 'fotky/' folder
  const fotkyFolder = zip.folder('fotky');
  if (fs.existsSync(speciesDir)) {
    const files = fs.readdirSync(speciesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    for (const f of files) {
      const filePath = path.join(speciesDir, f);
      const buffer = fs.readFileSync(filePath);
      fotkyFolder.file(f, buffer);
    }
    console.log(`Added ${files.length} photos to 'fotky/' folder in ZIP`);
  }

  // 3. Generate ZIP
  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  fs.writeFileSync(outputZipPath, content);
  const sizeKb = Math.round(content.length / 1024);
  console.log(`Successfully created ${outputZipPath} (${sizeKb} KB)`);
}

createSeedZip().catch(err => {
  console.error('Failed to create seed ZIP:', err);
  process.exit(1);
});
