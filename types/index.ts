export const TournamentType = {
  ROUND_ROBIN: "ROUND_ROBIN",
  ROUND_ROBIN_KNOCKOUT: "ROUND_ROBIN_KNOCKOUT",
  KNOCKOUT: "KNOCKOUT",
  // Doubles-only: no generated fixtures — teams log matches ad hoc, whoever's
  // next, and the organizer ends the session manually. Singles never uses this.
  SESSION: "SESSION",
} as const;
export type TournamentType = (typeof TournamentType)[keyof typeof TournamentType];

export const TournamentFormat = {
  SINGLES: "SINGLES",
  DOUBLES: "DOUBLES",
} as const;
export type TournamentFormat = (typeof TournamentFormat)[keyof typeof TournamentFormat];

// Shown on the invite share message as "Level" — purely descriptive, never
// factored into matchmaking or fixtures.
export const SkillLevel = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
  PROFESSIONAL: "PROFESSIONAL",
} as const;
export type SkillLevel = (typeof SkillLevel)[keyof typeof SkillLevel];

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
  VOID: "VOID",
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const CommunityRole = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;
export type CommunityRole = (typeof CommunityRole)[keyof typeof CommunityRole];

export const CommunityMembershipStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
} as const;
export type CommunityMembershipStatus =
  (typeof CommunityMembershipStatus)[keyof typeof CommunityMembershipStatus];

export const Round = {
  LEAGUE: "LEAGUE",
  SEMI_FINAL_1: "SEMI_FINAL_1",
  SEMI_FINAL_2: "SEMI_FINAL_2",
  // Pure-knockout bracket rounds (TournamentType.KNOCKOUT) — a single round
  // can hold several matches (e.g. 4 quarterfinals), unlike SEMI_FINAL_1/2
  // above which are two individually-named matches in ROUND_ROBIN_KNOCKOUT.
  ROUND_OF_32: "ROUND_OF_32",
  ROUND_OF_16: "ROUND_OF_16",
  QUARTERFINAL: "QUARTERFINAL",
  SEMI_FINAL: "SEMI_FINAL",
  FINAL: "FINAL",
} as const;
export type Round = (typeof Round)[keyof typeof Round];

export interface PlayerProfile {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Player {
  id: string;
  tournamentId: string;
  name: string;
  alias: string | null;
  profileId: string | null;
  partnerProfileId: string | null;
  withdrawn: boolean;
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
  completedAt: Date | null;
  isBestOfThree: boolean;
  game1Score1: number | null;
  game1Score2: number | null;
  game2Score1: number | null;
  game2Score2: number | null;
  game3Score1: number | null;
  game3Score2: number | null;
}

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  format: TournamentFormat;
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
