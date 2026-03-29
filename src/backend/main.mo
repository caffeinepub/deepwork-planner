import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  module Goal {
    public type Entity = {
      id : Text;
      title : Text;
      description : Text;
      category : Text;
      priority : Text;
      createdAt : Int;
    };
  };

  module MonthPlan {
    public type Entity = {
      id : Text;
      year : Nat;
      month : Nat;
      title : Text;
      linkedGoalId : Text;
    };
  };

  module MonthTask {
    public type Entity = {
      id : Text;
      monthPlanId : Text;
      title : Text;
      description : Text;
      priority : Text;
      deadline : Text;
      weekNumber : Nat;
      completed : Bool;
      isFrog : Bool;
    };
  };

  module DayTask {
    public type Entity = {
      id : Text;
      title : Text;
      completed : Bool;
      taskOrder : Nat;
      category : Text;
      priority : Text;
      weekStart : Text;
      dayOfWeek : Nat;
      createdAt : Int;
    };

    public func compareByOrder(task1 : Entity, task2 : Entity) : Order.Order {
      Nat.compare(task1.taskOrder, task2.taskOrder);
    };
  };

  type DailyStats = {
    total : Nat;
    completed : Nat;
  };

  type WeeklyStats = {
    total : Nat;
    completed : Nat;
  };

  type MonthlyStats = {
    total : Nat;
    completed : Nat;
  };

  type MonthlyTaskStats = {
    total : Nat;
    completed : Nat;
  };

  public type UserProfile = {
    name : Text;
  };

  // Storage
  let userGoals = Map.empty<Principal, Map.Map<Text, Goal.Entity>>();
  let userMonthPlans = Map.empty<Principal, Map.Map<Text, MonthPlan.Entity>>();
  let userMonthTasks = Map.empty<Principal, Map.Map<Text, MonthTask.Entity>>();
  let userDayTasks = Map.empty<Principal, Map.Map<Text, DayTask.Entity>>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Helper functions
  func getUserGoalsMap(caller : Principal) : Map.Map<Text, Goal.Entity> {
    switch (userGoals.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, Goal.Entity>();
        userGoals.add(caller, newMap);
        newMap;
      };
      case (?goals) { goals };
    };
  };

  func getUserMonthPlansMap(caller : Principal) : Map.Map<Text, MonthPlan.Entity> {
    switch (userMonthPlans.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, MonthPlan.Entity>();
        userMonthPlans.add(caller, newMap);
        newMap;
      };
      case (?plans) { plans };
    };
  };

  func getUserMonthTasksMap(caller : Principal) : Map.Map<Text, MonthTask.Entity> {
    switch (userMonthTasks.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, MonthTask.Entity>();
        userMonthTasks.add(caller, newMap);
        newMap;
      };
      case (?tasks) { tasks };
    };
  };

  func getUserDayTasksMap(caller : Principal) : Map.Map<Text, DayTask.Entity> {
    switch (userDayTasks.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, DayTask.Entity>();
        userDayTasks.add(caller, newMap);
        newMap;
      };
      case (?tasks) { tasks };
    };
  };

  // User Profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Goal functions
  public shared ({ caller }) func createGoal(id : Text, title : Text, description : Text, category : Text, priority : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create goals");
    };
    let goals = getUserGoalsMap(caller);
    let newGoal : Goal.Entity = {
      id;
      title;
      description;
      category;
      priority;
      createdAt = Time.now();
    };
    goals.add(id, newGoal);
  };

  public shared ({ caller }) func updateGoal(id : Text, title : Text, description : Text, category : Text, priority : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update goals");
    };
    let goals = getUserGoalsMap(caller);
    if (not goals.containsKey(id)) { Runtime.trap("Goal not found") };
    let updatedGoal : Goal.Entity = {
      id;
      title;
      description;
      category;
      priority;
      createdAt = Time.now();
    };
    goals.add(id, updatedGoal);
  };

  public shared ({ caller }) func deleteGoal(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete goals");
    };
    let goals = getUserGoalsMap(caller);
    if (not goals.containsKey(id)) { Runtime.trap("Goal not found") };
    goals.remove(id);
  };

  public query ({ caller }) func getAllGoals() : async [Goal.Entity] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view goals");
    };
    getUserGoalsMap(caller).values().toArray();
  };

  // MonthPlan functions
  public shared ({ caller }) func createMonthPlan(id : Text, year : Nat, month : Nat, title : Text, linkedGoalId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create month plans");
    };
    let plans = getUserMonthPlansMap(caller);
    let newPlan : MonthPlan.Entity = {
      id;
      year;
      month;
      title;
      linkedGoalId;
    };
    plans.add(id, newPlan);
  };

  public shared ({ caller }) func updateMonthPlan(id : Text, year : Nat, month : Nat, title : Text, linkedGoalId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update month plans");
    };
    let plans = getUserMonthPlansMap(caller);
    if (not plans.containsKey(id)) { Runtime.trap("Month plan not found") };
    let updatedPlan : MonthPlan.Entity = {
      id;
      year;
      month;
      title;
      linkedGoalId;
    };
    plans.add(id, updatedPlan);
  };

  public shared ({ caller }) func deleteMonthPlan(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete month plans");
    };
    let plans = getUserMonthPlansMap(caller);
    if (not plans.containsKey(id)) { Runtime.trap("Month plan not found") };
    plans.remove(id);
  };

  public query ({ caller }) func getAllMonthPlans() : async [MonthPlan.Entity] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view month plans");
    };
    getUserMonthPlansMap(caller).values().toArray();
  };

  // MonthTask functions
  public shared ({ caller }) func createMonthTask(id : Text, monthPlanId : Text, title : Text, description : Text, priority : Text, deadline : Text, weekNumber : Nat, completed : Bool, isFrog : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create month tasks");
    };
    let tasks = getUserMonthTasksMap(caller);
    let newTask : MonthTask.Entity = {
      id;
      monthPlanId;
      title;
      description;
      priority;
      deadline;
      weekNumber;
      completed;
      isFrog;
    };
    tasks.add(id, newTask);
  };

  public shared ({ caller }) func updateMonthTask(id : Text, monthPlanId : Text, title : Text, description : Text, priority : Text, deadline : Text, weekNumber : Nat, completed : Bool, isFrog : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update month tasks");
    };
    let tasks = getUserMonthTasksMap(caller);
    if (not tasks.containsKey(id)) { Runtime.trap("Month task not found") };
    let updatedTask : MonthTask.Entity = {
      id;
      monthPlanId;
      title;
      description;
      priority;
      deadline;
      weekNumber;
      completed;
      isFrog;
    };
    tasks.add(id, updatedTask);
  };

  public shared ({ caller }) func deleteMonthTask(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete month tasks");
    };
    let tasks = getUserMonthTasksMap(caller);
    if (not tasks.containsKey(id)) { Runtime.trap("Month task not found") };
    tasks.remove(id);
  };

  public query ({ caller }) func getAllMonthTasks() : async [MonthTask.Entity] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view month tasks");
    };
    getUserMonthTasksMap(caller).values().toArray();
  };

  // DayTask functions
  public shared ({ caller }) func createDayTask(id : Text, title : Text, completed : Bool, taskOrder : Nat, category : Text, priority : Text, weekStart : Text, dayOfWeek : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create day tasks");
    };
    let tasks = getUserDayTasksMap(caller);
    let newTask : DayTask.Entity = {
      id;
      title;
      completed;
      taskOrder;
      category;
      priority;
      weekStart;
      dayOfWeek;
      createdAt = Time.now();
    };
    tasks.add(id, newTask);
  };

  public shared ({ caller }) func updateDayTask(id : Text, title : Text, completed : Bool, taskOrder : Nat, category : Text, priority : Text, weekStart : Text, dayOfWeek : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update day tasks");
    };
    let tasks = getUserDayTasksMap(caller);
    if (not tasks.containsKey(id)) { Runtime.trap("Day task not found") };
    let updatedTask : DayTask.Entity = {
      id;
      title;
      completed;
      taskOrder;
      category;
      priority;
      weekStart;
      dayOfWeek;
      createdAt = Time.now();
    };
    tasks.add(id, updatedTask);
  };

  public shared ({ caller }) func deleteDayTask(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete day tasks");
    };
    let tasks = getUserDayTasksMap(caller);
    if (not tasks.containsKey(id)) { Runtime.trap("Day task not found") };
    tasks.remove(id);
  };

  public query ({ caller }) func getAllDayTasks() : async [DayTask.Entity] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view day tasks");
    };
    getUserDayTasksMap(caller).values().toArray().sort(DayTask.compareByOrder);
  };

  // Additional functions
  public query ({ caller }) func getDayTasksByWeek(weekStart : Text) : async [DayTask.Entity] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view day tasks");
    };
    getUserDayTasksMap(caller)
      .entries()
      .toArray()
      .map(func((_, task)) { task })
      .filter(func(task) { task.weekStart == weekStart })
      .sort(DayTask.compareByOrder);
  };

  public shared ({ caller }) func reorderDayTasks(ids : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reorder day tasks");
    };
    let tasks = getUserDayTasksMap(caller);
    for ((newOrder, id) in ids.enumerate()) {
      switch (tasks.get(id)) {
        case (?task) {
          tasks.add(id, { task with taskOrder = newOrder });
        };
        case (null) {};
      };
    };
  };

  public query ({ caller }) func getDailyStats(date : Text) : async DailyStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };
    let tasks = getUserDayTasksMap(caller);
    let filteredTasks = tasks.entries().filter(func(_, task) { task.category == date });
    let stats = filteredTasks.foldLeft(
      { total = 0; completed = 0 },
      func(acc, (_, task)) {
        {
          total = acc.total + 1;
          completed = acc.completed + (if (task.completed) { 1 } else { 0 });
        };
      },
    );
    stats;
  };

  public query ({ caller }) func getWeeklyStats(weekStart : Text) : async WeeklyStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };
    let tasks = getUserDayTasksMap(caller);
    let filteredTasks = tasks.entries().filter(func(_, task) { task.weekStart == weekStart });
    let stats = filteredTasks.foldLeft(
      { total = 0; completed = 0 },
      func(acc, (_, task)) {
        {
          total = acc.total + 1;
          completed = acc.completed + (if (task.completed) { 1 } else { 0 });
        };
      },
    );
    stats;
  };

  public query ({ caller }) func getMonthlyStats(year : Nat, month : Nat) : async MonthlyStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };
    let tasks = getUserDayTasksMap(caller);
    let filteredTasks = tasks.entries().filter(func(_, task) { task.category == (year.toText() # "-" # month.toText()) });
    let stats = filteredTasks.foldLeft(
      { total = 0; completed = 0 },
      func(acc, (_, task)) {
        {
          total = acc.total + 1;
          completed = acc.completed + (if (task.completed) { 1 } else { 0 });
        };
      },
    );
    stats;
  };

  public query ({ caller }) func getMonthlyTaskStats(year : Nat, month : Nat) : async MonthlyTaskStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };
    let monthPlans = getUserMonthPlansMap(caller);

    let matchingPlansCount = monthPlans.entries().filter(
      func(_, plan) {
        plan.year == year and plan.month == month
      }
    ).size();

    let matchingPlanIds = monthPlans.entries().toArray().map(func((_, plan)) { plan }).filter(
      func(plan) {
        plan.year == year and plan.month == month
      }
    ).map(func(plan) { plan.id });

    let monthTasks = getUserMonthTasksMap(caller);
    let matchingTasksCount = monthTasks.entries().toArray().map(func((_, task)) { task }).filter(
      func(task) {
        matchingPlanIds.values().any(func(id) { id == task.monthPlanId });
      }
    ).size();
    let completedTasksCount = monthTasks.entries().toArray().map(func((_, task)) { task }).filter(
      func(task) {
        matchingPlanIds.values().any(func(id) { id == task.monthPlanId }) and task.completed;
      }
    ).size();

    {
      total = matchingTasksCount;
      completed = completedTasksCount;
    };
  };
};
