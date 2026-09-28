const API_BASE = (import.meta.env.VITE_API_URL || 'https://jacker-cy30.onrender.com').replace(/\/+$/, '');

export const apiUrl = API_BASE;

export const getAuthHeaders = (token) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  'Content-Type': 'application/json',
});

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return { success: false, message: `The server returned an unreadable response (${response.status}).` };
  }
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    auth = true,
    token = localStorage.getItem('accessToken') || '',
    onTokenChange,
    retry = true,
  } = options;
  const route = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE}/api/v1${route}`;

  const send = (accessToken) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let activeToken = token;
  let response = await send(activeToken);
  let payload = await readJson(response);
  const canRefresh = auth && retry && activeToken && response.status === 401 && !['/auth/logout', '/refresh-token'].includes(route);

  if (canRefresh) {
    try {
      const refreshResponse = await fetch(`${API_BASE}/api/v1/refresh-token`, {
        method: 'POST',
        credentials: 'include',
      });
      const refreshPayload = await readJson(refreshResponse);
      const freshToken = refreshPayload?.data?.token;
      if (refreshResponse.ok && freshToken) {
        activeToken = freshToken;
        localStorage.setItem('accessToken', freshToken);
        onTokenChange?.(freshToken);
        response = await send(activeToken);
        payload = await readJson(response);
      }
    } catch {
      // The original request below provides the useful error if refreshing is unavailable.
    }
  }

  if (!response.ok) {
    const error = new Error(payload.message || `Request failed (${response.status}).`);
    error.status = response.status;
    error.errors = payload.errors || [];
    throw error;
  }

  return payload?.data ?? payload;
}
