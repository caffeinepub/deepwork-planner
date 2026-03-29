import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  Check,
  Flag,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Entity__3 } from "../backend.d.ts";
import CategoryBadge from "../components/CategoryBadge";
import PriorityBadge from "../components/PriorityBadge";
import RichTextEditor from "../components/RichTextEditor";
import {
  useCreateGoal,
  useDeleteGoal,
  useGoals,
  useMonthPlans,
  useMonthTasks,
  useUpdateGoal,
} from "../hooks/useQueries";
import {
  DEFAULT_GOAL_TEMPLATE,
  type GoalEnvelope,
  calcGoalProgress,
  parseGoalDescription,
  serializeGoalDescription,
} from "../lib/goalData";

const CATEGORIES = [
  "All",
  "Study",
  "Coding",
  "Health",
  "Career",
  "Fitness",
  "Other",
];
const GOAL_CATEGORIES = [
  "Study",
  "Coding",
  "Health",
  "Career",
  "Fitness",
  "Other",
];
const PRIORITIES = ["High", "Medium", "Low"];

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

export default function MasterPlan() {
  const { data: goals, isLoading } = useGoals();
  const { data: monthPlans } = useMonthPlans();
  const { data: monthTasks } = useMonthTasks();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [filter, setFilter] = useState("All");

  // Detail modal state
  const [selectedGoal, setSelectedGoal] = useState<Entity__3 | null>(null);
  const [liveEnvelope, setLiveEnvelope] = useState<GoalEnvelope | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    priority: "",
    deadline: "",
  });
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: "", deadline: "" });
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Add modal state
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    content: DEFAULT_GOAL_TEMPLATE,
    category: "Study",
    priority: "Medium",
    deadline: "",
    tags: [] as string[],
  });
  const [addTagInput, setAddTagInput] = useState("");

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // All tags across all goals for suggestions
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const g of goals ?? []) {
      try {
        for (const t of parseGoalDescription(g.description).tags) {
          tagSet.add(t);
        }
      } catch {
        // ignore
      }
    }
    return Array.from(tagSet);
  }, [goals]);

  const filtered = (goals ?? []).filter(
    (g) => filter === "All" || g.category === filter,
  );

  // ---- Detail modal handlers ----
  const openDetail = (goal: Entity__3) => {
    const env = parseGoalDescription(goal.description);
    setSelectedGoal(goal);
    setLiveEnvelope(env);
    setIsEditMode(false);
    setEditForm({
      title: goal.title,
      category: goal.category,
      priority: goal.priority,
      deadline: env.deadline,
    });
    setTagInput("");
    setShowAddMilestone(false);
    setNewMilestone({ title: "", deadline: "" });
  };

  const updateEnvelope = async (
    newEnv: GoalEnvelope,
    overrides?: { title?: string; category?: string; priority?: string },
  ) => {
    if (!selectedGoal) return;
    const serialized = serializeGoalDescription(newEnv);
    setLiveEnvelope(newEnv);
    setSelectedGoal((prev) =>
      prev ? { ...prev, description: serialized, ...overrides } : prev,
    );
    await updateGoal.mutateAsync({
      id: selectedGoal.id,
      title: overrides?.title ?? selectedGoal.title,
      description: serialized,
      category: overrides?.category ?? selectedGoal.category,
      priority: overrides?.priority ?? selectedGoal.priority,
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedGoal || !liveEnvelope || !editForm.title.trim()) return;
    const updatedEnv = { ...liveEnvelope, deadline: editForm.deadline };
    try {
      await updateEnvelope(updatedEnv, {
        title: editForm.title,
        category: editForm.category,
        priority: editForm.priority,
      });
      setIsEditMode(false);
      toast.success("Goal updated");
    } catch {
      toast.error("Failed to update goal");
    }
  };

  const cancelEdit = () => {
    if (!selectedGoal || !liveEnvelope) return;
    setEditForm({
      title: selectedGoal.title,
      category: selectedGoal.category,
      priority: selectedGoal.priority,
      deadline: liveEnvelope.deadline,
    });
    setIsEditMode(false);
  };

  // Milestones
  const toggleMilestone = async (id: string) => {
    if (!liveEnvelope) return;
    const updated = {
      ...liveEnvelope,
      milestones: liveEnvelope.milestones.map((m) =>
        m.id === id ? { ...m, completed: !m.completed } : m,
      ),
    };
    try {
      await updateEnvelope(updated);
    } catch {
      toast.error("Failed to save");
    }
  };

  const addMilestoneItem = async () => {
    if (!liveEnvelope || !newMilestone.title.trim()) return;
    const updated = {
      ...liveEnvelope,
      milestones: [
        ...liveEnvelope.milestones,
        {
          id: crypto.randomUUID(),
          title: newMilestone.title.trim(),
          deadline: newMilestone.deadline,
          completed: false,
        },
      ],
    };
    try {
      await updateEnvelope(updated);
      setNewMilestone({ title: "", deadline: "" });
      setShowAddMilestone(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  const deleteMilestoneItem = async (id: string) => {
    if (!liveEnvelope) return;
    const updated = {
      ...liveEnvelope,
      milestones: liveEnvelope.milestones.filter((m) => m.id !== id),
    };
    try {
      await updateEnvelope(updated);
    } catch {
      toast.error("Failed to save");
    }
  };

  // Tags
  const addTagToGoal = async (tag: string) => {
    if (!liveEnvelope) return;
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || liveEnvelope.tags.includes(trimmed)) return;
    const updated = { ...liveEnvelope, tags: [...liveEnvelope.tags, trimmed] };
    try {
      await updateEnvelope(updated);
    } catch {
      toast.error("Failed to save");
    }
    setTagInput("");
    setShowTagSuggestions(false);
  };

  const removeTagFromGoal = async (tag: string) => {
    if (!liveEnvelope) return;
    const updated = {
      ...liveEnvelope,
      tags: liveEnvelope.tags.filter((t) => t !== tag),
    };
    try {
      await updateEnvelope(updated);
    } catch {
      toast.error("Failed to save");
    }
  };

  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    const q = tagInput.trim().toLowerCase();
    return allTags.filter(
      (t) => t.includes(q) && !liveEnvelope?.tags.includes(t),
    );
  }, [tagInput, allTags, liveEnvelope?.tags]);

  // Add tag to addForm
  const addTagToForm = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || addForm.tags.includes(trimmed)) return;
    setAddForm((p) => ({ ...p, tags: [...p.tags, trimmed] }));
    setAddTagInput("");
  };

  // Delete
  const handleDeleteFromDetail = () => {
    if (!selectedGoal) return;
    setDeleteId(selectedGoal.id);
  };

  // Add modal
  const openAdd = () => {
    setAddForm({
      title: "",
      content: DEFAULT_GOAL_TEMPLATE,
      category: "Study",
      priority: "Medium",
      deadline: "",
      tags: [],
    });
    setAddTagInput("");
    setAddOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title.trim()) return;
    const envelope: GoalEnvelope = {
      v: 1,
      content: addForm.content,
      deadline: addForm.deadline,
      tags: addForm.tags,
      milestones: [],
    };
    try {
      await createGoal.mutateAsync({
        id: crypto.randomUUID(),
        title: addForm.title,
        description: serializeGoalDescription(envelope),
        category: addForm.category,
        priority: addForm.priority,
      });
      toast.success("Goal created");
      setAddOpen(false);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const wasSelected = selectedGoal?.id === deleteId;
    try {
      await deleteGoal.mutateAsync(deleteId);
      toast.success("Goal deleted");
      if (wasSelected) setSelectedGoal(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  // Progress for each goal
  const getProgress = (goalId: string) =>
    calcGoalProgress(goalId, monthPlans ?? [], monthTasks ?? []);

  // Milestone info for cards
  const getMilestoneInfo = (goal: Entity__3) => {
    const env = parseGoalDescription(goal.description);
    return {
      total: env.milestones.length,
      completed: env.milestones.filter((m) => m.completed).length,
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Master Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your long-term goals and ambitions
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="gradient-primary text-white border-0 flex-shrink-0"
          data-ocid="master_plan.add_goal.button"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add Goal
        </Button>
      </div>

      {/* Category filter */}
      <div
        className="flex items-center gap-2 flex-wrap"
        data-ocid="master_plan.category.tab"
      >
        {CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filter === cat
                ? "gradient-primary text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Goal Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-16"
          data-ocid="master_plan.goals.empty_state"
        >
          <Target className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No goals yet. Start by adding your first goal.
          </p>
          <Button
            onClick={openAdd}
            className="mt-4 gradient-primary text-white border-0"
            data-ocid="master_plan.create_first.button"
          >
            <Plus className="h-4 w-4 mr-1" /> Create Goal
          </Button>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="master_plan.goals.list"
        >
          <AnimatePresence>
            {filtered.map((goal, i) => {
              const progress = getProgress(goal.id);
              const ms = getMilestoneInfo(goal);
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  data-ocid={`master_plan.goals.item.${i + 1}`}
                  onClick={() => openDetail(goal)}
                  className="group cursor-pointer rounded-2xl bg-card border border-white/10 shadow-lg p-5 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(139,92,246,0.2)] hover:border-white/20 select-none"
                >
                  {/* Title */}
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
                    {goal.title}
                  </h3>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <CategoryBadge category={goal.category} />
                    <PriorityBadge priority={goal.priority} />
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <ProgressBar value={progress} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {progress}% complete
                      </span>
                      {ms.total > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {ms.completed}/{ms.total} milestones
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ---- Goal Detail Modal ---- */}
      <Dialog
        open={!!selectedGoal}
        onOpenChange={(o) => !o && setSelectedGoal(null)}
      >
        <DialogContent
          className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0"
          data-ocid="master_plan.goal.dialog"
        >
          {selectedGoal && liveEnvelope && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-6 space-y-6"
            >
              {/* Header */}
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    {isEditMode ? (
                      <Input
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, title: e.target.value }))
                        }
                        className="text-xl font-bold h-auto py-1.5"
                        placeholder="Goal title"
                        data-ocid="master_plan.goal.input"
                      />
                    ) : (
                      <DialogTitle className="text-xl leading-snug">
                        {selectedGoal.title}
                      </DialogTitle>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {isEditMode ? (
                        <>
                          <Select
                            value={editForm.category}
                            onValueChange={(v) =>
                              setEditForm((p) => ({ ...p, category: v }))
                            }
                          >
                            <SelectTrigger
                              className="w-32 h-7 text-xs"
                              data-ocid="master_plan.goal.category.select"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GOAL_CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={editForm.priority}
                            onValueChange={(v) =>
                              setEditForm((p) => ({ ...p, priority: v }))
                            }
                          >
                            <SelectTrigger
                              className="w-28 h-7 text-xs"
                              data-ocid="master_plan.goal.priority.select"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITIES.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <>
                          <CategoryBadge category={selectedGoal.category} />
                          <PriorityBadge priority={selectedGoal.priority} />
                          {liveEnvelope.deadline && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(liveEnvelope.deadline)}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {isEditMode && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={editForm.deadline}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              deadline: e.target.value,
                            }))
                          }
                          className="h-7 text-sm max-w-[180px]"
                          placeholder="Final deadline"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {!isEditMode && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditMode(true)}
                          data-ocid="master_plan.goal.edit_button"
                          className="gap-1.5"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDeleteFromDetail}
                          data-ocid="master_plan.goal.delete_button"
                          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <Separator className="opacity-20" />

              {/* Progress */}
              {(() => {
                const progress = getProgress(selectedGoal.id);
                const plans = (monthPlans ?? []).filter(
                  (p) => p.linkedGoalId === selectedGoal.id,
                );
                const planIds = plans.map((p) => p.id);
                const tasks = (monthTasks ?? []).filter((t) =>
                  planIds.includes(t.monthPlanId),
                );
                const completedCount = tasks.filter((t) => t.completed).length;
                return (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Flag className="h-3.5 w-3.5" /> Progress
                    </Label>
                    <div className="space-y-1.5">
                      <ProgressBar value={progress} />
                      <p className="text-xs text-muted-foreground">
                        {progress}% complete
                        {tasks.length > 0
                          ? ` · ${completedCount}/${tasks.length} tasks`
                          : " · No linked tasks yet"}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <Separator className="opacity-20" />

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Description
                </Label>
                <RichTextEditor
                  value={liveEnvelope.content}
                  onChange={(html) => {
                    setLiveEnvelope((prev) =>
                      prev ? { ...prev, content: html } : prev,
                    );
                  }}
                  readOnly={!isEditMode}
                  placeholder="Describe your goal..."
                />
              </div>

              <Separator className="opacity-20" />

              {/* Milestones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" /> Milestones
                    {liveEnvelope.milestones.length > 0 && (
                      <span className="text-muted-foreground normal-case tracking-normal font-normal">
                        ·{" "}
                        {
                          liveEnvelope.milestones.filter((m) => m.completed)
                            .length
                        }
                        /{liveEnvelope.milestones.length}
                      </span>
                    )}
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => setShowAddMilestone((v) => !v)}
                    data-ocid="master_plan.milestone.open_modal_button"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>

                {/* Add milestone form */}
                <AnimatePresence>
                  {showAddMilestone && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-white/10">
                        <Input
                          value={newMilestone.title}
                          onChange={(e) =>
                            setNewMilestone((p) => ({
                              ...p,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Milestone title"
                          className="h-8 text-sm flex-1"
                          data-ocid="master_plan.milestone.input"
                          onKeyDown={(e) =>
                            e.key === "Enter" && addMilestoneItem()
                          }
                        />
                        <Input
                          type="date"
                          value={newMilestone.deadline}
                          onChange={(e) =>
                            setNewMilestone((p) => ({
                              ...p,
                              deadline: e.target.value,
                            }))
                          }
                          className="h-8 text-sm w-36"
                        />
                        <Button
                          size="sm"
                          className="h-8 gradient-primary text-white border-0"
                          onClick={addMilestoneItem}
                          disabled={
                            !newMilestone.title.trim() || updateGoal.isPending
                          }
                          data-ocid="master_plan.milestone.save_button"
                        >
                          {updateGoal.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={() => setShowAddMilestone(false)}
                          data-ocid="master_plan.milestone.cancel_button"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Milestone list */}
                {liveEnvelope.milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No milestones yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {liveEnvelope.milestones.map((m, idx) => (
                      <motion.li
                        key={m.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        data-ocid={`master_plan.milestone.item.${idx + 1}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30 border border-white/8 group"
                      >
                        <button
                          type="button"
                          onClick={() => toggleMilestone(m.id)}
                          data-ocid={`master_plan.milestone.checkbox.${idx + 1}`}
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            m.completed
                              ? "bg-violet-500 border-violet-500"
                              : "border-white/30 hover:border-violet-400"
                          }`}
                        >
                          {m.completed && (
                            <Check className="h-2.5 w-2.5 text-white" />
                          )}
                        </button>
                        <span
                          className={`flex-1 text-sm ${
                            m.completed
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {m.title}
                        </span>
                        {m.deadline && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(m.deadline)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteMilestoneItem(m.id)}
                          data-ocid={`master_plan.milestone.delete_button.${idx + 1}`}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              <Separator className="opacity-20" />

              {/* Tags */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Tags
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {liveEnvelope.tags.map((tag) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTagFromGoal(tag)}
                        className="hover:text-white transition-colors ml-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </motion.span>
                  ))}
                </div>
                <div className="relative">
                  <Input
                    ref={tagInputRef}
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value);
                      setShowTagSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTagToGoal(tagInput);
                      } else if (e.key === "Escape") {
                        setShowTagSuggestions(false);
                      }
                    }}
                    onFocus={() => setShowTagSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowTagSuggestions(false), 150)
                    }
                    placeholder="Add tag and press Enter"
                    className="h-8 text-sm"
                    data-ocid="master_plan.goal.tag.input"
                  />
                  {showTagSuggestions && tagSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl bg-popover border border-white/10 shadow-xl overflow-hidden">
                      {tagSuggestions.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addTagToGoal(t);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors"
                        >
                          #{t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Edit mode save/cancel */}
              {isEditMode && (
                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEdit}
                    data-ocid="master_plan.goal.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={updateGoal.isPending || !editForm.title.trim()}
                    onClick={handleSaveEdit}
                    className="gradient-primary text-white border-0"
                    data-ocid="master_plan.goal.save_button"
                  >
                    {updateGoal.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Save Changes
                  </Button>
                </DialogFooter>
              )}
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---- Add Goal Modal ---- */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          if (!o) setAddOpen(false);
        }}
      >
        <DialogContent
          className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="master_plan.add_goal.dialog"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <DialogHeader className="pb-4">
              <DialogTitle className="text-lg">New Goal</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Define something meaningful you want to achieve.
              </p>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Title
                </Label>
                <Input
                  placeholder="e.g. Become a full-stack developer"
                  value={addForm.title}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, title: e.target.value }))
                  }
                  data-ocid="master_plan.add_goal.input"
                  required
                />
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Category
                  </Label>
                  <Select
                    value={addForm.category}
                    onValueChange={(v) =>
                      setAddForm((p) => ({ ...p, category: v }))
                    }
                  >
                    <SelectTrigger data-ocid="master_plan.add_goal.category.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Priority
                  </Label>
                  <Select
                    value={addForm.priority}
                    onValueChange={(v) =>
                      setAddForm((p) => ({ ...p, priority: v }))
                    }
                  >
                    <SelectTrigger data-ocid="master_plan.add_goal.priority.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Final Deadline
                </Label>
                <Input
                  type="date"
                  value={addForm.deadline}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, deadline: e.target.value }))
                  }
                  className="w-full"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Tags
                </Label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {addForm.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="gap-1 bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/30"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() =>
                          setAddForm((p) => ({
                            ...p,
                            tags: p.tags.filter((t) => t !== tag),
                          }))
                        }
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  value={addTagInput}
                  onChange={(e) => setAddTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTagToForm(addTagInput);
                    }
                  }}
                  placeholder="Type tag and press Enter"
                  className="h-8 text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <RichTextEditor
                  value={addForm.content}
                  onChange={(html) =>
                    setAddForm((p) => ({ ...p, content: html }))
                  }
                  placeholder="Describe your goal..."
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddOpen(false)}
                  data-ocid="master_plan.add_goal.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createGoal.isPending || !addForm.title.trim()}
                  className="gradient-primary text-white border-0"
                  data-ocid="master_plan.add_goal.submit_button"
                >
                  {createGoal.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Create Goal
                </Button>
              </DialogFooter>
            </form>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirm ---- */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="master_plan.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All data for this goal will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="master_plan.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-ocid="master_plan.delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
