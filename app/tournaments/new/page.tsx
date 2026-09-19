import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreateTournamentForm } from "@/components/create-tournament-form";

export default async function NewTournamentPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-14">
      <h1 className="font-heading mb-8 text-2xl font-bold tracking-tight">Create Tournament</h1>
      <CreateTournamentForm />
    </main>
  );
}
