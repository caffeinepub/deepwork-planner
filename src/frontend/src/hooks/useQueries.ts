import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Entity,
  Entity__1,
  Entity__2,
  Entity__3,
  UserProfile,
} from "../backend.d.ts";
import { useActor as useActorHook } from "./useActor";

export { useActorHook as useActor };

// ---- Goals ----
export function useGoals() {
  const { actor, isFetching } = useActorHook();
  return useQuery<Entity__3[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGoals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateGoal() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      description: string;
      category: string;
      priority: string;
    }) => {
      await actor!.createGoal(
        data.id,
        data.title,
        data.description,
        data.category,
        data.priority,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useUpdateGoal() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      description: string;
      category: string;
      priority: string;
    }) => {
      await actor!.updateGoal(
        data.id,
        data.title,
        data.description,
        data.category,
        data.priority,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useDeleteGoal() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await actor!.deleteGoal(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

// ---- Month Plans ----
export function useMonthPlans() {
  const { actor, isFetching } = useActorHook();
  return useQuery<Entity__2[]>({
    queryKey: ["monthPlans"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMonthPlans();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateMonthPlan() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      year: number;
      month: number;
      title: string;
      linkedGoalId: string;
    }) => {
      await actor!.createMonthPlan(
        data.id,
        BigInt(data.year),
        BigInt(data.month),
        data.title,
        data.linkedGoalId,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monthPlans"] }),
  });
}

export function useUpdateMonthPlan() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      year: number;
      month: number;
      title: string;
      linkedGoalId: string;
    }) => {
      await actor!.updateMonthPlan(
        data.id,
        BigInt(data.year),
        BigInt(data.month),
        data.title,
        data.linkedGoalId,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monthPlans"] }),
  });
}

export function useDeleteMonthPlan() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await actor!.deleteMonthPlan(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monthPlans"] }),
  });
}

// ---- Month Tasks ----
export function useMonthTasks() {
  const { actor, isFetching } = useActorHook();
  return useQuery<Entity__1[]>({
    queryKey: ["monthTasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMonthTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateMonthTask() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      monthPlanId: string;
      title: string;
      description: string;
      priority: string;
      deadline: string;
      weekNumber: number;
      completed: boolean;
      isFrog: boolean;
    }) => {
      await actor!.createMonthTask(
        data.id,
        data.monthPlanId,
        data.title,
        data.description,
        data.priority,
        data.deadline,
        BigInt(data.weekNumber),
        data.completed,
        data.isFrog,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monthTasks"] }),
  });
}

export function useDeleteMonthTask() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await actor!.deleteMonthTask(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monthTasks"] }),
  });
}

export function useUpdateMonthTask() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      monthPlanId: string;
      title: string;
      description: string;
      priority: string;
      deadline: string;
      weekNumber: number;
      completed: boolean;
      isFrog: boolean;
    }) => {
      await actor!.updateMonthTask(
        data.id,
        data.monthPlanId,
        data.title,
        data.description,
        data.priority,
        data.deadline,
        BigInt(data.weekNumber),
        data.completed,
        data.isFrog,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monthTasks"] }),
  });
}

// ---- Day Tasks ----
export function useDayTasks() {
  const { actor, isFetching } = useActorHook();
  return useQuery<Entity[]>({
    queryKey: ["dayTasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDayTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDayTasksByWeek(weekStart: string) {
  const { actor, isFetching } = useActorHook();
  return useQuery<Entity[]>({
    queryKey: ["dayTasks", "week", weekStart],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDayTasksByWeek(weekStart);
    },
    enabled: !!actor && !isFetching && !!weekStart,
  });
}

export function useCreateDayTask() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      completed: boolean;
      taskOrder: number;
      category: string;
      priority: string;
      weekStart: string;
      dayOfWeek: number;
    }) => {
      await actor!.createDayTask(
        data.id,
        data.title,
        data.completed,
        BigInt(data.taskOrder),
        data.category,
        data.priority,
        data.weekStart,
        BigInt(data.dayOfWeek),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dayTasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateDayTask() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      completed: boolean;
      taskOrder: number;
      category: string;
      priority: string;
      weekStart: string;
      dayOfWeek: number;
    }) => {
      await actor!.updateDayTask(
        data.id,
        data.title,
        data.completed,
        BigInt(data.taskOrder),
        data.category,
        data.priority,
        data.weekStart,
        BigInt(data.dayOfWeek),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dayTasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeleteDayTask() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await actor!.deleteDayTask(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dayTasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useReorderDayTasks() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await actor!.reorderDayTasks(ids);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dayTasks"] }),
  });
}

// ---- Stats ----
export function useDailyStats(date: string) {
  const { actor, isFetching } = useActorHook();
  return useQuery({
    queryKey: ["stats", "daily", date],
    queryFn: async () => {
      if (!actor) return { total: 0, completed: 0 };
      const r = await actor.getDailyStats(date);
      return { total: Number(r.total), completed: Number(r.completed) };
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useWeeklyStats(weekStart: string) {
  const { actor, isFetching } = useActorHook();
  return useQuery({
    queryKey: ["stats", "weekly", weekStart],
    queryFn: async () => {
      if (!actor) return { total: 0, completed: 0 };
      const r = await actor.getWeeklyStats(weekStart);
      return { total: Number(r.total), completed: Number(r.completed) };
    },
    enabled: !!actor && !isFetching && !!weekStart,
  });
}

export function useMonthlyStats(year: number, month: number) {
  const { actor, isFetching } = useActorHook();
  return useQuery({
    queryKey: ["stats", "monthly", year, month],
    queryFn: async () => {
      if (!actor) return { total: 0, completed: 0 };
      const r = await actor.getMonthlyStats(BigInt(year), BigInt(month));
      return { total: Number(r.total), completed: Number(r.completed) };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMonthlyTaskStats(year: number, month: number) {
  const { actor, isFetching } = useActorHook();
  return useQuery({
    queryKey: ["stats", "monthlyTasks", year, month],
    queryFn: async () => {
      if (!actor) return { total: 0, completed: 0 };
      const r = await actor.getMonthlyTaskStats(BigInt(year), BigInt(month));
      return { total: Number(r.total), completed: Number(r.completed) };
    },
    enabled: !!actor && !isFetching,
  });
}

// ---- User Profile ----
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActorHook();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveUserProfile() {
  const { actor } = useActorHook();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      await actor!.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUserProfile"] }),
  });
}
