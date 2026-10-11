import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "#/components/layout/app-shell.tsx";
import { AppUIProvider } from "#/components/ui/theme-provider.tsx";
import "../styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, refetchOnWindowFocus: false },
  },
});
export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <AppUIProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </AppUIProvider>
    </QueryClientProvider>
  ),
});
