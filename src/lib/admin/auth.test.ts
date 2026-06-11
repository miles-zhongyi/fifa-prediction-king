import { afterEach, describe, expect, it } from "vitest";
import {
  AdminAuthError,
  isAdminPasswordConfigured,
  requireAdmin,
  verifyAdminPassword,
  verifyAdminRequest,
} from "./auth";

const originalPassword = process.env.ADMIN_PASSWORD;

afterEach(() => {
  if (originalPassword === undefined) {
    delete process.env.ADMIN_PASSWORD;
  } else {
    process.env.ADMIN_PASSWORD = originalPassword;
  }
});

describe("verifyAdminPassword", () => {
  it("accepts the configured password", () => {
    process.env.ADMIN_PASSWORD = "secret-admin";

    expect(verifyAdminPassword("secret-admin")).toBe(true);
  });

  it("rejects incorrect passwords", () => {
    process.env.ADMIN_PASSWORD = "secret-admin";

    expect(verifyAdminPassword("wrong-password")).toBe(false);
    expect(verifyAdminPassword(null)).toBe(false);
  });
});

describe("verifyAdminRequest", () => {
  it("reads the password from the x-admin-password header", () => {
    process.env.ADMIN_PASSWORD = "secret-admin";

    const request = new Request("http://localhost/api/admin/matches", {
      headers: { "x-admin-password": "secret-admin" },
    });

    expect(verifyAdminRequest(request)).toBe(true);
  });
});

describe("requireAdmin", () => {
  it("throws when admin password is not configured", () => {
    delete process.env.ADMIN_PASSWORD;

    const request = new Request("http://localhost/api/admin/matches", {
      headers: { "x-admin-password": "secret-admin" },
    });

    expect(() => requireAdmin(request)).toThrow(AdminAuthError);
    expect(isAdminPasswordConfigured()).toBe(false);
  });

  it("throws when the request password is invalid", () => {
    process.env.ADMIN_PASSWORD = "secret-admin";

    const request = new Request("http://localhost/api/admin/matches", {
      headers: { "x-admin-password": "wrong" },
    });

    expect(() => requireAdmin(request)).toThrow(/Invalid admin password/);
  });
});
