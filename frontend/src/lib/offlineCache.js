// Read-side offline support: cache the last-known-good API response so
// screens (e.g. a teacher's roster) still render with no network, falling
// back to whatever was cached the last time the request succeeded.
const PREFIX = 'cache_';

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function cacheSet(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — degrade silently, this is a convenience cache
  }
}

// Fetch fresh data, cache it on success, fall back to the cache on failure.
// Throws only if the request fails AND there's nothing cached yet.
export async function cachedFetch(key, fetchFn) {
  try {
    const data = await fetchFn();
    cacheSet(key, data);
    return { data, fromCache: false };
  } catch (err) {
    const cached = cacheGet(key);
    if (cached !== null) return { data: cached, fromCache: true };
    throw err;
  }
}
