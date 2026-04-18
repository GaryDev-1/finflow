const TOKEN_KEY = 'finflow_token';
const USER_KEY = 'finflow_user';
const COOKIE_MAX_AGE = 8 * 60 * 60; // 8 hours, matches JWT_EXPIRY

export interface StoredUser {
  id: string;
  username: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: StoredUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Also write a cookie so Next.js middleware can read it server-side
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Expire the cookie
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}
