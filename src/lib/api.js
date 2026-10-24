export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function request(path, options) {
  const res = await fetch(path, { credentials: 'same-origin', ...options });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? `Erreur ${res.status}`);
  return body;
}

export const api = {
  me: () => request('/api/me'),
  stats: (year) => request(`/api/stats?year=${year}&tz=${new Date().getTimezoneOffset()}`),
  sessions: (limit = 20) => request(`/api/sessions?limit=${limit}`),
  games: () => request('/api/games'),
  game: (appid) => request(`/api/games/${appid}`),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

/** Déconnexion puis retour à la page de connexion. */
export async function logout() {
  await api.logout().catch(() => {});
  window.location.assign('/');
}
