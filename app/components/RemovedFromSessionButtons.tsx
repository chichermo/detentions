'use client';

import { useState } from 'react';
import { Detention } from '@/types';
import { apiFetch, OfflineQueuedError } from '@/lib/apiClient';

type Props = {
  detention: Detention;
  disabled?: boolean;
  onUpdated?: () => void;
};

export default function RemovedFromSessionButtons({
  detention,
  disabled,
  onUpdated,
}: Props) {
  const [busy, setBusy] = useState(false);
  const isStrafstudie = !!detention.isDoublePeriod;

  const save = async (patch: Partial<Detention>) => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const response = await apiFetch('/api/detentions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...detention, ...patch }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(
          (data as { details?: string; error?: string }).details ||
            (data as { error?: string }).error ||
            'Kon de status niet opslaan.'
        );
        return;
      }
      onUpdated?.();
    } catch (error) {
      alert(
        error instanceof OfflineQueuedError
          ? error.message
          : 'Kon de status niet opslaan. Probeer het opnieuw.'
      );
    } finally {
      setBusy(false);
    }
  };

  const stillNeedsFollowUp = (patch: Partial<Detention>) =>
    !!(
      (patch.nablijvenGeweigerd ?? detention.nablijvenGeweigerd) ||
      (patch.removedFromNablijven ?? detention.removedFromNablijven) ||
      (patch.removedFromStrafstudie ?? detention.removedFromStrafstudie)
    );

  const toggle = (patch: Partial<Detention>) => {
    save({
      ...patch,
      followUpClosed: stillNeedsFollowUp(patch) ? detention.followUpClosed : false,
    });
  };

  return (
    <div className="detention-card__dismiss">
      {isStrafstudie ? (
        <>
          <button
            type="button"
            className={`detention-card__dismiss-btn ${
              detention.nablijvenGeweigerd ? 'is-on' : ''
            }`}
            disabled={busy || disabled}
            aria-pressed={!!detention.nablijvenGeweigerd}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle({ nablijvenGeweigerd: !detention.nablijvenGeweigerd });
            }}
          >
            Strafstudie geweigerd
          </button>
          <button
            type="button"
            className={`detention-card__dismiss-btn ${
              detention.removedFromStrafstudie ? 'is-on' : ''
            }`}
            disabled={busy || disabled}
            aria-pressed={!!detention.removedFromStrafstudie}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle({ removedFromStrafstudie: !detention.removedFromStrafstudie });
            }}
          >
            Uit strafstudie gezet
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={`detention-card__dismiss-btn ${
              detention.nablijvenGeweigerd ? 'is-on' : ''
            }`}
            disabled={busy || disabled}
            aria-pressed={!!detention.nablijvenGeweigerd}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle({ nablijvenGeweigerd: !detention.nablijvenGeweigerd });
            }}
          >
            Nablijven geweigerd
          </button>
          <button
            type="button"
            className={`detention-card__dismiss-btn ${
              detention.removedFromNablijven ? 'is-on' : ''
            }`}
            disabled={busy || disabled}
            aria-pressed={!!detention.removedFromNablijven}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle({ removedFromNablijven: !detention.removedFromNablijven });
            }}
          >
            Uit nablijven gezet
          </button>
        </>
      )}
    </div>
  );
}
