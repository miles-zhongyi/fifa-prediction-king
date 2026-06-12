import { describe, expect, it } from "vitest";
import { mapApiTeamName } from "./team-map";

describe("mapApiTeamName", () => {
  it("maps common football-data.org names to fixture names", () => {
    expect(mapApiTeamName("Korea Republic")).toBe("South Korea");
    expect(mapApiTeamName("Czech Republic")).toBe("Czechia");
    expect(mapApiTeamName("United States")).toBe("USA");
  });
});
