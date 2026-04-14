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

export type DevOverview = {
  generatedAt: string;
  counts: {
    media: number;
    druhy: number;
    umisteni: number;
    rostliny: number;
    typyAkci: number;
    activityLog: number;
    historiePece: number;
    odlozeneAkce: number;
    galerieFotky: number;
  };
  posledniRostliny: Array<{
    id: number;
    vlastniJmeno: string;
    aktualniZdravi: number;
    druh: { nazev: string };
  }>;
  posledniHistorie: Array<{
    id: number;
    datum: string;
    rostlina: { vlastniJmeno: string };
    typAkce: { typAkce: string };
  }>;
  posledniMedia: Array<{
    id: number;
    nazev: string;
    popis: string | null;
  }>;
  posledniAktivity: ActivityLog[];
};

export type DevTableName =
  | 'media'
  | 'druhy'
  | 'umisteni'
  | 'rostliny'
  | 'typyAkci'
  | 'activityLog'
  | 'historiePece'
  | 'odlozeneAkce'
  | 'galerieFotky';

export type DevTableResponse = {
  tableName: DevTableName;
  rowCount: number;
  rows: Array<Record<string, unknown>>;
};
