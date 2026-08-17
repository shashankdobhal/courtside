import { describe, expect, it } from "vitest";
import { calculateStandings, calculateChampion, calculatePointDifference } from "./standings";
import { MatchStatus, Round, TournamentType } from "@/types";

const players = [
  { id: "p1", tournamentId: "t1", name: "Rahul" },
  { id: "p2", tournamentId: "t1", name: "Amit" },
  { id: "p3", tournamentId: "t1", name: "Priya" },
];

function match(overrides: Partial<Parameters<typeof calculateStandings>[1][number]>) {
  return {
    player1Id: "p1",
    player2Id: "p2",
    score1: null,
    score2: null,
    winnerId: null,
    round: Round.LEAGUE,
    status: MatchStatus.PENDING,
    ...overrides,
  };
}

describe("calculatePointDifference", () => {
  it("subtracts points against from points for", () => {
    expect(calculatePointDifference(21, 15)).toBe(6);
    expect(calculatePointDifference(10, 21)).toBe(-11);
  });
});

describe("calculateStandings", () => {
  it("ignores pending matches", () => {
    const rows = calculateStandings(players, [match({ status: MatchStatus.PENDING })]);
    expect(rows.every((r) => r.played === 0)).toBe(true);
  });

  it("updates played/won/lost/points for a completed match", () => {
    const rows = calculateStandings(players, [
      match({
        player1Id: "p1",
        player2Id: "p2",
        score1: 21,
        score2: 15,
        winnerId: "p1",
        status: MatchStatus.COMPLETED,
      }),
    ]);
    const p1 = rows.find((r) => r.player.id === "p1")!;
    const p2 = rows.find((r) => r.player.id === "p2")!;

    expect(p1.played).toBe(1);
    expect(p1.won).toBe(1);
    expect(p1.lost).toBe(0);
    expect(p1.pointsFor).toBe(21);
    expect(p1.pointsAgainst).toBe(15);
    expect(p1.pointDifference).toBe(6);

    expect(p2.played).toBe(1);
    expect(p2.won).toBe(0);
    expect(p2.lost).toBe(1);
    expect(p2.pointDifference).toBe(-6);
  });

  it("sorts by wins, then point difference, then points scored", () => {
    const rows = calculateStandings(players, [
      match({
        player1Id: "p1",
        player2Id: "p2",
        score1: 21,
        score2: 10,
        winnerId: "p1",
        status: MatchStatus.COMPLETED,
      }),
      match({
        player1Id: "p2",
        player2Id: "p3",
        score1: 21,
        score2: 19,
        winnerId: "p2",
        status: MatchStatus.COMPLETED,
      }),
      match({
        player1Id: "p3",
        player2Id: "p1",
        score1: 21,
        score2: 5,
        winnerId: "p3",
        status: MatchStatus.COMPLETED,
      }),
    ]);
    // p1: 1W 1L, pf=26 pa=31, diff=-5
    // p2: 1W 1L, pf=31 pa=40, diff=-9
    // p3: 1W 1L, pf=40 pa=26, diff=14
    expect(rows.map((r) => r.player.id)).toEqual(["p3", "p1", "p2"]);
  });

  it("ignores knockout-round matches when building the table", () => {
    const rows = calculateStandings(players, [
      match({
        player1Id: "p1",
        player2Id: "p2",
        score1: 21,
        score2: 5,
        winnerId: "p1",
        round: Round.FINAL,
        status: MatchStatus.COMPLETED,
      }),
    ]);
    expect(rows.every((r) => r.played === 0)).toBe(true);
  });
});

describe("calculateChampion", () => {
  it("returns null for ROUND_ROBIN when league is incomplete", () => {
    const matches = [match({ status: MatchStatus.PENDING })];
    const standings = calculateStandings(players, matches);
    expect(
      calculateChampion({ type: TournamentType.ROUND_ROBIN, standings, matches })
    ).toBeNull();
  });

  it("returns the top standings player for ROUND_ROBIN once complete", () => {
    const matches = [
      match({
        player1Id: "p1",
        player2Id: "p2",
        score1: 21,
        score2: 10,
        winnerId: "p1",
        status: MatchStatus.COMPLETED,
      }),
    ];
    const standings = calculateStandings(players.slice(0, 2), matches);
    const champion = calculateChampion({ type: TournamentType.ROUND_ROBIN, standings, matches });
    expect(champion?.id).toBe("p1");
  });

  it("returns null for ROUND_ROBIN_KNOCKOUT until the final is completed", () => {
    const matches = [
      match({
        player1Id: "p1",
        player2Id: "p2",
        winnerId: "p1",
        round: Round.SEMI_FINAL_1,
        status: MatchStatus.COMPLETED,
      }),
    ];
    const standings = calculateStandings(players, matches);
    expect(
      calculateChampion({ type: TournamentType.ROUND_ROBIN_KNOCKOUT, standings, matches })
    ).toBeNull();
  });

  it("returns the final match winner for ROUND_ROBIN_KNOCKOUT", () => {
    const matches = [
      match({
        player1Id: "p1",
        player2Id: "p3",
        score1: 21,
        score2: 18,
        winnerId: "p1",
        round: Round.FINAL,
        status: MatchStatus.COMPLETED,
      }),
    ];
    const standings = calculateStandings(players, matches);
    const champion = calculateChampion({
      type: TournamentType.ROUND_ROBIN_KNOCKOUT,
      standings,
      matches,
    });
    expect(champion?.id).toBe("p1");
  });
});
