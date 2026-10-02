/**
 * High-performance Storage for Optical Air-Gap Diode
 * Uses IndexedDB for large payloads (up to tens of megabytes) with in-memory fallback.
 * Prevents localStorage QuotaExceededError and memory crashes on heavy queue data.
 */

const DB_NAME = 'sayeh_airgap_store';
const STORE_NAME = 'payload_blobs';
const DB_VERSION = 1;

// Fast in-memory cache for zero-latency retrieval
const memoryCache = new Map<string, string>();

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB'));
      };
    } catch (err) {
      reject(err);
    }
  });

  return dbPromise;
}

/**
 * Save payload data for a specific queue item ID
 */
export async function savePayloadData(id: string, data: string): Promise<void> {
  if (!id) return;
  memoryCache.set(id, data);

  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    // Graceful fallback to memoryCache if IndexedDB fails (e.g. private browsing storage restrictions)
    console.warn('IndexedDB write skipped, payload kept in memory cache:', e);
  }
}

/**
 * Retrieve payload data for a specific queue item ID
 */
export async function getPayloadData(id: string): Promise<string | null> {
  if (!id) return null;
  if (memoryCache.has(id)) {
    return memoryCache.get(id) || null;
  }

  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const val = req.result as string | undefined;
        if (val) {
          memoryCache.set(id, val);
          resolve(val);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Delete payload data for a specific queue item ID
 */
export async function deletePayloadData(id: string): Promise<void> {
  if (!id) return;
  memoryCache.delete(id);

  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {}
}

/**
 * Clear all payloads from database and memory
 */
export async function clearAllPayloads(): Promise<void> {
  memoryCache.clear();

  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {}
}
