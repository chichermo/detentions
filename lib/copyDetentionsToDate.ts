'use client';

import { Detention } from '@/types';
import { apiFetch, OfflineQueuedError } from '@/lib/apiClient';
import { fetchCalendarDays, getDaySettingFromList } from '@/lib/calendarDaysClient';
import {
  validateNoDuplicateStudentsInBatch,
  validateSessionCapacity,
  validateUniqueStudentOnDate,
  normalizeDetentionDate,
} from '@/lib/detentionValidation';
import { parseSessionDate } from '@/lib/calendarUtils';

export class CopyDetentionsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CopyDetentionsError';
  }
}

function throwCopy(message: string): never {
  throw new CopyDetentionsError(message);
}

/** Kopieer één of meer nablijven naar een andere geldige sessiedatum. */
export async function copyDetentionsToDate(
  detentions: Detention[],
  sourceDate: string,
  targetDateInput: string
): Promise<{ targetDate: string; count: number; extra: string }> {
  if (detentions.length === 0) {
    throwCopy('Er is niets om te kopiëren.');
  }

  const parsed = parseSessionDate(targetDateInput);
  if (!parsed) {
    throwCopy('Kies een maandag, dinsdag of donderdag. Het nablijven kan alleen op die dagen.');
  }

  const source = normalizeDetentionDate(sourceDate);
  if (parsed.date === source) {
    throwCopy('Kies een andere datum dan de huidige sessie.');
  }

  let allowStrafOnTarget = true;
  try {
    const days = await fetchCalendarDays(parsed.date, parsed.date);
    const cfg = getDaySettingFromList(parsed.date, days);
    if (cfg?.blocked) {
      throwCopy('Deze dag is geblokkeerd. Geen nablijven mogelijk.');
    }
    if (cfg && !cfg.allowDetentions) {
      throwCopy('Voor deze dag zijn geen nablijven toegestaan volgens de kalender.');
    }
    allowStrafOnTarget = cfg?.allowStrafstudie !== false;
  } catch (error) {
    if (error instanceof CopyDetentionsError) throw error;
    /* offline: verder met clientvalidatie */
  }

  const existingRes = await apiFetch('/api/detentions', { cache: 'no-store' });
  const existingData = await existingRes.json().catch(() => []);
  const allExisting: Detention[] = Array.isArray(existingData) ? existingData : [];
  const existingOnTarget = allExisting.filter(
    (d) => normalizeDetentionDate(d.date) === parsed.date
  );

  const capacityErr = validateSessionCapacity(existingOnTarget.length, detentions.length);
  if (capacityErr) throwCopy(capacityErr);

  const batchErr = validateNoDuplicateStudentsInBatch(detentions);
  if (batchErr) throwCopy(batchErr);

  const isTargetMonday = parsed.dayOfWeek === 'MAANDAG';
  const stamp = Date.now();
  const planned: Detention[] = [];
  let strafstudieOmgezet = 0;

  for (let i = 0; i < detentions.length; i++) {
    const detention = detentions[i];
    let isDoublePeriod = !!detention.isDoublePeriod && isTargetMonday;
    if (detention.isDoublePeriod && (!isTargetMonday || !allowStrafOnTarget)) {
      isDoublePeriod = false;
      strafstudieOmgezet += 1;
    }

    const payload: Detention = {
      ...detention,
      id: `detention-${stamp}-${i}`,
      date: parsed.date,
      dayOfWeek: parsed.dayOfWeek,
      number: existingOnTarget.length + i + 1,
      isDoublePeriod,
      timePeriod: isDoublePeriod ? detention.timePeriod : undefined,
      sourceDetentionId: undefined,
      nablijvenGeweigerd: false,
      didNotAttend: false,
    };

    const dupErr = validateUniqueStudentOnDate(payload, [...existingOnTarget, ...planned]);
    if (dupErr) throwCopy(dupErr);
    planned.push(payload);
  }

  for (const payload of planned) {
    const response = await apiFetch('/api/detentions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throwCopy(
        (data as { details?: string; error?: string }).details ||
          (data as { error?: string }).error ||
          'Fout bij dupliceren. Probeer het opnieuw.'
      );
    }
  }

  const extra =
    strafstudieOmgezet > 0
      ? isTargetMonday
        ? ' Strafstudie is omgezet naar gewoon nablijven (niet toegestaan op deze maandag).'
        : ' Strafstudie is omgezet naar gewoon nablijven (alleen op maandag mogelijk).'
      : '';

  return { targetDate: parsed.date, count: planned.length, extra };
}

export function copyDetentionsErrorMessage(error: unknown): string {
  if (error instanceof CopyDetentionsError) return error.message;
  if (error instanceof OfflineQueuedError) return error.message;
  return 'Fout bij dupliceren. Controleer je verbinding en probeer het opnieuw.';
}
