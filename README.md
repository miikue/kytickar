# kytickar

Jednoduchy plant dashboard pro vlastni testovani.

## Rychly tutorial: Debian VM (test nasazeni)

Tento postup je schvalne jednoduchy. Vhodne pro lokalni/staging test bez slozite infrastruktury.

### 1) Instalace zakladnich balicku

```bash
sudo apt update
sudo apt install -y git curl build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v
npm -v
```

### 2) Stazeni projektu

```bash
git clone <TVUJ_REPO_URL>
cd kytickar
```

### 3) Automaticka instalace (balicky + DB)

Pokud chces vsechno najednou:

```bash
chmod +x setup.sh
./setup.sh
```

**NEBO ručně po krocích:**

### 3a) Backend: instalace + DB + seed

```bash
cd app/backend
npm ci
npx prisma migrate deploy
npm run db:seed
```

### 4) Spusteni backendu

```bash
cd app/backend
npm run start
```

Backend bezi defaultne na portu `4000`.

### 5) Frontend: instalace + spusteni

Otevri druhy terminal:

```bash
cd kytickar/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Frontend bezi na portu `5173`.

### 6) Otevreni aplikace

V prohlizeci otevri:

```text
http://IP_TVE_VM:5173
```

## Spusteni jako sluzba (systemd, bez terminalu)

Pokud chces, aby app bezela i po odhlaseni/restartu VM, pouzij systemd.

### 1) Priprav frontend build

```bash
cd app
npm ci
npm run build
```

### 2) Zkopiruj service soubory do systemd

V repu jsou pripravene sablony (bezici jako root):

- `deploy/systemd/kytickar-backend.service`
- `deploy/systemd/kytickar-frontend.service`

Zkopiruj je:

```bash
cp deploy/systemd/kytickar-backend.service /etc/systemd/system/
cp deploy/systemd/kytickar-frontend.service /etc/systemd/system/
```

### 3) Zapni a spust sluzby

```bash
systemctl daemon-reload
systemctl enable --now kytickar-backend
systemctl enable --now kytickar-frontend
```

### 4) Kontrola stavu

```bash
systemctl status kytickar-backend
systemctl status kytickar-frontend
```

### 5) Logy

```bash
sudo journalctl -u kytickar-backend -f
sudo journalctl -u kytickar-frontend -f
```

### 6) Po update kodu

```bash
cd ~/kytickar/app/backend && npm ci
cd ~/kytickar/app && npm ci && npm run build

sudo systemctl restart kytickar-backend
sudo systemctl restart kytickar-frontend
```

## Dulezite poznamky

- SQLite databaze je v `app/backend/prisma/dev.db`.
- Uploady fotek jsou v `app/backend/uploads`.
- V dev rezimu se po restartu VM procesy automaticky neobnovi (pro testovani normalni).

## Kratky troubleshoot

### Port nejde otevrit

- Over firewall na VM (napr. `ufw`), povol `5173` a `4000`.
- Over, ze opravdu bezis s `--host 0.0.0.0`.

### Chybi data

Spust znovu seed:

```bash
cd app/backend
npm run db:seed
```

### Chci cistou DB od zacatku

```bash
cd app/backend
npx prisma migrate reset --force --skip-generate
```