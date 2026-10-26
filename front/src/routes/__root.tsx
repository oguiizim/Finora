import { Navigate, Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "#/components/layout/app-shell.tsx";
import { AppUIProvider } from "#/components/ui/theme-provider.tsx";
import { AuthProvider, useAuth } from "#/components/auth/auth-provider.tsx";
import "../styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, refetchOnWindowFocus: false },
  },
});
export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider><AppUIProvider><RouteLayout /></AppUIProvider></AuthProvider>
    </QueryClientProvider>
  ),
});

function RouteLayout() {
  const { isAuthenticated } = useAuth();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const isPublic = path === "/login" || path === "/cadastro";
  if (isPublic) return isAuthenticated ? <Navigate to="/" /> : <Outlet />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <AppShell><Outlet /></AppShell>;
}
