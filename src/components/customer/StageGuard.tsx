import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { routeForStage, useCampaign } from '../../context/CampaignContext';
import { CampaignShell } from './CampaignShell';
import { Spinner } from '../common/Spinner';
import type { CustomerStage } from '../../types';

/**
 * Only renders its children when the SERVER says the customer is at one of the
 * allowed stages; otherwise redirects to the right step. This makes the flow
 * refresh-safe and stops anyone skipping ahead by typing a URL.
 */
export function StageGuard({ allow, children }: { allow: CustomerStage[]; children: ReactNode }) {
  const { status, loading, error, refresh } = useCampaign();

  if (loading) {
    return (
      <CampaignShell>
        <div className="flex flex-col items-center gap-3" role="status">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-white/70">Loading…</p>
        </div>
      </CampaignShell>
    );
  }

  if (error) {
    return (
      <CampaignShell>
        <div className="glass-card text-center">
          <p className="font-semibold">{error}</p>
          <button type="button" className="btn-primary mt-4" onClick={() => void refresh()}>
            Try again
          </button>
        </div>
      </CampaignShell>
    );
  }

  if (!allow.includes(status.status)) {
    return <Navigate to={routeForStage(status.status)} replace />;
  }
  return <>{children}</>;
}
