import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { resolveOrCreateUserPlayerProfile } from "@/lib/actions/player-profiles";

export default async function MyProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");

  const profile = await resolveOrCreateUserPlayerProfile(
    session.user.id,
    session.user.name ?? "Player"
  );
  redirect(`/players/${profile.id}`);
}
