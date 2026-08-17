import { CreateTournamentForm } from "@/components/create-tournament-form";

export default function NewTournamentPage() {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10 sm:py-14">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Create Tournament</h1>
      <CreateTournamentForm />
    </main>
  );
}
