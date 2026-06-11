import { MatchDetail } from "@/components/matches/MatchDetail";

type MatchPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;
  return <MatchDetail matchId={id} />;
}
