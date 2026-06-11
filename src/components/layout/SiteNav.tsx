"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { UserAvatar } from "@/components/users/UserAvatar";
import { useUser } from "@/contexts/UserContext";

const links = [
  { href: "/", label: "Groups" },
  { href: "/third-place", label: "3rd Place" },
  { href: "/knockout", label: "Knockout" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { username, email, avatarUrl, onSignOut, updateAvatarUrl } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleAvatarUpload(file: File) {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("file", file);

      const response = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to upload photo");
      }

      const user = (await response.json()) as { avatarUrl: string | null };
      if (user.avatarUrl) {
        updateAvatarUrl(user.avatarUrl);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <Image
              src="/dodonaLogo.png"
              alt="DodonaData.ai"
              width={120}
              height={32}
              className="h-7 w-auto object-contain sm:h-8"
              priority
            />
          </Link>

          <div className="hidden min-w-0 border-l border-[var(--border)] pl-4 sm:block">
            <p className="truncate text-sm font-semibold">FIFA World Cup 2026</p>
            <p className="truncate text-xs text-[var(--muted)]">
              Prediction King
            </p>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/admin"
            className="hidden rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)] hover:bg-white/5 hover:text-white sm:inline-block"
          >
            Admin
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="group relative rounded-full ring-2 ring-transparent transition hover:ring-[var(--accent)]"
              title="Upload profile photo"
            >
              <UserAvatar
                username={username}
                avatarUrl={avatarUrl}
                size={36}
              />
              <span className="absolute -bottom-1 -right-1 rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-black opacity-0 transition group-hover:opacity-100">
                +
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleAvatarUpload(file);
                }
                event.target.value = "";
              }}
            />

            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{username}</p>
              <p className="max-w-[180px] truncate text-xs text-[var(--muted)]">
                {email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs sm:text-sm hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-4 py-2 sm:hidden">
        <p className="text-sm font-semibold">FIFA World Cup 2026</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-[var(--border)] px-4 py-2 md:hidden">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                active ? "bg-white/10 text-white" : "text-[var(--muted)]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
