'use client';

import { addPendingOperation, saveToLocalDB } from '@/lib/sync';
import { getActorLabel } from '@/lib/auth';
import type { Detention, Student } from '@/types';

const ACTOR_HEADER = 'x-nablijven-actor';

export function withActorHeaders(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers);
  try {
    const actor = getActorLabel();
    if (actor) headers.set(ACTOR_HEADER, actor);
  } catch {
    /* ignore */
  }
  return { ...init, headers };
}

export class OfflineQueuedError extends Error {
  constructor() {
    super('Wijziging opgeslagen; wordt gesynchroniseerd zodra je weer online bent.');
    this.name = 'OfflineQueuedError';
  }
}

function isOfflineError(err: unknown): boolean {
  return (
    (typeof navigator !== 'undefined' && !navigator.onLine) ||
    err instanceof TypeError
  );
}

async function queueOperation(
  url: string,
  init: RequestInit | undefined,
  bodyData: unknown
): Promise<void> {
  const method = (init?.method || 'GET').toUpperCase();
  const entity = url.includes('/students') ? 'student' : 'detention';

  if (method === 'GET') return;

  let type: 'create' | 'update' | 'delete' = 'create';
  if (method === 'DELETE') type = 'delete';
  else if (method === 'PUT') type = 'update';
  else if (method === 'POST') type = 'create';

  let data = bodyData;
  if (method === 'DELETE' && typeof url === 'string') {
    const id = new URL(url, window.location.origin).searchParams.get('id');
    data = { id };
  }

  await addPendingOperation({ type, entity, data });
}

async function cacheGetResponse(url: string, res: Response): Promise<void> {
  if (!url.includes('/api/detentions') && !url.includes('/api/students')) return;
  if (url.includes('sessions')) return;
  try {
    const data = await res.clone().json();
    if (!Array.isArray(data)) return;
    if (url.includes('/students')) {
      await saveToLocalDB('students', data as Student[]);
    } else {
      await saveToLocalDB('detentions', data as Detention[]);
    }
  } catch {
    /* ignore cache errors */
  }
}

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  let bodyData: unknown;
  if (init?.body && typeof init.body === 'string') {
    try {
      bodyData = JSON.parse(init.body);
    } catch {
      bodyData = init.body;
    }
  }

  try {
    const withActor = withActorHeaders(init);
    const res = await fetch(url, {
      ...withActor,
      cache: withActor.method === 'GET' || !withActor.method ? 'no-store' : withActor.cache,
    });

    if (res.ok && (!init?.method || init.method === 'GET')) {
      await cacheGetResponse(url, res);
    }

    if (!res.ok && typeof navigator !== 'undefined' && !navigator.onLine) {
      await queueOperation(url, init, bodyData);
      throw new OfflineQueuedError();
    }

    return res;
  } catch (err) {
    if (isOfflineError(err)) {
      await queueOperation(url, init, bodyData);
      throw new OfflineQueuedError();
    }
    throw err;
  }
}

export async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(url, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { details?: string; error?: string }).details || (data as { error?: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}
