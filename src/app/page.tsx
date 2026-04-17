import { getDashboardData } from "@/lib/lead-service";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const { leads, dashboard, aiInsights } = getDashboardData();

    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <Dashboard data={dashboard} leads={leads} aiInsights={aiInsights} />
        </div>
      </main>
    );
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-bold text-foreground">Error al cargar datos</h1>
          <p className="text-sm text-muted-foreground">
            No se pudo cargar el archivo de datos. Verificá que <code className="bg-muted px-1.5 py-0.5 rounded text-xs">data/leads.json</code> exista.
          </p>
        </div>
      </main>
    );
  }
}
