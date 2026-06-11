import { describe, expect, it } from "vitest";
import {
  createPredictedWinnerSchema,
  submitPredictionSchema,
  validatePredictedWinner,
} from "./validation";

describe("submitPredictionSchema", () => {
  it("accepts valid input", () => {
    const result = submitPredictionSchema.parse({
      username: "player_1",
      matchId: "match-123",
      predictedWinner: "Brazil",
    });

    expect(result).toEqual({
      username: "player_1",
      matchId: "match-123",
      predictedWinner: "Brazil",
    });
  });

  it("rejects empty username", () => {
    const result = submitPredictionSchema.safeParse({
      username: "ab",
      matchId: "match-123",
      predictedWinner: "Brazil",
    });

    expect(result.success).toBe(false);
  });

  it("trims predicted winner", () => {
    const result = submitPredictionSchema.parse({
      username: "player_1",
      matchId: "match-123",
      predictedWinner: "  Brazil  ",
    });

    expect(result.predictedWinner).toBe("Brazil");
  });
});

describe("validatePredictedWinner", () => {
  it("accepts home team", () => {
    expect(validatePredictedWinner("Brazil", "Brazil", "Argentina")).toBe(
      "Brazil",
    );
  });

  it("accepts away team", () => {
    expect(validatePredictedWinner("Argentina", "Brazil", "Argentina")).toBe(
      "Argentina",
    );
  });

  it("rejects draw", () => {
    expect(() =>
      validatePredictedWinner("Draw", "Brazil", "Argentina"),
    ).toThrow(/must be either Brazil or Argentina/);
  });

  it("rejects unrelated team", () => {
    expect(() =>
      validatePredictedWinner("France", "Brazil", "Argentina"),
    ).toThrow(/must be either Brazil or Argentina/);
  });
});

describe("createPredictedWinnerSchema", () => {
  it("uses exact team names from the match", () => {
    const schema = createPredictedWinnerSchema("FC Barcelona", "Real Madrid");

    expect(schema.parse("FC Barcelona")).toBe("FC Barcelona");
    expect(() => schema.parse("Barcelona")).toThrow();
  });
});
