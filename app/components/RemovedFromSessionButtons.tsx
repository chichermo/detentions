'use client';

import { useState } from 'react';
import { Detention } from '@/types';
import { apiFetch, OfflineQueuedError } from '@/lib/apiClient';

type Props = {
  detention: Detention;
  isMonday: boolean;
  disabled?: boolean;
  onUpdated?: () => void;
};

export default function RemovedFromSessionButtons({
  detention,
  isMonday,
  disabled,
  onUpdated,
}: Props) {
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="detention-card__dismiss">
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
          save({ removedFromNablijven: !detention.removedFromNablijven });
        }}
      >
        Uit nablijven gezet
      </button>
      {isMonday && (
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
            save({ removedFromStrafstudie: !detention.removedFromStrafstudie });
          }}
        >
          Uit strafstudie gezet
        </button>
      )}
    </div>
  );
}
