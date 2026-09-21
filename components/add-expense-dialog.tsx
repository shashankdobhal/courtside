"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { displayName } from "@/utils/format";
import { splitEqually } from "@/lib/algorithms/expenses";
import { addExpense } from "@/lib/actions/expenses";
import type { ExpenseInput } from "@/lib/validations";
import { Plus, Loader2, IndianRupee } from "lucide-react";

export interface ExpenseRosterPlayer {
  id: string;
  name: string;
  alias: string | null;
  withdrawn: boolean;
  /** Only present on the roster passed for settle-up "Pay" links — past expenses' own paidBy/participant rows don't carry it. */
  upiId?: string | null;
}

export function AddExpenseDialog({
  tournamentId,
  roster,
}: {
  tournamentId: string;
  roster: ExpenseRosterPlayer[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [paidByPlayerId, setPaidByPlayerId] = useState<string | undefined>(undefined);
  const [splitMode, setSplitMode] = useState<"EQUAL" | "CUSTOM">("EQUAL");
  const [included, setIncluded] = useState<Set<string>>(new Set(roster.map((p) => p.id)));
  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  const amount = Math.max(0, Math.floor(Number(amountInput) || 0));
  const includedRoster = roster.filter((p) => included.has(p.id));
  const equalShares = splitEqually(amount, includedRoster.length);

  const shareFor = (playerId: string, index: number) =>
    splitMode === "EQUAL" ? (equalShares[index] ?? 0) : Number(customShares[playerId] || 0);

  const allocated = includedRoster.reduce((sum, p, i) => sum + shareFor(p.id, i), 0);
  const canSubmit =
    description.trim().length > 0 &&
    amount > 0 &&
    !!paidByPlayerId &&
    includedRoster.length > 0 &&
    allocated === amount;

  const reset = () => {
    setDescription("");
    setAmountInput("");
    setPaidByPlayerId(undefined);
    setSplitMode("EQUAL");
    setIncluded(new Set(roster.map((p) => p.id)));
    setCustomShares({});
    setServerError(null);
  };

  const toggleIncluded = (playerId: string) => {
    setIncluded((current) => {
      const next = new Set(current);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  };

  const switchToCustom = () => {
    // Start from the current equal split so adjusting a couple of amounts
    // is easier than typing every share from scratch.
    const prefill: Record<string, string> = {};
    includedRoster.forEach((p, i) => {
      prefill[p.id] = String(equalShares[i] ?? 0);
    });
    setCustomShares(prefill);
    setSplitMode("CUSTOM");
  };

  const handleSubmit = () => {
    if (!paidByPlayerId) return;
    setServerError(null);
    const participants: ExpenseInput["participants"] = includedRoster.map((p, i) => ({
      playerId: p.id,
      shareAmount: shareFor(p.id, i),
    }));

    startTransition(async () => {
      try {
        await addExpense(tournamentId, {
          description: description.trim(),
          amount,
          paidByPlayerId,
          splitMode,
          participants,
        });
        toast.success("Expense added");
        setOpen(false);
        reset();
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setServerError(message);
        toast.error(message);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-11">
          <Plus className="size-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add an expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-description">Description</Label>
            <Input
              id="expense-description"
              placeholder="Court booking"
              className="h-11 text-base"
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount</Label>
            <div className="relative">
              <IndianRupee className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="expense-amount"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="600"
                className="h-11 pl-9 text-base"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Paid by</Label>
            <Select value={paidByPlayerId} onValueChange={setPaidByPlayerId}>
              <SelectTrigger className="h-11 w-full text-base">
                <SelectValue placeholder="Who fronted the money?" />
              </SelectTrigger>
              <SelectContent>
                {roster.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {displayName(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Split</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSplitMode("EQUAL")}
                className={cn(
                  "h-10 rounded-lg border text-sm font-medium transition-colors",
                  splitMode === "EQUAL"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-accent"
                )}
              >
                Split Equally
              </button>
              <button
                type="button"
                onClick={switchToCustom}
                className={cn(
                  "h-10 rounded-lg border text-sm font-medium transition-colors",
                  splitMode === "CUSTOM"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-accent"
                )}
              >
                Custom Amounts
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Split among</Label>
            <div className="space-y-2">
              {roster.map((p) => {
                const isIncluded = included.has(p.id);
                const index = includedRoster.findIndex((r) => r.id === p.id);
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3",
                      !isIncluded && "opacity-50"
                    )}
                  >
                    <Switch checked={isIncluded} onCheckedChange={() => toggleIncluded(p.id)} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {displayName(p)}
                    </span>
                    {splitMode === "CUSTOM" ? (
                      <div className="relative w-24 shrink-0">
                        <IndianRupee className="absolute top-1/2 left-2 size-3 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          disabled={!isIncluded}
                          className="h-9 pl-6 text-sm"
                          value={isIncluded ? (customShares[p.id] ?? "") : ""}
                          onChange={(e) =>
                            setCustomShares((current) => ({ ...current, [p.id]: e.target.value }))
                          }
                        />
                      </div>
                    ) : (
                      <span className="w-16 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                        {isIncluded ? `₹${equalShares[index] ?? 0}` : "—"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p
              className={cn(
                "text-xs",
                allocated === amount ? "text-muted-foreground" : "text-destructive"
              )}
            >
              ₹{allocated} of ₹{amount} allocated
            </p>
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending} className="h-11 w-full">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Add Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
