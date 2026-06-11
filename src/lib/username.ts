export type StoredUserSession = {
  username: string;
  email: string;
  avatarUrl?: string | null;
};

const USER_SESSION_KEY = "fifa-user-session";
const LEGACY_USERNAME_KEY = "fifa-prediction-username";

export function getStoredUserSession(): StoredUserSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(USER_SESSION_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as StoredUserSession;
    } catch {
      localStorage.removeItem(USER_SESSION_KEY);
    }
  }

  const legacyUsername = localStorage.getItem(LEGACY_USERNAME_KEY);
  if (legacyUsername) {
    return { username: legacyUsername, email: "" };
  }

  return null;
}

export function setStoredUserSession(session: StoredUserSession) {
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  localStorage.removeItem(LEGACY_USERNAME_KEY);
}

export function clearStoredUserSession() {
  localStorage.removeItem(USER_SESSION_KEY);
  localStorage.removeItem(LEGACY_USERNAME_KEY);
}

/** @deprecated Use getStoredUserSession */
export function getStoredUsername(): string | null {
  return getStoredUserSession()?.username ?? null;
}

/** @deprecated Use setStoredUserSession */
export function setStoredUsername(username: string) {
  const existing = getStoredUserSession();
  setStoredUserSession({
    username,
    email: existing?.email ?? "",
    avatarUrl: existing?.avatarUrl,
  });
}

/** @deprecated Use clearStoredUserSession */
export function clearStoredUsername() {
  clearStoredUserSession();
}
