const store = new Map();
const pendingRequests = new Map();
const MAX_CACHE_SIZE = 150;
export const DEFAULT_FRESH_MS = 30_000; // 30 seconds fresh window (0ms response, no network request)
export const DEFAULT_TTL_MS = 300_000; // 5 minutes max cache lifetime

export function normalizeKey(key) {
    if (!key) return '';
    if (typeof key !== 'string') return String(key);
    if (key === 'decks' || key === 'dashboard_decks') return '/api/decks';
    if (key === 'collections') return '/api/collections';
    if (key === 'quiz_stats') return '/api/quiz/stats';
    if (key.startsWith('deck_')) {
        const id = key.replace(/^deck_/, '');
        return `/api/decks/${id}`;
    }
    return key;
}

export function buildCacheKey(url, params) {
    if (!params || Object.keys(params).length === 0) {
        return normalizeKey(url);
    }
    const sortedParams = new URLSearchParams();
    Object.keys(params).sort().forEach(k => {
        if (params[k] !== undefined && params[k] !== null) {
            sortedParams.set(k, String(params[k]));
        }
    });
    const queryStr = sortedParams.toString();
    const cleanUrl = normalizeKey(url);
    return queryStr ? `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}${queryStr}` : cleanUrl;
}

export function getCacheEntry(key) {
    const norm = normalizeKey(key);
    const entry = store.get(norm) || store.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
        store.delete(norm);
        store.delete(key);
        return null;
    }

    // Refresh LRU order
    store.delete(norm);
    store.set(norm, entry);

    return {
        data: entry.data,
        freshUntil: entry.freshUntil,
        expiresAt: entry.expiresAt,
        updatedAt: entry.updatedAt,
        isFresh: now <= entry.freshUntil,
    };
}

export function getCached(key) {
    const entry = getCacheEntry(key);
    return entry ? entry.data : null;
}

export function isCacheFresh(key) {
    const entry = getCacheEntry(key);
    return Boolean(entry && entry.isFresh);
}

export function setCached(key, data, ttlMs = DEFAULT_TTL_MS, freshMs = DEFAULT_FRESH_MS) {
    const norm = normalizeKey(key);
    if (store.size >= MAX_CACHE_SIZE) {
        const oldestKey = store.keys().next().value;
        store.delete(oldestKey);
    }
    const now = Date.now();
    const entry = {
        data,
        freshUntil: now + freshMs,
        expiresAt: now + ttlMs,
        updatedAt: now,
    };
    store.set(norm, entry);
    if (norm !== key) {
        store.set(key, entry);
    }
}

export function invalidateCache(key) {
    const norm = normalizeKey(key);
    store.delete(norm);
    store.delete(key);
    pendingRequests.delete(norm);
    pendingRequests.delete(key);
}

export function invalidatePattern(prefix) {
    const normPrefix = normalizeKey(prefix);
    for (const k of Array.from(store.keys())) {
        if (k.startsWith(prefix) || k.startsWith(normPrefix)) {
            store.delete(k);
        }
    }
    for (const k of Array.from(pendingRequests.keys())) {
        if (k.startsWith(prefix) || k.startsWith(normPrefix)) {
            pendingRequests.delete(k);
        }
    }
}

export function clearCache() {
    store.clear();
    pendingRequests.clear();
}

/**
 * Deduplicates in-flight asynchronous operations so concurrent calls for the same key share 1 execution.
 */
export async function dedupedRequest(key, fetcher) {
    const norm = normalizeKey(key);
    if (pendingRequests.has(norm)) {
        return pendingRequests.get(norm);
    }
    const promise = (async () => {
        try {
            return await fetcher();
        } finally {
            pendingRequests.delete(norm);
        }
    })();
    pendingRequests.set(norm, promise);
    return promise;
}

/**
 * Stale-while-revalidate pattern:
 * Returns cached data immediately if present (even if slightly stale),
 * while executing fetcher in the background to update the cache.
 */
export async function staleWhileRevalidate(key, fetcher, ttlMs = DEFAULT_TTL_MS, freshMs = DEFAULT_FRESH_MS) {
    const norm = normalizeKey(key);
    const entry = getCacheEntry(norm);

    if (entry) {
        // If data is fresh, return immediately with zero background fetch
        if (entry.isFresh) {
            return entry.data;
        }

        // Stale data: revalidate in background without blocking
        dedupedRequest(norm, fetcher)
            .then((freshData) => {
                setCached(norm, freshData, ttlMs, freshMs);
            })
            .catch(() => {});

        return entry.data;
    }

    // No cache: fetch with deduplication
    const freshData = await dedupedRequest(norm, fetcher);
    setCached(norm, freshData, ttlMs, freshMs);
    return freshData;
}
