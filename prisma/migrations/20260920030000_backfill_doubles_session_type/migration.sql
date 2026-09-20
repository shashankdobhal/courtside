-- Data backfill: "type" is being repurposed to also describe doubles
-- tournaments (ROUND_ROBIN | ROUND_ROBIN_KNOCKOUT | KNOCKOUT | SESSION).
-- Until now every DOUBLES row stored a meaningless "ROUND_ROBIN" (the create
-- form's default, never surfaced or read for doubles) and always behaved as
-- an ad-hoc session. Backfill every existing DOUBLES row to the new SESSION
-- value so that behavior is preserved exactly; only tournaments created from
-- here on can explicitly opt into a generated doubles bracket/round robin.
UPDATE "Tournament" SET "type" = 'SESSION' WHERE "format" = 'DOUBLES';
