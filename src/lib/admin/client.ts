const ADMIN_PASSWORD_KEY = "fifa-admin-password";

export function getStoredAdminPassword(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem(ADMIN_PASSWORD_KEY);
}

export function setStoredAdminPassword(password: string) {
  sessionStorage.setItem(ADMIN_PASSWORD_KEY, password);
}

export function clearStoredAdminPassword() {
  sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
}

export async function adminFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const password = getStoredAdminPassword();
  const headers = new Headers(init.headers);

  if (password) {
    headers.set("x-admin-password", password);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
