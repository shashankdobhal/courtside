export const QUEST_TOTAL_DAYS = 200;

/** activityMode on a QuestDay — "learn"/"practice" are the default, unbadged case. */
export const questActivityModeLabel: Record<string, string> = {
  learn: "New skill",
  practice: "Practice",
  review: "Review",
  assessment: "Assessment",
  challenge: "Challenge",
};

/** taskType on a QuestTask, shown as a small label next to each checklist item. */
export const questTaskTypeLabel: Record<string, string> = {
  video: "Watch",
  shadow: "Shadow practice",
  drill: "Drill",
  repeat: "Repeat",
  warmup: "Warm-up",
  challenge: "Challenge",
  assessment: "Assessment",
  reflection: "Reflection",
};
