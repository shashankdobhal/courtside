import { describe, expect, it } from "vitest";
import { splitEqually, calculateExpenseSettlement } from "./expenses";

describe("splitEqually", () => {
  it("divides evenly with no remainder", () => {
    expect(splitEqually(100, 4)).toEqual([25, 25, 25, 25]);
  });

  it("distributes the remainder to the first participants, one rupee each", () => {
    expect(splitEqually(100, 3)).toEqual([34, 33, 33]);
  });

  it("gives the full amount to a single participant", () => {
    expect(splitEqually(50, 1)).toEqual([50]);
  });

  it("always sums back to the original amount", () => {
    const shares = splitEqually(101, 7);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(101);
  });
});

describe("calculateExpenseSettlement", () => {
  it("settles a single expense split between two players with one transaction", () => {
    const { balances, transactions } = calculateExpenseSettlement([
      {
        amount: 100,
        paidByPlayerId: "a",
        participants: [
          { playerId: "a", shareAmount: 50 },
          { playerId: "b", shareAmount: 50 },
        ],
      },
    ]);

    expect(balances).toEqual(
      expect.arrayContaining([
        { playerId: "a", paid: 100, owed: 50, balance: 50 },
        { playerId: "b", paid: 0, owed: 50, balance: -50 },
      ])
    );
    expect(transactions).toEqual([{ fromPlayerId: "b", toPlayerId: "a", amount: 50 }]);
  });

  it("nets multiple expenses to zero when they cancel out", () => {
    const { balances, transactions } = calculateExpenseSettlement([
      {
        amount: 100,
        paidByPlayerId: "a",
        participants: [
          { playerId: "a", shareAmount: 50 },
          { playerId: "b", shareAmount: 50 },
        ],
      },
      {
        amount: 100,
        paidByPlayerId: "b",
        participants: [
          { playerId: "a", shareAmount: 50 },
          { playerId: "b", shareAmount: 50 },
        ],
      },
    ]);

    const a = balances.find((b) => b.playerId === "a")!;
    const b = balances.find((b) => b.playerId === "b")!;
    expect(a.balance).toBe(0);
    expect(b.balance).toBe(0);
    expect(transactions).toEqual([]);
  });

  it("settles a three-person custom split with the fewest payments", () => {
    const { transactions } = calculateExpenseSettlement([
      {
        amount: 90,
        paidByPlayerId: "a",
        participants: [
          { playerId: "a", shareAmount: 10 },
          { playerId: "b", shareAmount: 30 },
          { playerId: "c", shareAmount: 50 },
        ],
      },
    ]);

    // a is owed 80 (paid 90, owes 10); b owes 30; c owes 50 — settles in
    // exactly two payments (c can't fully cover a alone).
    expect(transactions).toHaveLength(2);
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    expect(total).toBe(80);
    expect(transactions.every((t) => t.toPlayerId === "a")).toBe(true);
  });

  it("returns no balances or transactions for no expenses", () => {
    expect(calculateExpenseSettlement([])).toEqual({ balances: [], transactions: [] });
  });
});
