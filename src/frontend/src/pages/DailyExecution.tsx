import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Entity } from "../backend.d.ts";
import CategoryBadge from "../components/CategoryBadge";
import PriorityBadge from "../components/PriorityBadge";
import {
  useCreateDayTask,
  useDayTasksByWeek,
  useDeleteDayTask,
  useUpdateDayTask,
  useWeeklyStats,
} from "../hooks/useQueries";

const DAYS = [
  { label: "Mon", fullLabel: "Monday", dow: 1 },
  { label: "Tue", fullLabel: "Tuesday", dow: 2 },
  { label: "Wed", fullLabel: "Wednesday", dow: 3 },
  { label: "Thu", fullLabel: "Thursday", dow: 4 },
  { label: "Fri", fullLabel: "Friday", dow: 5 },
  { label: "Sat", fullLabel: "Saturday", dow: 6 },
  { label: "Sun", fullLabel: "Sunday", dow: 7 },
];

const CATEGORIES = ["Study", "Coding", "Health", "Career", "Fitness", "Other"];
const PRIORITIES = ["High", "Medium", "Low"];

type AddForm = { title: string; category: string; priority: string };
const emptyForm = (): AddForm => ({
  title: "",
  category: "Other",
  priority: "Medium",
});

export default function DailyExecution() {
  const [weekBase, setWeekBase] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const weekStart = format(weekBase, "yyyy-MM-dd");

  const { data: tasks, isLoading } = useDayTasksByWeek(weekStart);
  const createTask = useCreateDayTask();
  const updateTask = useUpdateDayTask();
  const deleteTask = useDeleteDayTask();
  const { data: weekStats } = useWeeklyStats(weekStart);

  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [addForm, setAddForm] = useState<AddForm>(emptyForm());

  // Drag state
  const [draggedTask, setDraggedTask] = useState<Entity | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  const weekPct = weekStats?.total
    ? Math.round((weekStats.completed / weekStats.total) * 100)
    : 0;

  const tasksByDay = useMemo(() => {
    const map: Record<number, Entity[]> = {};
    for (const d of DAYS) {
      map[d.dow] = [];
    }
    for (const t of tasks ?? []) {
      const dow = Number(t.dayOfWeek);
      if (map[dow]) map[dow].push(t);
    }
    for (const d of DAYS) {
      map[d.dow].sort((a, b) => Number(a.taskOrder) - Number(b.taskOrder));
    }
    return map;
  }, [tasks]);

  const todayDow = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  }, []);

  const handleToggle = async (task: Entity) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        title: task.title,
        completed: !task.completed,
        taskOrder: Number(task.taskOrder),
        category: task.category,
        priority: task.priority,
        weekStart: task.weekStart,
        dayOfWeek: Number(task.dayOfWeek),
      });
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleAddTask = async (dow: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title.trim()) return;
    const dayTasks = tasksByDay[dow] ?? [];
    try {
      await createTask.mutateAsync({
        id: crypto.randomUUID(),
        title: addForm.title,
        completed: false,
        taskOrder: dayTasks.length,
        category: addForm.category,
        priority: addForm.priority,
        weekStart,
        dayOfWeek: dow,
      });
      setAddingDay(null);
      setAddForm(emptyForm());
    } catch {
      toast.error("Failed to add task");
    }
  };

  // Drag handlers
  const handleDragStart = (task: Entity) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, dow: number) => {
    e.preventDefault();
    setDragOverDay(dow);
  };

  const handleDrop = async (e: React.DragEvent, targetDow: number) => {
    e.preventDefault();
    setDragOverDay(null);
    if (!draggedTask) return;
    if (Number(draggedTask.dayOfWeek) === targetDow) return;
    const targetTasks = tasksByDay[targetDow] ?? [];
    try {
      await updateTask.mutateAsync({
        id: draggedTask.id,
        title: draggedTask.title,
        completed: draggedTask.completed,
        taskOrder: targetTasks.length,
        category: draggedTask.category,
        priority: draggedTask.priority,
        weekStart: draggedTask.weekStart,
        dayOfWeek: targetDow,
      });
      toast.success("Task moved");
    } catch {
      toast.error("Failed to move task");
    } finally {
      setDraggedTask(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverDay(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Daily Execution</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Focus. Execute. Ship.
          </p>
        </div>
      </div>

      {/* Week Nav */}
      <Card className="shadow-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setWeekBase((w) => subWeeks(w, 1))}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              data-ocid="daily.prev.button"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <p className="font-semibold text-sm">
                Week of {format(weekBase, "MMM d")} –{" "}
                {format(addDays(weekBase, 6), "MMM d, yyyy")}
              </p>
              {weekStats && (
                <div className="flex items-center gap-2 mt-1.5 justify-center">
                  <Progress value={weekPct} className="h-1.5 w-28" />
                  <span className="text-xs text-muted-foreground">
                    {weekStats.completed}/{weekStats.total} done
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setWeekBase((w) => addWeeks(w, 1))}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              data-ocid="daily.next.button"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Day Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {DAYS.map((day) => {
          const dayTasks = tasksByDay[day.dow] ?? [];
          const completed = dayTasks.filter((t) => t.completed).length;
          const isToday =
            day.dow === todayDow &&
            format(weekBase, "yyyy-MM-dd") ===
              format(
                startOfWeek(new Date(), { weekStartsOn: 1 }),
                "yyyy-MM-dd",
              );
          const isDragOver = dragOverDay === day.dow;
          const date = addDays(weekBase, day.dow - 1);

          return (
            <motion.div
              key={day.dow}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (day.dow - 1) * 0.04 }}
              data-ocid={`daily.day.item.${day.dow}`}
            >
              <div
                className={`rounded-xl border-2 transition-all min-h-[280px] flex flex-col ${
                  isDragOver
                    ? "border-primary bg-accent/40"
                    : isToday
                      ? "border-primary/40 bg-card shadow-card"
                      : "border-border bg-card shadow-card"
                }`}
                onDragOver={(e) => handleDragOver(e, day.dow)}
                onDrop={(e) => handleDrop(e, day.dow)}
                onDragLeave={() => setDragOverDay(null)}
              >
                {/* Day header */}
                <div
                  className={`px-3 py-3 border-b border-border ${
                    isToday ? "gradient-primary rounded-t-[10px]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-xs font-semibold ${isToday ? "text-white" : "text-muted-foreground"}`}
                      >
                        {day.label}
                      </p>
                      <p
                        className={`text-sm font-bold ${isToday ? "text-white" : ""}`}
                      >
                        {format(date, "d")}
                      </p>
                    </div>
                    {dayTasks.length > 0 && (
                      <span
                        className={`text-xs font-medium ${
                          isToday ? "text-white/80" : "text-muted-foreground"
                        }`}
                      >
                        {completed}/{dayTasks.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tasks */}
                <div className="flex-1 p-2 space-y-1.5">
                  {isLoading ? (
                    <div className="space-y-1.5">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <AnimatePresence>
                      {dayTasks.map((task, ti) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          onDragEnd={handleDragEnd}
                          data-ocid={`daily.task.item.${ti + 1}`}
                          className={`group p-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                            task.completed
                              ? "bg-muted/40 border-border opacity-60"
                              : "bg-background border-border hover:border-primary/40 hover:shadow-xs"
                          } ${draggedTask?.id === task.id ? "opacity-40" : ""}`}
                        >
                          <div className="flex items-start gap-1.5">
                            <GripVertical className="h-3 w-3 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => handleToggle(task)}
                              data-ocid={`daily.task.checkbox.${ti + 1}`}
                              className="mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs font-medium leading-tight ${
                                  task.completed
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }`}
                              >
                                {task.title}
                              </p>
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                <CategoryBadge category={task.category} />
                                <PriorityBadge priority={task.priority} />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDelete(task.id)}
                              data-ocid={`daily.task.delete_button.${ti + 1}`}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}

                  {/* Inline add form */}
                  {addingDay === day.dow ? (
                    <form
                      onSubmit={(e) => handleAddTask(day.dow, e)}
                      className="space-y-1.5 pt-1"
                    >
                      <Input
                        autoFocus
                        placeholder="Task title..."
                        value={addForm.title}
                        onChange={(e) =>
                          setAddForm((p) => ({ ...p, title: e.target.value }))
                        }
                        className="h-7 text-xs"
                        data-ocid={`daily.day${day.dow}.task.input`}
                      />
                      <div className="grid grid-cols-2 gap-1">
                        <Select
                          value={addForm.category}
                          onValueChange={(v) =>
                            setAddForm((p) => ({ ...p, category: v }))
                          }
                        >
                          <SelectTrigger
                            className="h-6 text-xs"
                            data-ocid={`daily.day${day.dow}.task.category.select`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c} className="text-xs">
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={addForm.priority}
                          onValueChange={(v) =>
                            setAddForm((p) => ({ ...p, priority: v }))
                          }
                        >
                          <SelectTrigger
                            className="h-6 text-xs"
                            data-ocid={`daily.day${day.dow}.task.priority.select`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITIES.map((p) => (
                              <SelectItem key={p} value={p} className="text-xs">
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="submit"
                          size="sm"
                          className="h-6 text-xs flex-1 gradient-primary text-white border-0"
                          data-ocid={`daily.day${day.dow}.task.submit_button`}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => {
                            setAddingDay(null);
                            setAddForm(emptyForm());
                          }}
                          data-ocid={`daily.day${day.dow}.task.cancel_button`}
                        >
                          ✕
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingDay(day.dow);
                        setAddForm(emptyForm());
                      }}
                      data-ocid={`daily.day${day.dow}.add.button`}
                      className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mt-1"
                    >
                      <Plus className="h-3 w-3" /> Add task
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Built with love using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
