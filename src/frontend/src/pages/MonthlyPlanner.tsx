import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getDaysInMonth } from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Entity__1, Entity__3 } from "../backend.d.ts";
import CategoryBadge from "../components/CategoryBadge";
import PriorityBadge from "../components/PriorityBadge";
import {
  useCreateMonthPlan,
  useCreateMonthTask,
  useDeleteMonthPlan,
  useDeleteMonthTask,
  useGoals,
  useMonthPlans,
  useMonthTasks,
  useMonthlyTaskStats,
  useUpdateMonthPlan,
  useUpdateMonthTask,
} from "../hooks/useQueries";

const PRIORITIES = ["High", "Medium", "Low"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getWeeksInMonth(year: number, month: number) {
  const days = getDaysInMonth(new Date(year, month - 1));
  return Math.ceil(days / 7);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type TaskForm = {
  title: string;
  description: string;
  priority: string;
  deadline: string;
  weekNumber: number;
  isFrog: boolean;
};
const emptyTask = (week = 1): TaskForm => ({
  title: "",
  description: "",
  priority: "Medium",
  deadline: "",
  weekNumber: week,
  isFrog: false,
});

export default function MonthlyPlanner() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [addTaskModal, setAddTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskForm>(emptyTask());
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [createPlanModal, setCreatePlanModal] = useState(false);
  const [planLinkedGoalId, setPlanLinkedGoalId] = useState("none");
  const [deletePlanConfirm, setDeletePlanConfirm] = useState(false);

  const { data: plans, isLoading: loadingPlans } = useMonthPlans();
  const { data: tasks, isLoading: loadingTasks } = useMonthTasks();
  const { data: goals } = useGoals();
  const createPlan = useCreateMonthPlan();
  const updatePlan = useUpdateMonthPlan();
  const deletePlan = useDeleteMonthPlan();
  const createTask = useCreateMonthTask();
  const updateTask = useUpdateMonthTask();
  const deleteTask = useDeleteMonthTask();
  const { data: taskStats } = useMonthlyTaskStats(year, month);

  const currentPlan = useMemo(
    () =>
      (plans ?? []).find(
        (p) => Number(p.year) === year && Number(p.month) === month,
      ) ?? null,
    [plans, year, month],
  );

  const planTasks = useMemo(
    () => (tasks ?? []).filter((t) => t.monthPlanId === currentPlan?.id),
    [tasks, currentPlan],
  );

  const linkedGoal = useMemo(
    () =>
      currentPlan?.linkedGoalId
        ? ((goals ?? []).find((g) => g.id === currentPlan.linkedGoalId) ?? null)
        : null,
    [currentPlan, goals],
  );

  const weeksCount = getWeeksInMonth(year, month);
  const today = todayStr();

  const monthPct =
    taskStats && taskStats.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0;

  const prevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  };

  const handleCreatePlan = async () => {
    try {
      await createPlan.mutateAsync({
        id: crypto.randomUUID(),
        year,
        month,
        title: `${MONTH_NAMES[month - 1]} ${year}`,
        linkedGoalId: planLinkedGoalId === "none" ? "" : planLinkedGoalId,
      });
      toast.success("Month plan created");
      setCreatePlanModal(false);
      setPlanLinkedGoalId("none");
    } catch {
      toast.error("Failed to create plan");
    }
  };

  const handleLinkGoal = async (goalId: string) => {
    if (!currentPlan) return;
    try {
      await updatePlan.mutateAsync({
        id: currentPlan.id,
        year,
        month,
        title: currentPlan.title,
        linkedGoalId: goalId === "none" ? "" : goalId,
      });
      toast.success(
        goalId && goalId !== "none" ? "Goal linked" : "Goal unlinked",
      );
    } catch {
      toast.error("Failed to update plan");
    }
  };

  const handleDeletePlan = async () => {
    if (!currentPlan) return;
    try {
      await deletePlan.mutateAsync(currentPlan.id);
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    } finally {
      setDeletePlanConfirm(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !currentPlan) return;
    try {
      await createTask.mutateAsync({
        id: crypto.randomUUID(),
        monthPlanId: currentPlan.id,
        ...taskForm,
        completed: false,
      });
      toast.success("Task added");
      setAddTaskModal(false);
      setTaskForm(emptyTask());
    } catch {
      toast.error("Failed to add task");
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    try {
      await deleteTask.mutateAsync(deleteTaskId);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteTaskId(null);
    }
  };

  const handleToggleComplete = async (task: Entity__1) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        monthPlanId: task.monthPlanId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        deadline: task.deadline,
        weekNumber: Number(task.weekNumber),
        completed: !task.completed,
        isFrog: task.isFrog,
      });
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleToggleFrog = async (task: Entity__1, weekTasks: Entity__1[]) => {
    const newFrogState = !task.isFrog;
    // If setting as frog, unmark previous frog in same week first
    if (newFrogState) {
      const oldFrog = weekTasks.find((t) => t.id !== task.id && t.isFrog);
      if (oldFrog) {
        await updateTask.mutateAsync({
          id: oldFrog.id,
          monthPlanId: oldFrog.monthPlanId,
          title: oldFrog.title,
          description: oldFrog.description,
          priority: oldFrog.priority,
          deadline: oldFrog.deadline,
          weekNumber: Number(oldFrog.weekNumber),
          completed: oldFrog.completed,
          isFrog: false,
        });
      }
    }
    try {
      await updateTask.mutateAsync({
        id: task.id,
        monthPlanId: task.monthPlanId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        deadline: task.deadline,
        weekNumber: Number(task.weekNumber),
        completed: task.completed,
        isFrog: newFrogState,
      });
    } catch {
      toast.error("Failed to update task");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Monthly Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Break goals into monthly milestones
          </p>
        </div>
        {currentPlan && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletePlanConfirm(true)}
              className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
              data-ocid="monthly.delete_plan.button"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete Plan
            </Button>
            <Button
              onClick={() => {
                setTaskForm(emptyTask());
                setAddTaskModal(true);
              }}
              className="gradient-primary text-white border-0"
              data-ocid="monthly.add_task.button"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Task
            </Button>
          </div>
        )}
      </div>

      {/* Month Navigator */}
      <Card className="shadow-card border-border">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              data-ocid="monthly.pagination_prev"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center flex-1">
              <p className="text-xl font-bold">
                {MONTH_NAMES[month - 1]} {year}
              </p>
              {currentPlan && taskStats && taskStats.total > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <span className="font-semibold text-primary">
                      {monthPct}% complete
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {taskStats.completed}/{taskStats.total} tasks
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <Progress value={monthPct} className="h-2 w-56" />
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              data-ocid="monthly.pagination_next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Linked Goal Banner */}
      <AnimatePresence>
        {currentPlan && (
          <motion.div
            key="goal-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {linkedGoal ? (
              <LinkedGoalBanner
                goal={linkedGoal}
                goals={goals ?? []}
                onChangeGoal={handleLinkGoal}
                isPending={updatePlan.isPending}
              />
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border bg-muted/30">
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground flex-1">
                  No goal linked to this month
                </p>
                <Select onValueChange={handleLinkGoal}>
                  <SelectTrigger
                    className="w-44 h-8 text-xs"
                    data-ocid="monthly.link_goal.select"
                  >
                    <SelectValue placeholder="Link a goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {(goals ?? []).map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan content */}
      {loadingPlans ? (
        <Skeleton className="h-48 w-full" />
      ) : !currentPlan ? (
        <div className="text-center py-16" data-ocid="monthly.plan.empty_state">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-medium">
            No plan for {MONTH_NAMES[month - 1]} {year}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Create a plan to start organizing your month
          </p>
          <Button
            onClick={() => setCreatePlanModal(true)}
            className="mt-4 gradient-primary text-white border-0"
            data-ocid="monthly.create_plan.button"
          >
            <Plus className="h-4 w-4 mr-1" /> Create Month Plan
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <Accordion
            type="multiple"
            defaultValue={["week-1"]}
            className="space-y-3"
          >
            {Array.from({ length: weeksCount }, (_, i) => i + 1).map((week) => {
              const weekTasks = planTasks.filter(
                (t) => Number(t.weekNumber) === week,
              );
              const sortedTasks = [
                ...weekTasks.filter((t) => t.isFrog),
                ...weekTasks.filter((t) => !t.isFrog),
              ];
              const completedCount = weekTasks.filter(
                (t) => t.completed,
              ).length;
              const weekPct =
                weekTasks.length > 0
                  ? Math.round((completedCount / weekTasks.length) * 100)
                  : 0;

              return (
                <AccordionItem
                  key={week}
                  value={`week-${week}`}
                  className="border border-border rounded-xl bg-card shadow-card overflow-hidden"
                  data-ocid={`monthly.week.item.${week}`}
                >
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1 mr-2">
                      <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {week}
                      </div>
                      <span className="font-semibold text-sm">Week {week}</span>
                      <span className="text-xs text-muted-foreground">
                        {weekTasks.length} task
                        {weekTasks.length !== 1 ? "s" : ""}
                      </span>
                      {weekTasks.length > 0 && (
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-xs text-muted-foreground">
                            {completedCount}/{weekTasks.length}
                          </span>
                          <div className="w-20">
                            <Progress value={weekPct} className="h-1.5" />
                          </div>
                          <span className="text-xs font-medium text-primary">
                            {weekPct}%
                          </span>
                        </div>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4">
                    {loadingTasks ? (
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <Skeleton key={i} className="h-14" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sortedTasks.length === 0 ? (
                          <div
                            className="py-3"
                            data-ocid={`monthly.week${week}_tasks.empty_state`}
                          >
                            <p className="text-sm text-muted-foreground">
                              No tasks this week
                            </p>
                          </div>
                        ) : (
                          sortedTasks.map((task, ti) => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              index={ti}
                              today={today}
                              onDelete={() => setDeleteTaskId(task.id)}
                              onToggleComplete={() =>
                                handleToggleComplete(task)
                              }
                              onToggleFrog={() =>
                                handleToggleFrog(task, weekTasks)
                              }
                            />
                          ))
                        )}

                        {/* Quick inline add */}
                        <QuickAddTask
                          week={week}
                          planId={currentPlan.id}
                          onAdded={() => {}}
                        />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </motion.div>
      )}

      {/* Create Plan Modal */}
      <Dialog open={createPlanModal} onOpenChange={setCreatePlanModal}>
        <DialogContent
          className="sm:max-w-sm"
          data-ocid="monthly.create_plan.dialog"
        >
          <DialogHeader>
            <DialogTitle>Create Month Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/40 px-4 py-2.5 text-sm font-medium">
              {MONTH_NAMES[month - 1]} {year}
            </div>
            <div className="space-y-1.5">
              <Label>Link to Goal (optional)</Label>
              <Select
                value={planLinkedGoalId}
                onValueChange={setPlanLinkedGoalId}
              >
                <SelectTrigger data-ocid="monthly.create_plan.goal.select">
                  <SelectValue placeholder="No goal linked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No goal linked</SelectItem>
                  {(goals ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreatePlanModal(false)}
              data-ocid="monthly.create_plan.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlan}
              disabled={createPlan.isPending}
              className="gradient-primary text-white border-0"
              data-ocid="monthly.create_plan.submit_button"
            >
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Modal */}
      <Dialog open={addTaskModal} onOpenChange={setAddTaskModal}>
        <DialogContent className="sm:max-w-md" data-ocid="monthly.task.dialog">
          <DialogHeader>
            <DialogTitle>Add Monthly Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Complete React course"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm((p) => ({ ...p, title: e.target.value }))
                }
                data-ocid="monthly.task.input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Details..."
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm((p) => ({ ...p, description: e.target.value }))
                }
                data-ocid="monthly.task.textarea"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Week</Label>
                <Select
                  value={String(taskForm.weekNumber)}
                  onValueChange={(v) =>
                    setTaskForm((p) => ({ ...p, weekNumber: Number(v) }))
                  }
                >
                  <SelectTrigger data-ocid="monthly.task.week.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: weeksCount }, (_, i) => i + 1).map(
                      (w) => (
                        <SelectItem key={w} value={String(w)}>
                          Week {w}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(v) =>
                    setTaskForm((p) => ({ ...p, priority: v }))
                  }
                >
                  <SelectTrigger data-ocid="monthly.task.priority.select">
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
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={taskForm.deadline}
                  onChange={(e) =>
                    setTaskForm((p) => ({ ...p, deadline: e.target.value }))
                  }
                  data-ocid="monthly.task.deadline.input"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="task-frog"
                checked={taskForm.isFrog}
                onCheckedChange={(v) =>
                  setTaskForm((p) => ({ ...p, isFrog: !!v }))
                }
                data-ocid="monthly.task.frog.checkbox"
              />
              <Label htmlFor="task-frog" className="cursor-pointer">
                🐸 Mark as "Eat That Frog" task for this week
              </Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddTaskModal(false)}
                data-ocid="monthly.task.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTask.isPending}
                className="gradient-primary text-white border-0"
                data-ocid="monthly.task.submit_button"
              >
                Add Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Task Confirm */}
      <AlertDialog
        open={!!deleteTaskId}
        onOpenChange={(o) => !o && setDeleteTaskId(null)}
      >
        <AlertDialogContent data-ocid="monthly.delete_task.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="monthly.delete_task.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              data-ocid="monthly.delete_task.confirm_button"
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Plan Confirm */}
      <AlertDialog
        open={deletePlanConfirm}
        onOpenChange={(o) => !o && setDeletePlanConfirm(false)}
      >
        <AlertDialogContent data-ocid="monthly.delete_plan.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Month Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the plan for {MONTH_NAMES[month - 1]} {year}. All
              tasks will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="monthly.delete_plan.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              data-ocid="monthly.delete_plan.confirm_button"
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- Linked Goal Banner ----
function LinkedGoalBanner({
  goal,
  goals,
  onChangeGoal,
  isPending,
}: {
  goal: Entity__3;
  goals: Entity__3[];
  onChangeGoal: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5">
      <Link2 className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">Linked Goal</p>
        <p className="text-sm font-semibold truncate">{goal.title}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <CategoryBadge category={goal.category} />
        <Badge
          variant="outline"
          className="text-xs border-primary/30 text-primary"
        >
          {goal.priority}
        </Badge>
        <Select onValueChange={onChangeGoal} disabled={isPending}>
          <SelectTrigger
            className="w-28 h-7 text-xs"
            data-ocid="monthly.change_goal.select"
          >
            <SelectValue placeholder="Change" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unlink</SelectItem>
            {goals
              .filter((g) => g.id !== goal.id)
              .map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ---- Task Row ----
function TaskRow({
  task,
  index,
  today,
  onDelete,
  onToggleComplete,
  onToggleFrog,
}: {
  task: Entity__1;
  index: number;
  today: string;
  onDelete: () => void;
  onToggleComplete: () => void;
  onToggleFrog: () => void;
}) {
  const isOverdue = task.deadline && task.deadline < today && !task.completed;
  const isToday = task.deadline === today && !task.completed;

  let rowClass =
    "flex items-start gap-3 p-3 rounded-lg border bg-background group transition-all";
  if (task.isFrog) {
    rowClass +=
      " border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-transparent";
  } else if (isOverdue) {
    rowClass += " border-l-2 border-red-500 bg-red-500/5 border-border";
  } else if (isToday) {
    rowClass += " border-l-2 border-amber-400 bg-amber-400/5 border-border";
  } else {
    rowClass += " border-border";
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={rowClass}
      data-ocid={`monthly.task.item.${index + 1}`}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={onToggleComplete}
        className="mt-0.5 shrink-0"
        data-ocid={`monthly.task.checkbox.${index + 1}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {task.isFrog && (
            <span className="text-sm" title="Eat That Frog">
              🐸
            </span>
          )}
          <p
            className={`text-sm font-medium truncate ${
              task.completed ? "opacity-50 line-through" : ""
            }`}
          >
            {task.title}
          </p>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {task.description}
          </p>
        )}
        {task.deadline && (
          <p
            className={`text-xs mt-0.5 ${
              isOverdue
                ? "text-red-400"
                : isToday
                  ? "text-amber-400"
                  : "text-muted-foreground"
            }`}
          >
            {isOverdue ? "Overdue: " : isToday ? "Due today: " : "Due: "}
            {task.deadline}
          </p>
        )}
      </div>
      <PriorityBadge priority={task.priority} />
      <button
        type="button"
        onClick={onToggleFrog}
        title={task.isFrog ? "Remove frog" : "Mark as Eat That Frog"}
        data-ocid={`monthly.task.toggle.${index + 1}`}
        className={`p-1.5 rounded-md text-sm transition-all ${
          task.isFrog
            ? "opacity-100 bg-emerald-500/10 text-emerald-500"
            : "opacity-0 group-hover:opacity-70 hover:opacity-100 text-muted-foreground hover:text-emerald-500"
        }`}
      >
        🐸
      </button>
      <button
        type="button"
        onClick={onDelete}
        data-ocid={`monthly.task.delete_button.${index + 1}`}
        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

// ---- Quick Add Task ----
function QuickAddTask({
  week,
  planId,
  onAdded,
}: {
  week: number;
  planId: string;
  onAdded: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateMonthTask();

  const handleAdd = async () => {
    const title = value.trim();
    if (!title) return;
    try {
      await createTask.mutateAsync({
        id: crypto.randomUUID(),
        monthPlanId: planId,
        title,
        description: "",
        priority: "Medium",
        deadline: "",
        weekNumber: week,
        completed: false,
        isFrog: false,
      });
      setValue("");
      onAdded();
      inputRef.current?.focus();
    } catch {
      toast.error("Failed to add task");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div
      className="flex items-center gap-2 mt-2"
      data-ocid={`monthly.week${week}.quick_add.panel`}
    >
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="+ Add a task..."
        className="h-8 text-sm bg-muted/30 border-dashed focus:border-solid"
        data-ocid={`monthly.week${week}.quick_add.input`}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleAdd}
        disabled={!value.trim() || createTask.isPending}
        className="h-8 px-3 shrink-0"
        data-ocid={`monthly.week${week}.quick_add.button`}
      >
        Add
      </Button>
    </div>
  );
}
