const store = new Map();
const MAX_CACHE_SIZE = 100;

export function getCached(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
    }
    // Refresh access order (LRU)
    store.delete(key);
    store.set(key, entry);
    return entry.data;
}

export function setCached(key, data, ttlMs = 60_000) {
    if (store.size >= MAX_CACHE_SIZE) {
        // Evict least-recently used (first item in Map iterator)
        const oldestKey = store.keys().next().value;
        store.delete(oldestKey);
    }
    store.set(key, { data, expiresAt: Date.now() + ttlMs, updatedAt: Date.now() });
}

export function invalidateCache(key) {
    store.delete(key);
}

export function invalidatePattern(prefix) {
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
    }
}

/**
 * Stale-while-revalidate pattern:
 * Returns cached data immediately if present (even if slightly stale),
 * while executing fetcher in the background to update the cache.
 */
export async function staleWhileRevalidate(key, fetcher, ttlMs = 60_000) {
    const entry = store.get(key);
    const hasData = entry && entry.data;

    const refreshPromise = fetcher()
        .then((freshData) => {
            setCached(key, freshData, ttlMs);
            return freshData;
        })
        .catch((err) => {
            if (!hasData) throw err;
            return entry.data;
        });

    if (hasData) {
        return entry.data;
    }

    return refreshPromise;
}

export function clearCache() {
    store.clear();
}
