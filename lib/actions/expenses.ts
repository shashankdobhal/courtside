"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { expenseSchema, type ExpenseInput } from "@/lib/validations";
import { requireTournamentOwner } from "@/lib/auth-helpers";
import { calculateExpenseSettlement } from "@/lib/algorithms/expenses";

/**
 * Logs a shared expense against the tournament's current roster. Every
 * participant's exact share is stored as given — computed client-side
 * for an equal split, typed by hand for a custom one — so settlement
 * math downstream never has to re-derive it or know which mode produced it.
 */
export async function addExpense(tournamentId: string, input: ExpenseInput) {
  const { tournament } = await requireTournamentOwner(tournamentId);
  const parsed = expenseSchema.parse(input);

  const rosterIds = new Set(
    (await prisma.player.findMany({ where: { tournamentId }, select: { id: true } })).map(
      (p) => p.id
    )
  );
  if (!rosterIds.has(parsed.paidByPlayerId)) {
    throw new Error("Whoever paid must be on this tournament's roster");
  }
  if (!parsed.participants.every((p) => rosterIds.has(p.playerId))) {
    throw new Error("Every participant must be on this tournament's roster");
  }

  await prisma.expense.create({
    data: {
      tournamentId,
      description: parsed.description,
      amount: parsed.amount,
      splitMode: parsed.splitMode,
      paidByPlayerId: parsed.paidByPlayerId,
      participants: {
        create: parsed.participants.map((p) => ({
          playerId: p.playerId,
          shareAmount: p.shareAmount,
        })),
      },
    },
  });

  revalidatePath(`/tournaments/${tournament.id}`);
}

export async function deleteExpense(expenseId: string) {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense) throw new Error("Expense not found");
  await requireTournamentOwner(expense.tournamentId);

  await prisma.expense.delete({ where: { id: expenseId } });

  revalidatePath(`/tournaments/${expense.tournamentId}`);
}

/**
 * Every expense for a tournament, plus the computed settlement — each
 * player's net balance and the payments needed to zero everyone out.
 * The roster itself for the add-expense form's pickers comes from the
 * caller's own `getTournament` call, not fetched again here.
 */
export async function getTournamentExpenses(tournamentId: string) {
  const expenses = await prisma.expense.findMany({
    where: { tournamentId },
    orderBy: { createdAt: "desc" },
    include: {
      paidBy: { select: { id: true, name: true, alias: true, withdrawn: true } },
      participants: {
        include: {
          player: { select: { id: true, name: true, alias: true, withdrawn: true } },
        },
      },
    },
  });

  const settlement = calculateExpenseSettlement(
    expenses.map((e) => ({
      amount: e.amount,
      paidByPlayerId: e.paidByPlayerId,
      participants: e.participants.map((p) => ({
        playerId: p.playerId,
        shareAmount: p.shareAmount,
      })),
    }))
  );

  return { expenses, settlement };
}
