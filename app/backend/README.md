# Kytickar Backend

Express + Prisma + SQLite backend.

## Start

1. Nainstaluj balicky:
   npm install
2. Vytvor DB strukturu:
   npm run prisma:migrate
3. Napln zakladni data:
   npm run db:seed
4. Spust server:
   npm run dev

## Endpointy

- GET /health
- POST /api/files/upload (multipart/form-data, field name: file)
- GET /api/files/:fileName
- GET /api/druhy
- GET /api/umisteni
- GET /api/rostliny
- POST /api/rostliny
- POST /api/historie-pece
- GET /api/galerie-fotky/:rostlinaId

## Foto upload flow

1. Posli obrazek na POST /api/files/upload jako multipart/form-data pod fieldem `file`.
2. Backend ulozi soubor do `uploads/` pod generovanym nazvem.
3. Odpoved obsahuje `fileName` a `readUrl`, `fileName` uloz do DB (napr. `fotka_name`).
4. Pro nacteni obrazku pouzij GET /api/files/:fileName.
