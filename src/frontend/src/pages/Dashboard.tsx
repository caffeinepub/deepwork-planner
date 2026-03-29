import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { addDays, format, startOfWeek, subDays } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  Plus,
  Target,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import CategoryBadge from "../components/CategoryBadge";
import CircularProgress from "../components/CircularProgress";
import PriorityBadge from "../components/PriorityBadge";
import {
  useDailyStats,
  useDayTasks,
  useMonthlyStats,
  useWeeklyStats,
} from "../hooks/useQueries";

const today = format(new Date(), "yyyy-MM-dd");
const weekStart = format(
  startOfWeek(new Date(), { weekStartsOn: 1 }),
  "yyyy-MM-dd",
);
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

function StatCard({
  title,
  icon: Icon,
  completed,
  total,
  color,
  loading,
}: {
  title: string;
  icon: React.ElementType;
  completed: number;
  total: number;
  color: string;
  loading: boolean;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <Card className="shadow-card card-hover border-border">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-bold mt-1">{pct}%</p>
            )}
          </div>
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-2 w-full" />
        ) : (
          <>
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1.5">
              {completed} / {total} tasks
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: dailyStats, isLoading: loadingDaily } = useDailyStats(today);
  const { data: weeklyStats, isLoading: loadingWeekly } =
    useWeeklyStats(weekStart);
  const { data: monthlyStats, isLoading: loadingMonthly } = useMonthlyStats(
    currentYear,
    currentMonth,
  );
  const { data: allTasks, isLoading: loadingTasks } = useDayTasks();

  const todayTasks = useMemo(() => {
    if (!allTasks) return [];
    const todayDow = new Date().getDay();
    // dayOfWeek: 1=Mon...7=Sun, getDay: 0=Sun,1=Mon...
    const dow = todayDow === 0 ? 7 : todayDow;
    return allTasks
      .filter((t) => t.weekStart === weekStart && Number(t.dayOfWeek) === dow)
      .sort((a, b) => Number(a.taskOrder) - Number(b.taskOrder));
  }, [allTasks]);

  // Build 7-day chart data
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayTasks =
        allTasks?.filter(
          (t) =>
            t.weekStart ===
            format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        ) ?? [];
      const dow = d.getDay() === 0 ? 7 : d.getDay();
      const dayFiltered = dayTasks.filter((t) => Number(t.dayOfWeek) === dow);
      const completed = dayFiltered.filter((t) => t.completed).length;
      const total = dayFiltered.length;
      return {
        date: format(d, "EEE"),
        completed,
        total,
        pct: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }, [allTasks]);

  const monthPct = monthlyStats?.total
    ? Math.round((monthlyStats.completed / monthlyStats.total) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <StatCard
            title="Today's Progress"
            icon={CheckCircle2}
            completed={dailyStats?.completed ?? 0}
            total={dailyStats?.total ?? 0}
            color="gradient-primary"
            loading={loadingDaily}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <StatCard
            title="This Week"
            icon={TrendingUp}
            completed={weeklyStats?.completed ?? 0}
            total={weeklyStats?.total ?? 0}
            color="bg-[oklch(var(--chart-2))]"
            loading={loadingWeekly}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            title="This Month"
            icon={Calendar}
            completed={monthlyStats?.completed ?? 0}
            total={monthlyStats?.total ?? 0}
            color="bg-[oklch(var(--chart-3))]"
            loading={loadingMonthly}
          />
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-card border-border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                7-Day Completion Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="oklch(0.565 0.215 262)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="oklch(0.565 0.215 262)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.922 0.012 260)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "oklch(0.55 0.015 260)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "oklch(0.55 0.015 260)" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid oklch(0.922 0.012 260)",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}%`, "Completion"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="pct"
                    stroke="oklch(0.565 0.215 262)"
                    strokeWidth={2}
                    fill="url(#colorPct)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Circular progress */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-card border-border h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Monthly Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              {loadingMonthly ? (
                <Skeleton className="h-28 w-28 rounded-full" />
              ) : (
                <CircularProgress
                  value={monthPct}
                  size={130}
                  sublabel={format(new Date(), "MMMM")}
                />
              )}
              <div className="mt-8 text-center">
                <p className="text-2xl font-bold">
                  {monthlyStats?.completed ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {monthlyStats?.total ?? 0} tasks done
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Today's tasks */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Today's Tasks
              </CardTitle>
              <Link to="/daily">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8"
                  data-ocid="dashboard.daily_link.button"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : todayTasks.length === 0 ? (
              <div
                className="text-center py-8"
                data-ocid="dashboard.tasks.empty_state"
              >
                <Target className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No tasks for today
                </p>
                <Link to="/daily">
                  <Button
                    size="sm"
                    className="mt-3 gradient-primary text-white border-0"
                    data-ocid="dashboard.add_tasks.button"
                  >
                    Plan your day
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2" data-ocid="dashboard.tasks.list">
                {todayTasks.map((task, i) => (
                  <div
                    key={task.id}
                    data-ocid={`dashboard.tasks.item.${i + 1}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border border-border transition-all ${
                      task.completed
                        ? "opacity-60 bg-muted/30"
                        : "bg-background"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                        task.completed
                          ? "bg-primary border-primary"
                          : "border-border"
                      }`}
                    />
                    <span
                      className={`flex-1 text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {task.title}
                    </span>
                    <CategoryBadge category={task.category} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
