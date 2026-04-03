import type { Druh, Medium, Rod, Rostlina, Umisteni } from '../types/app';
import { apiGet } from './http';

export type DashboardData = {
  rostliny: Rostlina[];
  druhy: Druh[];
  rody: Rod[];
  media: Medium[];
  umisteni: Umisteni[];
};

export async function fetchDashboardData(): Promise<DashboardData> {
  const [rostliny, druhy, rody, media, umisteni] = await Promise.all([
    apiGet<Rostlina[]>('/api/rostliny'),
    apiGet<Druh[]>('/api/druhy'),
    apiGet<Rod[]>('/api/rody'),
    apiGet<Medium[]>('/api/media'),
    apiGet<Umisteni[]>('/api/umisteni'),
  ]);

  return { rostliny, druhy, rody, media, umisteni };
}
