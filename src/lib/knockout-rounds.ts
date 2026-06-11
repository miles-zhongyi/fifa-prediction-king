import { MAX_GROUP_ADVANCERS, MAX_THIRD_PLACE_PICKS, GROUP_KEYS } from "@/lib/groups";

export const ADVANCING_POOL_SIZE =
  GROUP_KEYS.length * MAX_GROUP_ADVANCERS + MAX_THIRD_PLACE_PICKS;

export const KNOCKOUT_ROUND_KEYS = [
  "TOP16",
  "TOP8",
  "TOP4",
  "TOP2",
  "WINNER",
] as const;

export type KnockoutRoundKey = (typeof KNOCKOUT_ROUND_KEYS)[number];

export type KnockoutRoundDefinition = {
  key: KnockoutRoundKey;
  label: string;
  description: string;
  maxPicks: number;
  parentRound: KnockoutRoundKey | null;
};

export const KNOCKOUT_ROUNDS: KnockoutRoundDefinition[] = [
  {
    key: "TOP16",
    label: "Round of 16",
    description: "Pick 16 teams from your 32",
    maxPicks: 16,
    parentRound: null,
  },
  {
    key: "TOP8",
    label: "Quarterfinals",
    description: "Pick 8 teams from your 16",
    maxPicks: 8,
    parentRound: "TOP16",
  },
  {
    key: "TOP4",
    label: "Semifinals",
    description: "Pick 4 teams from your 8",
    maxPicks: 4,
    parentRound: "TOP8",
  },
  {
    key: "TOP2",
    label: "Finalists",
    description: "Pick 2 teams from your 4",
    maxPicks: 2,
    parentRound: "TOP4",
  },
  {
    key: "WINNER",
    label: "Champion",
    description: "Pick 1 team from your 2",
    maxPicks: 1,
    parentRound: "TOP2",
  },
];

const roundByKey = new Map(
  KNOCKOUT_ROUNDS.map((round) => [round.key, round]),
);

export function getKnockoutRound(key: string): KnockoutRoundDefinition | null {
  return roundByKey.get(key as KnockoutRoundKey) ?? null;
}

export function isKnockoutRoundKey(key: string): key is KnockoutRoundKey {
  return roundByKey.has(key as KnockoutRoundKey);
}

export function getDownstreamRounds(round: KnockoutRoundKey): KnockoutRoundKey[] {
  const index = KNOCKOUT_ROUND_KEYS.indexOf(round);
  if (index === -1) {
    return [];
  }

  return KNOCKOUT_ROUND_KEYS.slice(index + 1);
}
