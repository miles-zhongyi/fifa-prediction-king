export const DODONA_EMAIL_DOMAIN = "@dodonadata.ai";

const LOCAL_PART_REGEX = /^[a-zA-Z0-9._-]+$/;

export function normalizeEmailLocalPart(value: string): string {
  return value.trim().toLowerCase();
}

export function toDodonaEmail(localPart: string): string {
  const normalized = normalizeEmailLocalPart(localPart);
  if (!normalized) {
    throw new Error("Email username is required");
  }

  if (!LOCAL_PART_REGEX.test(normalized)) {
    throw new Error(
      "Email username may only contain letters, numbers, dots, underscores, and hyphens",
    );
  }

  return `${normalized}${DODONA_EMAIL_DOMAIN}`;
}

export function splitDodonaEmail(email: string): {
  localPart: string;
  domain: string;
} {
  const normalized = email.trim().toLowerCase();
  if (normalized.endsWith(DODONA_EMAIL_DOMAIN)) {
    return {
      localPart: normalized.slice(0, -DODONA_EMAIL_DOMAIN.length),
      domain: DODONA_EMAIL_DOMAIN,
    };
  }

  const atIndex = normalized.indexOf("@");
  if (atIndex === -1) {
    return { localPart: normalized, domain: DODONA_EMAIL_DOMAIN };
  }

  return {
    localPart: normalized.slice(0, atIndex),
    domain: normalized.slice(atIndex),
  };
}
