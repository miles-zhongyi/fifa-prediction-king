"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { GameProviders } from "@/components/GameProviders";
import { GameLayout } from "@/components/layout/GameLayout";
import { UserProvider } from "@/contexts/UserContext";
import {
  clearStoredUserSession,
  getStoredUserSession,
  setStoredUserSession,
} from "@/lib/username";

type UsernameGateProps = {
  children: React.ReactNode;
};

type UserSession = {
  username: string;
  email: string;
  avatarUrl: string | null;
};

export function UsernameGate({ children }: UsernameGateProps) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = getStoredUserSession();
    if (stored?.username) {
      setSession({
        username: stored.username,
        email: stored.email,
        avatarUrl: stored.avatarUrl ?? null,
      });
      setUsernameInput(stored.username);
      setEmailInput(stored.email);
    }
    setHydrated(true);
  }, []);

  function handleSignOut() {
    clearStoredUserSession();
    setSession(null);
    setUsernameInput("");
    setEmailInput("");
  }

  function updateAvatarUrl(avatarUrl: string) {
    setSession((current) => {
      if (!current) {
        return current;
      }

      const next = { ...current, avatarUrl };
      setStoredUserSession(next);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          email: emailInput,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to register");
      }

      const user = (await response.json()) as {
        username: string;
        email: string;
        avatarUrl: string | null;
      };

      const nextSession: UserSession = {
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      };

      setStoredUserSession(nextSession);
      setSession(nextSession);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card w-full max-w-md p-8 shadow-2xl">
          <div className="mb-6 flex justify-center">
            <Image
              src="/dodonaLogo.png"
              alt="DodonaData.ai"
              width={200}
              height={52}
              className="h-12 w-auto object-contain"
              priority
            />
          </div>

          <h1 className="text-2xl font-bold">FIFA Prediction King</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Enter your username and email to start making predictions.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                value={usernameInput}
                onChange={(event) => setUsernameInput(event.target.value)}
                placeholder="e.g. football_fan"
                className="input"
                minLength={3}
                maxLength={20}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                placeholder="you@example.com"
                className="input"
                required
                autoComplete="email"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <UserProvider
      username={session.username}
      email={session.email}
      avatarUrl={session.avatarUrl}
      onSignOut={handleSignOut}
      updateAvatarUrl={updateAvatarUrl}
    >
      <GameProviders>
        <GameLayout>{children}</GameLayout>
      </GameProviders>
    </UserProvider>
  );
}
