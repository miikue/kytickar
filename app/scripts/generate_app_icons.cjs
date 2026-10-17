const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

// 1. Definitivní SVG pro Kytičkář motiv (Květináč + Monstera listy + Kapka rosy)
function getPlantEmblemSvg(scale = 1, tx = 0, ty = 0) {
  return `
  <g transform="translate(${tx}, ${ty}) scale(${scale})">
    <!-- Měkký stín pod květináčem -->
    <ellipse cx="256" cy="415" rx="90" ry="16" fill="rgba(0,0,0,0.25)" filter="blur(4px)" />

    <!-- Květináč (moderní keramika) -->
    <path d="M190,320 L205,405 C206,412 212,416 219,416 L293,416 C300,416 306,412 307,405 L322,320 Z" 
          fill="url(#potGrad)" />
    <!-- Vnitřek květináče / substrát -->
    <ellipse cx="256" cy="320" rx="66" ry="12" fill="#1b2e23" />
    <ellipse cx="256" cy="321" rx="63" ry="10" fill="#2d4a38" />

    <!-- Stonek hlavní -->
    <path d="M256,320 Q256,230 256,150" stroke="#2d6a4f" stroke-width="12" stroke-linecap="round" fill="none" />
    <!-- Stonek vlevo -->
    <path d="M256,290 Q235,260 180,240" stroke="#2d6a4f" stroke-width="9" stroke-linecap="round" fill="none" />
    <!-- Stonek vpravo -->
    <path d="M256,275 Q280,240 330,220" stroke="#2d6a4f" stroke-width="9" stroke-linecap="round" fill="none" />

    <!-- Levý mladý list -->
    <g transform="translate(180, 240) rotate(-35)">
      <path d="M0,0 C-40,-20 -60,-65 -25,-95 C0,-75 25,-45 0,0 Z" fill="url(#leafLeftGrad)" />
      <!-- Žilka -->
      <path d="M0,0 Q-15,-45 -22,-85" stroke="rgba(255,255,255,0.25)" stroke-width="3" stroke-linecap="round" fill="none" />
    </g>

    <!-- Pravý svěží list -->
    <g transform="translate(330, 220) rotate(35)">
      <path d="M0,0 C40,-20 60,-65 25,-95 C0,-75 -25,-45 0,0 Z" fill="url(#leafRightGrad)" />
      <!-- Žilka -->
      <path d="M0,0 Q15,-45 22,-85" stroke="rgba(255,255,255,0.25)" stroke-width="3" stroke-linecap="round" fill="none" />
    </g>

    <!-- Hlavní dominantní Monstera list s výřezy -->
    <g transform="translate(256, 140)">
      <!-- Tělo listu -->
      <path d="M0,80 
               C-55,50 -95,-10 -75,-80 
               C-60,-125 0,-150 0,-150 
               C0,-150 60,-125 75,-80 
               C95,-10 55,50 0,80 Z" 
            fill="url(#mainLeafGrad)" />
      
      <!-- Výřezy / fenestrace (charakteristická monstera) -->
      <!-- Vlevo nahoře -->
      <path d="M-5,-105 C-25,-100 -48,-85 -42,-78 C-36,-72 -18,-92 -2,-98 Z" fill="#173125" opacity="0.95" />
      <!-- Vlevo dole -->
      <path d="M-8,-55 C-38,-45 -62,-25 -55,-16 C-48,-10 -28,-36 -4,-46 Z" fill="#173125" opacity="0.95" />
      <!-- Vpravo nahoře -->
      <path d="M5,-105 C25,-100 48,-85 42,-78 C36,-72 18,-92 2,-98 Z" fill="#173125" opacity="0.95" />
      <!-- Vpravo dole -->
      <path d="M8,-55 C38,-45 62,-25 55,-16 C48,-10 28,-36 4,-46 Z" fill="#173125" opacity="0.95" />

      <!-- Hlavní centrální žebro listu -->
      <path d="M0,75 L0,-140" stroke="rgba(216,243,220,0.4)" stroke-width="4.5" stroke-linecap="round" />
      <!-- Boční žilky -->
      <path d="M0,30 Q-25,10 -45,-5" stroke="rgba(216,243,220,0.25)" stroke-width="2.5" fill="none" />
      <path d="M0,30 Q25,10 45,-5" stroke="rgba(216,243,220,0.25)" stroke-width="2.5" fill="none" />
      <path d="M0,-20 Q-22,-35 -40,-48" stroke="rgba(216,243,220,0.25)" stroke-width="2.5" fill="none" />
      <path d="M0,-20 Q22,-35 40,-48" stroke="rgba(216,243,220,0.25)" stroke-width="2.5" fill="none" />
    </g>

    <!-- Zářivá kapka rosy / zálivky (symbol péče o kytičky) -->
    <g transform="translate(345, 125) scale(1.15)">
      <!-- Jemný stín kapky -->
      <ellipse cx="2" cy="18" rx="14" ry="5" fill="rgba(0,0,0,0.25)" filter="blur(2px)" />
      <!-- Kapka -->
      <path d="M0,-22 C-14,0 -16,14 0,16 C16,14 14,0 0,-22 Z" fill="url(#waterGrad)" />
      <!-- Skleněný odlesk kapky -->
      <ellipse cx="-4" cy="5" rx="3.5" ry="6.5" transform="rotate(-25 -4 5)" fill="#ffffff" opacity="0.75" />
      <circle cx="2" cy="11" r="1.5" fill="#ffffff" opacity="0.8" />
    </g>
  </g>
  `;
}

// Společné definice gradientů
const SVG_DEFS = `
  <defs>
    <!-- Pozadí ikony: Hluboká prémiová botanická zeleň -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#12281d" />
      <stop offset="45%" stop-color="#183627" />
      <stop offset="100%" stop-color="#224c37" />
    </linearGradient>

    <!-- Květináč: čistý porcelán se stínováním -->
    <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="65%" stop-color="#f0f5f2" />
      <stop offset="100%" stop-color="#dce8e0" />
    </linearGradient>

    <!-- Hlavní list: svěží smaragd do máty -->
    <linearGradient id="mainLeafGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#2d6a4f" />
      <stop offset="40%" stop-color="#40916c" />
      <stop offset="80%" stop-color="#52b788" />
      <stop offset="100%" stop-color="#74c69d" />
    </linearGradient>

    <!-- Levý list -->
    <linearGradient id="leafLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#74c69d" />
      <stop offset="100%" stop-color="#40916c" />
    </linearGradient>

    <!-- Pravý list -->
    <linearGradient id="leafRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#95d5b2" />
      <stop offset="100%" stop-color="#52b788" />
    </linearGradient>

    <!-- Kapka vody: průzračná tyrkysová -->
    <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <!-- Jemná vnitřní záře ikony -->
    <radialGradient id="ambientGlow" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="rgba(82, 183, 136, 0.25)" />
      <stop offset="100%" stop-color="rgba(82, 183, 136, 0)" />
    </radialGradient>
  </defs>
`;

// 1. Čtvercová / squircle ikona s pozadím (pro launcher a web)
function getFullIconSvg(size = 512, isRound = false) {
  const clip = isRound 
    ? `<circle cx="256" cy="256" r="256" fill="url(#bgGrad)" />` 
    : `<rect width="512" height="512" rx="112" fill="url(#bgGrad)" />`;
  const border = isRound
    ? `<circle cx="256" cy="256" r="254" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3" />`
    : `<rect x="1.5" y="1.5" width="509" height="509" rx="110" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3" />`;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
    ${SVG_DEFS}
    ${clip}
    <rect width="512" height="512" fill="url(#ambientGlow)" />
    ${border}
    ${getPlantEmblemSvg(0.96, 10, 16)}
  </svg>
  `;
}

// 2. Android Adaptive Icon Foreground (pouze motiv vycentrovaný v bezpečné zóně 108dp)
function getAdaptiveForegroundSvg(size = 432) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
    ${SVG_DEFS}
    <!-- Zmenšeno tak, aby se vešlo do centrální 66dp zóny z celkových 108dp -->
    ${getPlantEmblemSvg(0.68, 82, 92)}
  </svg>
  `;
}

// 3. Android Splash Screen (Full screen 480x800)
function getSplashSvg(width = 480, height = 800) {
  const cx = width / 2;
  const cy = height / 2 - 25;
  const scale = 0.52;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${SVG_DEFS}
    <!-- Pozadí splash screenu -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
    <circle cx="${cx}" cy="${cy}" r="180" fill="url(#ambientGlow)" />

    <!-- Centrální logo -->
    <g transform="translate(${cx - 256 * scale}, ${cy - 256 * scale})">
      ${getPlantEmblemSvg(scale, 0, 0)}
    </g>

    <!-- Název aplikace -->
    <text x="${cx}" y="${cy + 135}" 
          font-family="system-ui, -apple-system, Roboto, sans-serif" 
          font-size="34" 
          font-weight="800" 
          letter-spacing="0.5"
          fill="#ffffff" 
          text-anchor="middle">Kytičkář</text>

    <!-- Podtitul -->
    <text x="${cx}" y="${cy + 165}" 
          font-family="system-ui, -apple-system, Roboto, sans-serif" 
          font-size="14" 
          font-weight="500" 
          letter-spacing="1.2"
          fill="#95d5b2" 
          text-anchor="middle">PÉČE O ROSTLINY</text>
  </svg>
  `;
}

// Pomocná funkce pro uložení PNG přes resvg
function renderPng(svgString, targetWidth, targetHeight = targetWidth) {
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: 'width',
      value: targetWidth,
    },
  });
  return resvg.render().asPng();
}

async function main() {
  console.log('🌱 Generuji ikony a podklady pro Kytičkář...');

  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const androidResDir = path.join(rootDir, 'android/app/src/main/res');

  // 1. Web SVG favicon
  const fullSvg = getFullIconSvg(512, false);
  const roundSvg = getFullIconSvg(512, true);
  const fgSvg = getAdaptiveForegroundSvg(432);

  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), fullSvg);
  console.log('✓ Uložen app/public/favicon.svg');

  // 2. Web PNG favicons & Apple touch icon
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), renderPng(fullSvg, 64));
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), renderPng(fullSvg, 32));
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderPng(fullSvg, 180));
  console.log('✓ Uloženy webové ikony (favicon.png, favicon-32x32.png, apple-touch-icon.png)');

  // 3. Android Mipmap ikony
  const mipmapDensities = [
    { dir: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
  ];

  for (const { dir, iconSize, fgSize } of mipmapDensities) {
    const targetDir = path.join(androidResDir, dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // ic_launcher.png (squircle)
    fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), renderPng(fullSvg, iconSize));
    // ic_launcher_round.png (round)
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), renderPng(roundSvg, iconSize));
    // ic_launcher_foreground.png (transparent adaptive foreground)
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), renderPng(fgSvg, fgSize));

    console.log(`✓ Vygenerován Android ${dir} (${iconSize}x${iconSize} / FG ${fgSize}x${fgSize})`);
  }

  // 4. Android Splash Screen
  const splashSvg = getSplashSvg(480, 800);
  const splashPng = renderPng(splashSvg, 480, 800);
  fs.writeFileSync(path.join(androidResDir, 'drawable/splash.png'), splashPng);
  console.log('✓ Vygenerován nový prémiový splash screen app/android/app/src/main/res/drawable/splash.png');

  // 5. Aktualizace ic_launcher_background.xml
  const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#173125</color>
</resources>
`;
  fs.writeFileSync(path.join(androidResDir, 'values/ic_launcher_background.xml'), bgXml);
  console.log('✓ Aktualizován ic_launcher_background.xml na botanickou zeleň #173125');

  console.log('\n✨ Všechny ikony a grafické podklady pro Android a Web byly úspěšně vygenerovány!');
}

main().catch(console.error);
