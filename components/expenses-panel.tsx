"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/empty-state";
import { AddExpenseDialog, type ExpenseRosterPlayer } from "@/components/add-expense-dialog";
import { ShareExpenseImageButton } from "@/components/share-expense-image-button";
import { displayName } from "@/utils/format";
import { deleteExpense } from "@/lib/actions/expenses";
import type { ExpenseSettlement } from "@/lib/algorithms/expenses";
import { buildUpiPayLink } from "@/lib/upi";
import { Receipt, Trash2, Loader2, ArrowRight, Wallet, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExpensesPanelExpense {
  id: string;
  description: string;
  amount: number;
  splitMode: string;
  paidBy: ExpenseRosterPlayer;
  participants: { player: ExpenseRosterPlayer }[];
}

export function ExpensesPanel({
  tournamentId,
  tournamentName,
  roster,
  expenses,
  settlement,
  isOwner,
}: {
  tournamentId: string;
  tournamentName: string;
  roster: ExpenseRosterPlayer[];
  expenses: ExpensesPanelExpense[];
  settlement: ExpenseSettlement;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const nameById = new Map(roster.map((p) => [p.id, displayName(p)]));
  const nameFor = (playerId: string) => nameById.get(playerId) ?? "Unknown";
  const upiIdById = new Map(roster.map((p) => [p.id, p.upiId ?? null]));

  const handleCopyUpiId = async (upiId: string) => {
    try {
      await navigator.clipboard.writeText(upiId);
      toast.success("UPI ID copied");
    } catch {
      toast.error("Couldn't copy the UPI ID");
    }
  };
  // A withdrawn player can still show up in past expenses (their name
  // resolves fine via nameById above); they're just not offered again for
  // a *new* one, same as the Players tab hides them from new fixtures.
  const activeRoster = roster.filter((p) => !p.withdrawn);

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    startTransition(async () => {
      try {
        await deleteExpense(confirmDeleteId);
        toast.success("Expense deleted");
        setConfirmDeleteId(null);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        toast.error(message);
      }
    });
  };

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No expenses yet"
        description="Log what got spent — court booking, shuttles, food — and CourtSide will work out who owes what."
        action={
          isOwner && <AddExpenseDialog tournamentId={tournamentId} roster={activeRoster} />
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {isOwner ? (
          <AddExpenseDialog tournamentId={tournamentId} roster={activeRoster} />
        ) : (
          <span />
        )}
        <ShareExpenseImageButton
          tournamentName={tournamentName}
          balances={settlement.balances.map((b) => ({ ...b, name: nameFor(b.playerId) }))}
          transactions={settlement.transactions.map((t) => ({
            ...t,
            fromName: nameFor(t.fromPlayerId),
            toName: nameFor(t.toPlayerId),
          }))}
        />
      </div>

      {settlement.balances.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Balances</h3>
          <Card className="divide-y p-0">
            {settlement.balances.map((b) => (
              <div key={b.playerId} className="flex items-center justify-between px-4 py-3">
                <span className="truncate font-medium">{nameFor(b.playerId)}</span>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    b.balance > 0 && "text-emerald-600 dark:text-emerald-400",
                    b.balance < 0 && "text-destructive"
                  )}
                >
                  {b.balance === 0
                    ? "Settled"
                    : b.balance > 0
                      ? `+₹${b.balance} owed`
                      : `-₹${Math.abs(b.balance)}`}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Settle Up</h3>
        {settlement.transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Everyone&apos;s settled up! 🎉</p>
        ) : (
          <Card className="divide-y p-0">
            {settlement.transactions.map((t, i) => {
              const toUpiId = upiIdById.get(t.toPlayerId);
              const payLink = toUpiId
                ? buildUpiPayLink({
                    vpa: toUpiId,
                    payeeName: nameFor(t.toPlayerId),
                    amount: t.amount,
                    note: `${tournamentName} settle up`,
                  })
                : null;
              return (
                <div key={i} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium">{nameFor(t.fromPlayerId)}</span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate font-medium">{nameFor(t.toPlayerId)}</span>
                  <span className="shrink-0 font-semibold tabular-nums">₹{t.amount}</span>
                  {toUpiId && payLink && (
                    <>
                      <Button asChild size="sm" variant="secondary" className="h-7 shrink-0 px-2 text-xs">
                        <a href={payLink}>
                          <Wallet className="size-3" />
                          Pay
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-muted-foreground"
                        aria-label={`Copy ${nameFor(t.toPlayerId)}'s UPI ID`}
                        onClick={() => handleCopyUpiId(toUpiId)}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </Card>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Expenses ({expenses.length})
        </h3>
        <div className="space-y-2">
          {expenses.map((e) => (
            <Card key={e.id} className="flex-row items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{e.description}</p>
                  <Badge variant="outline" className="shrink-0 text-muted-foreground">
                    {e.splitMode === "CUSTOM" ? "Custom" : "Equal"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Paid by {displayName(e.paidBy)} · split {e.participants.length}{" "}
                  {e.participants.length === 1 ? "way" : "ways"}
                </p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums">₹{e.amount}</span>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${e.description}`}
                  onClick={() => setConfirmDeleteId(e.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && !isPending && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from every balance and the settle-up list. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
