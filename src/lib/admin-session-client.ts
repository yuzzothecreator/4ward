"use client";

import { useState } from "react";
import {
  clearAdminToken,
  ensureAdminSession,
  getAdminToken,
  setAdminToken,
} from "@/lib/admin-session";

type AdminUser = {
  email: string;
  name?: string;
  username?: string;
  university?: string;
};

/**
 * Ensures an admin API session. If the server asks for a password,
 * prompts once and retries (bootstrap ADMIN_PASSWORD_HASH flow).
 */
export async function ensureAdminSessionWithPrompt(user: AdminUser) {
  try {
    return await ensureAdminSession(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const needsPassword =
      message.toLowerCase().includes("password") ||
      message.includes("PASSWORD_REQUIRED") ||
      message.toLowerCase().includes("invalid admin");

    if (!needsPassword) throw err;

    const password =
      typeof window !== "undefined"
        ? window.prompt(
            `Enter admin password for ${user.email}\n(from npm run admin:bootstrap)`
          )
        : null;
    if (!password) throw new Error("Admin password required");

    clearAdminToken();
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        username: user.username,
        university: user.university,
        password,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      throw new Error(data.error || data.hint || "Could not start admin session");
    }
    setAdminToken(data.token, data.expiresAt);
    return data.token as string;
  }
}

export function useAdminSessionGate() {
  const [busy, setBusy] = useState(false);
  return {
    busy,
    async connect(user: AdminUser) {
      setBusy(true);
      try {
        if (getAdminToken()) return getAdminToken();
        return await ensureAdminSessionWithPrompt(user);
      } finally {
        setBusy(false);
      }
    },
  };
}
