"use client";

import { createContext, useContext } from "react";

type UserContextValue = {
  username: string;
  email: string;
  avatarUrl: string | null;
  onSignOut: () => void;
  updateAvatarUrl: (avatarUrl: string) => void;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
  username,
  email,
  avatarUrl,
  onSignOut,
  updateAvatarUrl,
  children,
}: UserContextValue & { children: React.ReactNode }) {
  return (
    <UserContext.Provider
      value={{ username, email, avatarUrl, onSignOut, updateAvatarUrl }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
