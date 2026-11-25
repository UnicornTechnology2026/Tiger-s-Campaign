import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMyStatus } from '../services/campaignService';
import { toMessage } from '../lib/errors';
import type { CustomerStage, MyStatus } from '../types';

const INITIAL: MyStatus = {
  status: 'unregistered',
  full_name: null,
  mobile: null,
  reward_ml: null,
  claim_id: null,
  spun_at: null,
};

interface CampaignContextValue {
  status: MyStatus;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<MyStatus | null>;
}

const Ctx = createContext<CampaignContextValue | null>(null);

export function routeForStage(stage: CustomerStage): string {
  switch (stage) {
    case 'registered':
      return '/verify';
    case 'verified':
      return '/spin';
    case 'spun':
      return '/result';
    default:
      return '/register';
  }
}

/** The server is the source of truth for where the customer is in the flow. */
export function CampaignProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<MyStatus>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await getMyStatus();
      setStatus(s);
      setError(null);
      return s;
    } catch (e) {
      setError(toMessage(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ status, loading, error, refresh }), [status, loading, error, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCampaign() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCampaign must be used inside CampaignProvider');
  return v;
}
