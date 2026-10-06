export function createApi(token) {
  return async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("X-Aurora-Token", token);

    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(path, { ...options, headers });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        payload.error ||
        payload.stderr ||
        "AurorA request failed."
      );
    }

    return payload;
  };
}

export function createMediaUrl(token) {
  return function mediaUrl(media) {
    if (!media?.path) return null;

    return "/media?path=" +
      encodeURIComponent(media.path) +
      "&token=" +
      encodeURIComponent(token);
  };
}

export function createRawApi(token) {
  return async function rawApi(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("X-Aurora-Token", token);

    const response = await fetch(path, {
      ...options,
      headers
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        payload.error ||
        payload.stderr ||
        "AurorA request failed."
      );
    }

    return payload;
  };
}
