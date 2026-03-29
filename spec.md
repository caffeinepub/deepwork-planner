# DeepWork Planner — Master Plan Upgrade

## Current State
MasterPlan.tsx shows goal cards (title, category badge, priority badge, mini SVG ring). Goal detail opens in a Dialog with plain textarea. No milestones, tags, deadline. Backend Goal: { id, title, description, category, priority, createdAt }.

## Requested Changes (Diff)

### Add
- Card: horizontal progress bar + milestone progress chip (e.g. 2/5)
- Detail: Basic Info (title, category, priority, deadline), Rich Text Editor (Bold/Italic/Underline/H1/H2/Bullet/Numbered/Highlight/Checklist), Milestones section (CRUD with deadlines + completion), Tags section (free-form, Enter to add, suggestions)
- All data stored in description field as JSON envelope: { v:1, content: string HTML, deadline: string, tags: string[], milestones: [{id,title,deadline,completed}] }
- Progress calculated from MonthTasks linked via MonthPlans.linkedGoalId

### Modify
- Goal cards: replace SVG ring with progress bar + milestone chip
- Goal detail modal: structured sections replacing flat textarea
- useCreateGoal / useUpdateGoal: serialize extended data into description field
- Parse description on load: if starts with {"v":1 parse as JSON, else treat as legacy text

### Remove
- Mini SVG ring from cards

## Implementation Plan
1. Create `src/frontend/src/lib/goalData.ts` with encode/decode helpers for description envelope, progress calculation
2. Create `src/frontend/src/components/RichTextEditor.tsx` — contenteditable with toolbar, checklist support
3. Rewrite `src/frontend/src/pages/MasterPlan.tsx` with new card layout, detail modal, add modal
4. Validate
