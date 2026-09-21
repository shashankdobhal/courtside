"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { skillLevelLabel, skillLevelOptions } from "@/lib/tournament-display";
import type { SkillLevel } from "@/types";

export function SkillLevelChecklist({
  value,
  onChange,
  idPrefix,
}: {
  value: SkillLevel[];
  onChange: (next: SkillLevel[]) => void;
  idPrefix: string;
}) {
  const toggle = (level: SkillLevel) => {
    onChange(value.includes(level) ? value.filter((v) => v !== level) : [...value, level]);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {skillLevelOptions.map((level) => {
        const id = `${idPrefix}-${level}`;
        return (
          <div key={level} className="flex items-center gap-2">
            <Checkbox
              id={id}
              checked={value.includes(level)}
              onCheckedChange={() => toggle(level)}
            />
            <Label htmlFor={id} className="font-normal">
              {skillLevelLabel[level]}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
