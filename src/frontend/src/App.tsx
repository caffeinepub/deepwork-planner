import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useLocation,
} from "@tanstack/react-router";
import {
  Calendar,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Sun,
  Target,
  X,
  Zap,
} from "lucide-react";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState } from "react";
import ProfileSetup from "./components/ProfileSetup";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useActor, useGetCallerUserProfile } from "./hooks/useQueries";
import DailyExecution from "./pages/DailyExecution";
import Dashboard from "./pages/Dashboard";
import MasterPlan from "./pages/MasterPlan";
import MonthlyPlanner from "./pages/MonthlyPlanner";

// ---- Sidebar ----
const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/master-plan", label: "Master Plan", icon: Target },
  { path: "/monthly", label: "Monthly Planner", icon: Calendar },
  { path: "/daily", label: "Daily Execution", icon: Zap },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: profile } = useGetCallerUserProfile();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
          onKeyDown={onClose}
          role="presentation"
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-sidebar border-r border-sidebar-border z-40 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">DeepWork</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto lg:hidden text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User */}
        {profile && (
          <div className="px-5 py-3 border-b border-sidebar-border">
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <p className="text-sm font-semibold truncate">{profile.name}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                data-ocid={`nav.${item.label.toLowerCase().replace(" ", "_")}.link`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full gradient-primary" />
                )}
                <item.icon
                  className={`h-4 w-4 ${active ? "text-primary" : ""}`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-5 space-y-1 border-t border-sidebar-border pt-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            data-ocid="nav.logout.button"
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}

function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:pl-60 min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur border-b border-border lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded gradient-primary flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-sm">DeepWork</span>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ---- Auth + Profile wrapper ----
function AuthenticatedApp() {
  const { actor } = useActor();
  const { data: profile, isLoading, isFetched } = useGetCallerUserProfile();
  const { identity } = useInternetIdentity();

  const showSetup = !!identity && !!actor && isFetched && profile === null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {showSetup && <ProfileSetup />}
      <RouterProvider router={router} />
    </>
  );
}

function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">DeepWork</h1>
          <p className="text-muted-foreground text-sm">
            Your personal deep work planning system
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <h2 className="text-xl font-semibold mb-2">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to access your personal workspace
          </p>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="login.primary_button"
            className="w-full gradient-primary text-white border-0 h-11 font-semibold"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Secured with Internet Identity
          </p>
        </div>
      </div>
    </div>
  );
}

function AppWithAuth() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;
  return <AuthenticatedApp />;
}

// ---- Router ----
const rootRoute = createRootRoute({ component: RootLayout });
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});
const masterPlanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/master-plan",
  component: MasterPlan,
});
const monthlyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/monthly",
  component: MonthlyPlanner,
});
const dailyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/daily",
  component: DailyExecution,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  masterPlanRoute,
  monthlyRoute,
  dailyRoute,
]);
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppWithAuth />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
