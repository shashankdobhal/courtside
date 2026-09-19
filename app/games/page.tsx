import { redirect } from "next/navigation";
import { getMyTournaments } from "@/lib/actions/tournaments";
import { GameHistoryList } from "@/components/game-history-list";
import { auth } from "@/auth";

export default async function AllGamesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const tournaments = await getMyTournaments(session.user.id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-10">
      <h1 className="font-heading text-2xl font-bold tracking-tight">All Games</h1>
      <div className="mt-6">
        <GameHistoryList games={tournaments} />
      </div>
    </main>
  );
}
