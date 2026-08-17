export const TournamentType = {
  ROUND_ROBIN: "ROUND_ROBIN",
  ROUND_ROBIN_KNOCKOUT: "ROUND_ROBIN_KNOCKOUT",
} as const;
export type TournamentType = (typeof TournamentType)[keyof typeof TournamentType];

export const TournamentStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type TournamentStatus = (typeof TournamentStatus)[keyof typeof TournamentStatus];

export const MatchStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const Round = {
  LEAGUE: "LEAGUE",
  SEMI_FINAL_1: "SEMI_FINAL_1",
  SEMI_FINAL_2: "SEMI_FINAL_2",
  FINAL: "FINAL",
} as const;
export type Round = (typeof Round)[keyof typeof Round];

export interface Player {
  id: string;
  tournamentId: string;
  name: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  player1Id: string;
  player2Id: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  round: string;
  status: MatchStatus;
  matchOrder: number;
}

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  status: TournamentStatus;
  legs: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentWithRelations extends Tournament {
  players: Player[];
  matches: Match[];
}

export interface StandingsRow {
  player: Player;
  played: number;
  won: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
}
