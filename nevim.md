

## Hygiena repa

- Kořenový `README` popisuje backend, skripty a systemd služby, které v repu nejsou.
- `default-data/db.json` je bajt po bajtu stejný jako `defaultData.json`.
- Kód serveru je mrtvý a po výpadku se potichu přepne na lokální data (split-brain).
- Endpointy `/api/dev/*` a `/image.png` jsou nepoužité nebo chybí.
- Verze je v UI „1.0.0“, v `package.json` `0.0.0` a v Gradle `1.0`.
- Texty chyb míchají češtinu s diakritikou i bez ní. Plurály mají ternáry s identickými větvemi.
- Testy jsou jen šablonové stuby.


- V `public/species` je 23 MB (146 JPG, průměr 160 kB) a vše jde do APK. Výchozí data používají 7 fotek druhů a 95 fotek galerie, zhruba 44 souborů nikdo nereferencuje. Převod na WebP a zmenšení by velikost srazily na zlomek.
- Fotky jsou v IndexedDB jako base64 data URL (+33 %) a paměťová cache nemá strop.
- `KytkyPage.tsx` má 1322 řádků a kolem 30 `useState`. `PridatKytkuPage` dostává přes 50 props. `index.css` je jeden soubor s 5165 řádky.
