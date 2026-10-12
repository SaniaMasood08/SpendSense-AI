export type AuthUser = { id: string; email?: string; user_metadata?: { full_name?: string } };
export type AuthSession = { access_token: string; refresh_token: string; expires_at?: number; expires_in?: number; user: AuthUser };
const SESSION_KEY = "spendsense-auth-session";

export function authConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Authentication is not configured yet. Add the Supabase URL and anon key to .env.local.");
  return { url, key };
}
function sessionStore() { return typeof window === "undefined" ? null : window.localStorage; }
export function readSession(): AuthSession | null {
  const store = sessionStore(); if (!store) return null;
  try { const value = store.getItem(SESSION_KEY); return value ? JSON.parse(value) as AuthSession : null; } catch { return null; }
}
function writeSession(session: AuthSession | null) { const store = sessionStore(); if (!store) return; if (session) store.setItem(SESSION_KEY, JSON.stringify(session)); else store.removeItem(SESSION_KEY); }
async function authRequest<T>(path: string, body?: unknown, token?: string): Promise<T> {
  const { url, key } = authConfig();
  const response = await fetch(`${url}/auth/v1/${path}`, { method: body === undefined ? "GET" : "POST", headers: { apikey: key, "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || data.error || "Supabase authentication request failed.");
  return data as T;
}
export async function register(email: string, password: string, fullName: string) {
  return authRequest<{ user: AuthUser; access_token?: string; refresh_token?: string; expires_in?: number }>("signup", { email, password, data: { full_name: fullName } });
}
export async function login(email: string, password: string) {
  const session = await authRequest<AuthSession>("token?grant_type=password", { email, password });
  if (session.expires_in) session.expires_at = Math.floor(Date.now() / 1000) + session.expires_in;
  writeSession(session); return session;
}
export async function getSession(): Promise<AuthSession | null> {
  let session = readSession(); if (!session) return null;
  if (session.expires_at && session.expires_at > Math.floor(Date.now() / 1000) + 60) return session;
  try {
    session = await authRequest<AuthSession>("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
    if (session.expires_in) session.expires_at = Math.floor(Date.now() / 1000) + session.expires_in;
    writeSession(session); return session;
  } catch { writeSession(null); return null; }
}
export async function currentUser() {
  const session = await getSession(); if (!session) return null;
  try { return await authRequest<AuthUser>("user", undefined, session.access_token); } catch { writeSession(null); return null; }
}
export async function logout() {
  const session = readSession();
  try { if (session) await authRequest("logout", {}, session.access_token); } finally { writeSession(null); }
}
export async function databaseRequest<T>(table: string, options: { method?: string; query?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
  const { url, key } = authConfig(); const session = await getSession();
  if (!session) throw new Error("Your session has expired. Please log in again.");
  const response = await fetch(`${url}/rest/v1/${table}${options.query ? `?${options.query}` : ""}`, { method: options.method || "GET", headers: { apikey: key, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json", ...(options.prefer ? { Prefer: options.prefer } : {}) }, ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }) });
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.message || error.hint || "Could not save your data. Check your Supabase setup."); }
  if (response.status === 204 || !response.headers.get("content-type")?.includes("application/json")) return undefined as T;
  return response.json() as Promise<T>;
}
export function validRegistration(name: string, email: string, password: string) {
  const errors: string[] = [];
  if (!name.trim()) errors.push("Enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.push("Enter a valid email address.");
  if (password.length < 8) errors.push("Password must be at least 8 characters.");
  return errors;
}
export function ownedRecord<T extends object>(userId: string, record: T) { return { ...record, user_id: userId }; }
