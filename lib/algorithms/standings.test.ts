import { describe, expect, it } from "vitest";
import {
  calculateStandings,
  calculateIndividualDoublesStandings,
  calculateChampion,
  calculatePointDifference,
} from "./standings";
import { MatchStatus, Round, TournamentType } from "@/types";

const players = [
  {
    id: "p1",
    tournamentId: "t1",
    name: "Rahul",
    alias: null,
    profileId: null,
    partnerProfileId: null,
    withdrawn: false,
  },
  {
    id: "p2",
    tournamentId: "t1",
    name: "Amit",
    alias: null,
    profileId: null,
    partnerProfileId: null,
    withdrawn: false,
  },
  {
    id: "p3",
    tournamentId: "t1",
    name: "Priya",
    alias: null,
    profileId: null,
    partnerProfileId: null,
    withdrawn: false,
  },
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

  it("excludes a withdrawn player and any of their matches from everyone's numbers", () => {
    const withdrawnPlayers = [
      players[0],
      players[1],
      { ...players[2], withdrawn: true },
    ];
    const rows = calculateStandings(withdrawnPlayers, [
      match({
        player1Id: "p1",
        player2Id: "p2",
        score1: 21,
        score2: 15,
        winnerId: "p1",
        status: MatchStatus.COMPLETED,
      }),
      match({
        player1Id: "p1",
        player2Id: "p3",
        score1: 21,
        score2: 10,
        winnerId: "p1",
        status: MatchStatus.COMPLETED,
      }),
      match({
        player1Id: "p2",
        player2Id: "p3",
        status: MatchStatus.VOID,
      }),
    ]);

    expect(rows.some((r) => r.player.id === "p3")).toBe(false);
    const p1 = rows.find((r) => r.player.id === "p1")!;
    const p2 = rows.find((r) => r.player.id === "p2")!;
    expect(p1.played).toBe(1);
    expect(p1.won).toBe(1);
    expect(p2.played).toBe(1);
    expect(p2.lost).toBe(1);
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

describe("calculateIndividualDoublesStandings", () => {
  const roster = [
    { id: "a", tournamentId: "t1", name: "Alice", alias: null, profileId: "profA", partnerProfileId: null, withdrawn: false },
    { id: "b", tournamentId: "t1", name: "Bob", alias: null, profileId: "profB", partnerProfileId: null, withdrawn: false },
    { id: "c", tournamentId: "t1", name: "Carol", alias: null, profileId: "profC", partnerProfileId: null, withdrawn: false },
    { id: "d", tournamentId: "t1", name: "Dave", alias: null, profileId: "profD", partnerProfileId: null, withdrawn: false },
  ];
  // On-the-fly pairing rows: partners rotate between matches (A+B / C+D in
  // one match, A+D / B+C in the next) — exactly the "teams on the fly"
  // scenario this exists for.
  const pairings = [
    { id: "t1", tournamentId: "t1", name: "Alice & Bob", alias: null, profileId: "profA", partnerProfileId: "profB", withdrawn: false },
    { id: "t2", tournamentId: "t1", name: "Carol & Dave", alias: null, profileId: "profC", partnerProfileId: "profD", withdrawn: false },
    { id: "t3", tournamentId: "t1", name: "Alice & Dave", alias: null, profileId: "profA", partnerProfileId: "profD", withdrawn: false },
    { id: "t4", tournamentId: "t1", name: "Bob & Carol", alias: null, profileId: "profB", partnerProfileId: "profC", withdrawn: false },
  ];

  it("credits both members of each side individually, across different partners", () => {
    const matches = [
      match({
        player1Id: "t1",
        player2Id: "t2",
        score1: 21,
        score2: 15,
        winnerId: "t1",
        status: MatchStatus.COMPLETED,
      }),
      match({
        player1Id: "t3",
        player2Id: "t4",
        score1: 18,
        score2: 21,
        winnerId: "t4",
        status: MatchStatus.COMPLETED,
      }),
    ];
    const rows = calculateIndividualDoublesStandings(roster, pairings, matches);
    const byId = new Map(rows.map((r) => [r.player.id, r]));

    // Alice played once with Bob (won) and once with Dave (lost).
    expect(byId.get("a")).toMatchObject({ played: 2, won: 1, lost: 1, pointsFor: 39, pointsAgainst: 36 });
    // Bob played once with Alice (won) and once with Carol (won).
    expect(byId.get("b")).toMatchObject({ played: 2, won: 2, lost: 0, pointsFor: 42, pointsAgainst: 33 });
    expect(byId.get("c")).toMatchObject({ played: 2, won: 1, lost: 1, pointsFor: 36, pointsAgainst: 39 });
    // Dave was on the losing side both times (with Carol, then with Alice).
    expect(byId.get("d")).toMatchObject({ played: 2, won: 0, lost: 2, pointsFor: 33, pointsAgainst: 42 });

    expect(rows.map((r) => r.player.id)).toEqual(["b", "a", "c", "d"]);
  });

  it("ignores pending matches and matches with no resolvable pairing", () => {
    const rows = calculateIndividualDoublesStandings(roster, pairings, [
      match({ player1Id: "t1", player2Id: "t2", status: MatchStatus.PENDING }),
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

  it("treats a voided league match as non-blocking for ROUND_ROBIN completion", () => {
    const matches = [
      match({
        player1Id: "p1",
        player2Id: "p2",
        score1: 21,
        score2: 10,
        winnerId: "p1",
        status: MatchStatus.COMPLETED,
      }),
      match({ player1Id: "p1", player2Id: "p3", status: MatchStatus.VOID }),
      match({ player1Id: "p2", player2Id: "p3", status: MatchStatus.VOID }),
    ];
    const standings = calculateStandings(players, matches);
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
