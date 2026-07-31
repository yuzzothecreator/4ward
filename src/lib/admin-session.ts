const TOKEN_KEY = "4ward_admin_token";
const EXP_KEY = "4ward_admin_token_exp";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = sessionStorage.getItem(TOKEN_KEY);
  const exp = Number(sessionStorage.getItem(EXP_KEY) || 0);
  if (!token) return null;
  if (exp && Date.now() > exp) {
    clearAdminToken();
    return null;
  }
  return token;
}

export function setAdminToken(token: string, expiresAt?: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOKEN_KEY, token);
  if (expiresAt) {
    sessionStorage.setItem(EXP_KEY, String(new Date(expiresAt).getTime()));
  }
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EXP_KEY);
}

export function adminHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAdminToken();
  return {
    ...(extra || {}),
    ...(token
      ? {
          "x-admin-token": token,
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

/** Request a signed admin session after signing in as ADMIN. */
export async function ensureAdminSession(user: {
  email: string;
  name?: string;
  username?: string;
  university?: string;
  password?: string;
}) {
  const existing = getAdminToken();
  if (existing) return existing;

  const res = await fetch("/api/admin/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      name: user.name,
      username: user.username,
      university: user.university,
      password: user.password,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(data.error || "Could not start admin session");
  }
  setAdminToken(data.token, data.expiresAt);
  return data.token as string;
}
