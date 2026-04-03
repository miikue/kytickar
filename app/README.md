# Kytickář App

Vite + React + TypeScript scaffold pro botanickou aplikaci.

## Spuštění

```bash
npm install
npm run dev
```

## Pristup z jineho zarizeni

Pro pristup z telefonu nebo jineho pocitace v siti spust frontend i backend tak, aby poslouchaly na vsech rozhranych.

Frontend:

```bash
npm run dev -- --host 0.0.0.0
```

Frontend pouziva relative API cestu a pres Vite proxy smeruje na backend, takze v dev rezimu nemusis nastavovat `VITE_API_URL`.

Backend:

```bash
npm run dev
```

Pak otevri aplikaci pres IP adresu tveho pocitace. Pokud chces frontend otevrit z jineho zarizeni, musis spustit Vite s `--host 0.0.0.0` a zustat na stejné siti.
