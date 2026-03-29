import type { Entity__1, Entity__2 } from "../backend.d.ts";

export interface GoalMilestone {
  id: string;
  title: string;
  deadline: string;
  completed: boolean;
}

export interface GoalEnvelope {
  v: 1;
  content: string;
  deadline: string;
  tags: string[];
  milestones: GoalMilestone[];
}

export const DEFAULT_GOAL_TEMPLATE = `<h2>Goal Overview</h2><ul><li>What is this goal about?</li></ul><h2>Key Objectives</h2><ul><li><input type="checkbox" data-checked="false"> Objective 1</li><li><input type="checkbox" data-checked="false"> Objective 2</li></ul><h2>Strategy</h2><ul><li>Step 2</li></ul><h2>Notes</h2><ul><li></li></ul>`;

export function parseGoalDescription(raw: string): GoalEnvelope {
  if (!raw || !raw.trim()) {
    return { v: 1, content: "", deadline: "", tags: [], milestones: [] };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.v === 1) {
      return {
        v: 1,
        content: parsed.content ?? "",
        deadline: parsed.deadline ?? "",
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
      };
    }
    // v not 1 — treat as legacy
    return { v: 1, content: raw, deadline: "", tags: [], milestones: [] };
  } catch {
    return { v: 1, content: raw, deadline: "", tags: [], milestones: [] };
  }
}

export function serializeGoalDescription(envelope: GoalEnvelope): string {
  return JSON.stringify(envelope);
}

export function calcGoalProgress(
  goalId: string,
  monthPlans: Entity__2[],
  monthTasks: Entity__1[],
): number {
  const planIds = monthPlans
    .filter((p) => p.linkedGoalId === goalId)
    .map((p) => p.id);
  if (planIds.length === 0) return 0;
  const tasks = monthTasks.filter((t) => planIds.includes(t.monthPlanId));
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}
