import type { Druh, Medium, Rod, Rostlina, TypAkce, Umisteni } from '../types/app';
import { apiGet } from './http';

export type DashboardData = {
  rostliny: Rostlina[];
  druhy: Druh[];
  rody: Rod[];
  media: Medium[];
  umisteni: Umisteni[];
  typyAkci: TypAkce[];
};

export async function fetchDashboardData(): Promise<DashboardData> {
  const [rostliny, druhy, rody, media, umisteni, typyAkci] = await Promise.all([
    apiGet<Rostlina[]>('/api/rostliny'),
    apiGet<Druh[]>('/api/druhy'),
    apiGet<Rod[]>('/api/rody'),
    apiGet<Medium[]>('/api/media'),
    apiGet<Umisteni[]>('/api/umisteni'),
    apiGet<TypAkce[]>('/api/typy-akci'),
  ]);

  return { rostliny, druhy, rody, media, umisteni, typyAkci };
}
