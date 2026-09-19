import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    // The very first person to ever sign in claims every tournament created
    // before accounts existed — there's exactly one real organizer running
    // this app today, so this is equivalent to a manual backfill with no
    // extra ops step.
    async createUser({ user }) {
      const userCount = await prisma.user.count();
      if (userCount === 1 && user.id) {
        await prisma.tournament.updateMany({
          where: { ownerId: null },
          data: { ownerId: user.id },
        });
      }
    },
  },
});
