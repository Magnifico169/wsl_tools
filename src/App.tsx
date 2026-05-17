import { useState } from "react";
import { WebOnlyBanner } from "@/components/layout/WebOnlyBanner";
import { Sidebar, type PageId } from "@/components/layout/Sidebar";
import { ConfigPage } from "@/pages/ConfigPage";
import { DistrosPage } from "@/pages/DistrosPage";
import { LogsPage } from "@/pages/LogsPage";
import { NetworkPage } from "@/pages/NetworkPage";

function PageContent({ page }: { page: PageId }) {
  switch (page) {
    case "distros":
      return <DistrosPage />;
    case "config":
      return <ConfigPage />;
    case "network":
      return <NetworkPage />;
    case "logs":
      return <LogsPage />;
  }
}

export default function App() {
  const [page, setPage] = useState<PageId>("distros");

  return (
    <div className="flex min-h-screen">
      <Sidebar active={page} onNavigate={setPage} />
      <main className="flex-1 overflow-auto p-6">
        <WebOnlyBanner />
        <PageContent page={page} />
      </main>
    </div>
  );
}
