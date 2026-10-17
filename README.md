# Kytičkář 🌿

Moderní mobilní a webová offline-first aplikace pro evidenci pokojových rostlin, plánování zálivky a zaznamenávání péče.

Aplikace funguje 100% lokálně v zařízení bez nutnosti externího serveru nebo internetového připojení. Veškerá data a fotografie jsou ukládány přímo do lokální databáze (IndexedDB).

---

## 🛠 Použité technologie

- **Frontend:** React 19, TypeScript, Vite
- **Mobilní platforma:** [Capacitor 8](https://capacitorjs.com/) (Android)
- **Lokální úložiště:** IndexedDB (fotografie, historie péče, botanické druhy, umístění)
- **Notifikace:** `@capacitor/local-notifications` (plánování ranních připomínek péče přímo v zařízení)
- **Zálohování:** JSZip (kompletní export/import databáze a fotografií do formátu `.zip`)

---

## 📁 Struktura repozitáře

```text
kytickar/
├── app/                      # Hlavní aplikace (PWA + Capacitor)
│   ├── android/              # Nativní Android projekt (Gradle, Java)
│   ├── public/               # Statické ikony a fotografie druhů
│   ├── src/
│   │   ├── api/              # Klientské rozhraní pro práci s daty
│   │   ├── components/       # Znovupoužitelné UI komponenty
│   │   ├── data/             # Výchozí datová sada (defaultData.json)
│   │   ├── hooks/            # React hooky pro správu entit
│   │   ├── pages/            # Hlavní obrazovky (Kytky, Druhy, Nastavení...)
│   │   └── services/         # Služby (IndexedDB, notifikace, zálohy, fotoaparát)
│   └── scripts/              # Pomocné skripty pro přípravu datových sad
├── default-data/             # Záložní balíčky a datové archivy
└── README.md
```

---

## 🚀 Rychlý start (Vývoj)

### 1. Požadavky
- Node.js 20+
- npm 10+
- (Volitelně pro Android) Android Studio s Android SDK 34+ a JDK 17+

### 2. Spuštění vývojového serveru

```bash
cd app
npm install
npm run dev
```

Aplikace poběží lokálně na `http://localhost:5173`.

### 3. Sestavení produkčního buildu

```bash
cd app
npm run build
```

Výsledné statické soubory se vygenerují do složky `app/dist/`.

---

## 📱 Sestavení pro Android

Projekt využívá Ionic Capacitor pro sestavení nativní Android aplikace.

1. **Sestavte webovou část a synchronizujte Android projekt:**
   ```bash
   cd app
   npm run build
   npx cap sync android
   ```

2. **Otevření v Android Studio:**
   ```bash
   npx cap open android
   ```
   Nebo sestavte ladicí APK přímo z příkazové řádky:
   ```bash
   cd app/android
   ./gradlew assembleDebug
   ```
   Výsledný instalační balíček se nachází v `app/android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 💾 Zálohování a obnova dat

Vzhledem k tomu, že Kytičkář běží plně offline:
- Zálohu lze kdykoliv vytvořit v záložce **Nastavení -> Exportovat zálohu (.ZIP)**.
- Archiv obsahuje strukturovanou databázi `db.json` a složku `fotky/` se všemi zaznamenanými fotografiemi rostlin.
- Archiv lze stejným způsobem kdykoliv obnovit na jiném telefonu nebo v prohlížeči.