/**
 * Splits `amount` into `participantCount` whole-rupee shares that sum
 * exactly to `amount` — the remainder distributes one rupee at a time to
 * the first few participants, so no fraction is ever silently dropped.
 */
export function splitEqually(amount: number, participantCount: number): number[] {
  if (participantCount <= 0) return [];
  const base = Math.floor(amount / participantCount);
  const remainder = amount % participantCount;
  return Array.from({ length: participantCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

export interface ExpenseForSettlement {
  amount: number;
  paidByPlayerId: string;
  participants: { playerId: string; shareAmount: number }[];
}

export interface PlayerBalance {
  playerId: string;
  paid: number;
  owed: number;
  /** paid - owed; positive means they're owed money, negative means they owe. */
  balance: number;
}

export interface SettlementTransaction {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
}

export interface ExpenseSettlement {
  balances: PlayerBalance[];
  transactions: SettlementTransaction[];
}

/**
 * Nets every expense down to a per-player balance, then works out who
 * should pay whom to settle everyone to zero — a greedy pass that
 * repeatedly matches the largest creditor against the largest debtor.
 * Not guaranteed to be the theoretically fewest possible transactions
 * (that's a much harder problem), but it's a small, sensible set in
 * practice, the same approach split-the-bill apps commonly use.
 */
export function calculateExpenseSettlement(expenses: ExpenseForSettlement[]): ExpenseSettlement {
  const paid = new Map<string, number>();
  const owed = new Map<string, number>();

  for (const expense of expenses) {
    paid.set(expense.paidByPlayerId, (paid.get(expense.paidByPlayerId) ?? 0) + expense.amount);
    for (const p of expense.participants) {
      owed.set(p.playerId, (owed.get(p.playerId) ?? 0) + p.shareAmount);
    }
  }

  const playerIds = new Set([...paid.keys(), ...owed.keys()]);
  const balances: PlayerBalance[] = Array.from(playerIds).map((playerId) => {
    const p = paid.get(playerId) ?? 0;
    const o = owed.get(playerId) ?? 0;
    return { playerId, paid: p, owed: o, balance: p - o };
  });

  const creditors = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ playerId: b.playerId, remaining: b.balance }))
    .sort((a, b) => b.remaining - a.remaining);
  const debtors = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ playerId: b.playerId, remaining: -b.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const transactions: SettlementTransaction[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.remaining, debtor.remaining);
    if (amount > 0) {
      transactions.push({ fromPlayerId: debtor.playerId, toPlayerId: creditor.playerId, amount });
      creditor.remaining -= amount;
      debtor.remaining -= amount;
    }
    if (creditor.remaining === 0) ci++;
    if (debtor.remaining === 0) di++;
  }

  return { balances, transactions };
}
