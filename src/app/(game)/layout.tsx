import { UsernameGate } from "@/components/UsernameGate";

export default function GameLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UsernameGate>{children}</UsernameGate>;
}
