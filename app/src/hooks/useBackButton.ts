import { useEffect, useRef } from 'react';
import { backButtonService, type BackHandler } from '../services/backButtonService';

/**
 * Zaregistruje obsluhu tlačítka Zpět (Android hardware tlačítko i browser popstate),
 * dokud je parametr `isActive` pravdivý.
 * 
 * Handlery s vyšší prioritou se vykonávají dříve (např. modal má vyšší prioritu než detail).
 */
export function useBackButton(
  id: string,
  priority: number,
  isActive: boolean,
  onBack: BackHandler
): void {
  const handlerRef = useRef(onBack);
  handlerRef.current = onBack;

  useEffect(() => {
    if (!isActive) return;

    return backButtonService.register(id, priority, () => {
      return handlerRef.current();
    });
  }, [id, priority, isActive]);
}
