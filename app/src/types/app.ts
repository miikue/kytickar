export type TabKey = 'kytky' | 'druhy' | 'media' | 'rody' | 'umisteni' | 'akce' | 'pridat';

export type Medium = {
  id: number;
  nazev: string;
  popis: string | null;
};

export type Rod = {
  id: number;
  nazev: string;
  popis: string | null;
};

export type Umisteni = {
  id: number;
  nazev: string;
  parentId: number | null;
};

export type TypAkce = {
  id: number;
  typAkce: string;
  ikona?: string | null;
  intervalDny?: number | null;
  odlozitDny?: number | null;
  isWatering?: boolean | null;
};

export type ActivityLog = {
  id: number;
  createdAt: string;
  eventType: string;
  section: string;
  label: string | null;
  entityId: number | null;
  details: string | null;
};

export type GalerieFotka = {
  id: number;
  rostlinaId: number;
  fotkaName: string;
  datumPorizeni: string;
  poznamka: string | null;
};

export type HistoriePece = {
  id: number;
  datum: string;
  rostlinaId: number;
  typAkceId: number;
  typAkce: TypAkce;
};

export type Druh = {
  id: number;
  nazev: string;
  popis: string | null;
  rodId: number | null;
  fotka1Name: string | null;
  fotka2Name: string | null;
  rod?: Rod | null;
};

export type Rostlina = {
  id: number;
  vlastniJmeno: string;
  aktualniZdravi: number;
  datumPorizeni: string;
  druh: Druh;
  medium?: Medium | null;
  umisteni?: Umisteni | null;
  galerieFotky?: GalerieFotka[];
};

export type RostlinaOdZaliti = {
  id: number;
  vlastniJmeno: string;
  aktualniZdravi: number;
  druh: {
    id: number;
    nazev: string;
    rodNazev: string | null;
  };
  posledniZaliti: string | null;
  dnyOdPoslednihoZaliti: number | null;
};
