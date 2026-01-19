/**
 * Utilidades para sincronización automática (offline-first)
 */

import { Detention, Student } from '@/types';

const DB_NAME = 'nablijven-db';
const STORE_DETENTIONS = 'detentions';
const STORE_STUDENTS = 'students';
const STORE_PENDING = 'pending';

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(STORE_DETENTIONS)) {
        database.createObjectStore(STORE_DETENTIONS, { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains(STORE_STUDENTS)) {
        database.createObjectStore(STORE_STUDENTS, { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains(STORE_PENDING)) {
        database.createObjectStore(STORE_PENDING, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

export async function saveToLocalDB(store: string, items: (Detention | Student)[]): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction([store], 'readwrite');
  const objectStore = transaction.objectStore(store);

  await Promise.all(items.map(item => {
    return new Promise<void>((resolve, reject) => {
      const request = objectStore.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }));
}

export async function getFromLocalDB<T>(store: string): Promise<T[]> {
  const database = await initDB();
  const transaction = database.transaction([store], 'readonly');
  const objectStore = transaction.objectStore(store);

  return new Promise((resolve, reject) => {
    const request = objectStore.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function addPendingOperation(operation: {
  type: 'create' | 'update' | 'delete';
  entity: 'detention' | 'student';
  data: any;
}): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction([STORE_PENDING], 'readwrite');
  const objectStore = transaction.objectStore(STORE_PENDING);

  return new Promise((resolve, reject) => {
    const request = objectStore.add({
      ...operation,
      timestamp: Date.now(),
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingOperations(): Promise<any[]> {
  const database = await initDB();
  const transaction = database.transaction([STORE_PENDING], 'readonly');
  const objectStore = transaction.objectStore(STORE_PENDING);

  return new Promise((resolve, reject) => {
    const request = objectStore.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function removePendingOperation(id: number): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction([STORE_PENDING], 'readwrite');
  const objectStore = transaction.objectStore(STORE_PENDING);

  return new Promise((resolve, reject) => {
    const request = objectStore.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function syncPendingOperations(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.onLine) {
    return;
  }

  const pending = await getPendingOperations();

  for (const operation of pending) {
    try {
      const endpoint = operation.entity === 'detention' ? '/api/detentions' : '/api/students';
      let response: Response;

      if (operation.type === 'delete') {
        response = await fetch(`${endpoint}?id=${operation.data.id}`, {
          method: 'DELETE',
        });
      } else if (operation.type === 'update') {
        response = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(operation.data),
        });
      } else {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(operation.data),
        });
      }

      if (response.ok) {
        await removePendingOperation(operation.id);
      }
    } catch (error) {
      console.error('Error syncing operation:', error);
    }
  }
}

// Sincronizar automáticamente cuando se recupera la conexión
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncPendingOperations();
  });

  // Sincronizar periódicamente
  setInterval(() => {
    syncPendingOperations();
  }, 30000); // Cada 30 segundos
}
