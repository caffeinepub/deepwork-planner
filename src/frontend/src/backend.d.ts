import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Entity__2 {
    id: string;
    month: bigint;
    title: string;
    year: bigint;
    linkedGoalId: string;
}
export interface WeeklyStats {
    total: bigint;
    completed: bigint;
}
export interface Entity {
    id: string;
    title: string;
    dayOfWeek: bigint;
    createdAt: bigint;
    completed: boolean;
    taskOrder: bigint;
    category: string;
    priority: string;
    weekStart: string;
}
export interface DailyStats {
    total: bigint;
    completed: bigint;
}
export interface MonthlyTaskStats {
    total: bigint;
    completed: bigint;
}
export interface MonthlyStats {
    total: bigint;
    completed: bigint;
}
export interface Entity__3 {
    id: string;
    title: string;
    createdAt: bigint;
    description: string;
    category: string;
    priority: string;
}
export interface Entity__1 {
    id: string;
    title: string;
    monthPlanId: string;
    completed: boolean;
    description: string;
    isFrog: boolean;
    deadline: string;
    weekNumber: bigint;
    priority: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createDayTask(id: string, title: string, completed: boolean, taskOrder: bigint, category: string, priority: string, weekStart: string, dayOfWeek: bigint): Promise<void>;
    createGoal(id: string, title: string, description: string, category: string, priority: string): Promise<void>;
    createMonthPlan(id: string, year: bigint, month: bigint, title: string, linkedGoalId: string): Promise<void>;
    createMonthTask(id: string, monthPlanId: string, title: string, description: string, priority: string, deadline: string, weekNumber: bigint, completed: boolean, isFrog: boolean): Promise<void>;
    deleteDayTask(id: string): Promise<void>;
    deleteGoal(id: string): Promise<void>;
    deleteMonthPlan(id: string): Promise<void>;
    deleteMonthTask(id: string): Promise<void>;
    getAllDayTasks(): Promise<Array<Entity>>;
    getAllGoals(): Promise<Array<Entity__3>>;
    getAllMonthPlans(): Promise<Array<Entity__2>>;
    getAllMonthTasks(): Promise<Array<Entity__1>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyStats(date: string): Promise<DailyStats>;
    getDayTasksByWeek(weekStart: string): Promise<Array<Entity>>;
    getMonthlyStats(year: bigint, month: bigint): Promise<MonthlyStats>;
    getMonthlyTaskStats(year: bigint, month: bigint): Promise<MonthlyTaskStats>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeeklyStats(weekStart: string): Promise<WeeklyStats>;
    isCallerAdmin(): Promise<boolean>;
    reorderDayTasks(ids: Array<string>): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateDayTask(id: string, title: string, completed: boolean, taskOrder: bigint, category: string, priority: string, weekStart: string, dayOfWeek: bigint): Promise<void>;
    updateGoal(id: string, title: string, description: string, category: string, priority: string): Promise<void>;
    updateMonthPlan(id: string, year: bigint, month: bigint, title: string, linkedGoalId: string): Promise<void>;
    updateMonthTask(id: string, monthPlanId: string, title: string, description: string, priority: string, deadline: string, weekNumber: bigint, completed: boolean, isFrog: boolean): Promise<void>;
}
