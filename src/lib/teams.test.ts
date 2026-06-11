import { describe, expect, it } from "vitest";
import { getTeamFlagEmoji, normalizeTeamName } from "./teams";

describe("teams", () => {
  it("returns emoji flags for FIFA 2026 nations", () => {
    expect(getTeamFlagEmoji("Mexico")).toBe("🇲🇽");
    expect(getTeamFlagEmoji("South Korea")).toBe("🇰🇷");
    expect(getTeamFlagEmoji("Paraguay")).toBe("🇵🇾");
    expect(getTeamFlagEmoji("Canada")).toBe("🇨🇦");
    expect(getTeamFlagEmoji("Germany")).toBe("🇩🇪");
  });

  it("normalizes common aliases", () => {
    expect(normalizeTeamName("United States")).toBe("USA");
    expect(normalizeTeamName("Ivory Coast")).toBe("Côte d'Ivoire");
    expect(getTeamFlagEmoji("United States")).toBe("🇺🇸");
  });

  it("falls back when team is unknown", () => {
    expect(getTeamFlagEmoji("Unknown FC")).toBe("🏳️");
  });
});
