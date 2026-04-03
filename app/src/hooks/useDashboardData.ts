import { useCallback, useEffect, useState } from 'react';
import { fetchDashboardData } from '../api/dashboardApi';
import type { Druh, Medium, Rod, Rostlina, Umisteni } from '../types/app';

export function useDashboardData() {
  const [rostliny, setRostliny] = useState<Rostlina[]>([]);
  const [druhy, setDruhy] = useState<Druh[]>([]);
  const [rody, setRody] = useState<Rod[]>([]);
  const [media, setMedia] = useState<Medium[]>([]);
  const [umisteni, setUmisteni] = useState<Umisteni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardData();
      setRostliny(data.rostliny);
      setDruhy(data.druhy);
      setRody(data.rody);
      setMedia(data.media);
      setUmisteni(data.umisteni);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznama chyba');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    rostliny,
    druhy,
    rody,
    media,
    umisteni,
    loading,
    error,
    reload,
  };
}
