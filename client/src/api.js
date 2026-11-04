const API_BASE = '/api';

export function getToken() {
  return localStorage.getItem('leaktrace_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('leaktrace_token', token);
  else localStorage.removeItem('leaktrace_token');
}

export async function apiRequest(endpoint, options = {}) {
  const headers = options.headers || {};
  const token = getToken();

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to JSON
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }

  return res;
}

