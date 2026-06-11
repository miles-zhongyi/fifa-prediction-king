/** Regional indicator emoji flags for FIFA World Cup 2026 nations. */
const TEAM_FLAG_EMOJI: Record<string, string> = {
  Mexico: "🇲🇽",
  "South Africa": "🇿🇦",
  "South Korea": "🇰🇷",
  "Korea Republic": "🇰🇷",
  Czechia: "🇨🇿",
  Canada: "🇨🇦",
  "Bosnia and Herzegovina": "🇧🇦",
  Bosnia: "🇧🇦",
  Qatar: "🇶🇦",
  Switzerland: "🇨🇭",
  Brazil: "🇧🇷",
  Morocco: "🇲🇦",
  Haiti: "🇭🇹",
  Scotland: "🏴",
  USA: "🇺🇸",
  "United States": "🇺🇸",
  Paraguay: "🇵🇾",
  Australia: "🇦🇺",
  Türkiye: "🇹🇷",
  Turkey: "🇹🇷",
  Germany: "🇩🇪",
  "Curaçao": "🇨🇼",
  Curacao: "🇨🇼",
  "Côte d'Ivoire": "🇨🇮",
  "Ivory Coast": "🇨🇮",
  Ecuador: "🇪🇨",
  Netherlands: "🇳🇱",
  Japan: "🇯🇵",
  Sweden: "🇸🇪",
  Tunisia: "🇹🇳",
  Belgium: "🇧🇪",
  Egypt: "🇪🇬",
  Iran: "🇮🇷",
  "New Zealand": "🇳🇿",
  Spain: "🇪🇸",
  "Cabo Verde": "🇨🇻",
  "Cape Verde": "🇨🇻",
  "Saudi Arabia": "🇸🇦",
  Uruguay: "🇺🇾",
  France: "🇫🇷",
  Senegal: "🇸🇳",
  Iraq: "🇮🇶",
  Norway: "🇳🇴",
  Argentina: "🇦🇷",
  Algeria: "🇩🇿",
  Austria: "🇦🇹",
  Jordan: "🇯🇴",
  Portugal: "🇵🇹",
  "DR Congo": "🇨🇩",
  "Congo DR": "🇨🇩",
  Uzbekistan: "🇺🇿",
  Colombia: "🇨🇴",
  England: "🏴",
  Croatia: "🇭🇷",
  Ghana: "🇬🇭",
  Panama: "🇵🇦",
  Denmark: "🇩🇰",
};

const TEAM_ALIASES: Record<string, string> = {
  "united states": "USA",
  "korea republic": "South Korea",
  bosnia: "Bosnia and Herzegovina",
  turkey: "Türkiye",
  curacao: "Curaçao",
  "ivory coast": "Côte d'Ivoire",
  "cape verde": "Cabo Verde",
  "congo dr": "DR Congo",
};

export function normalizeTeamName(teamName: string): string {
  const trimmed = teamName.trim();
  const alias = TEAM_ALIASES[trimmed.toLowerCase()];
  return alias ?? trimmed;
}

export function getTeamFlagEmoji(teamName: string): string {
  const normalized = normalizeTeamName(teamName);
  return TEAM_FLAG_EMOJI[normalized] ?? "🏳️";
}
