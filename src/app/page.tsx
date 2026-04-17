import { getDashboardData } from "@/lib/lead-service";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { leads, dashboard, aiInsights } = getDashboardData();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Dashboard data={dashboard} leads={leads} aiInsights={aiInsights} />
      </div>
    </main>
  );
}
