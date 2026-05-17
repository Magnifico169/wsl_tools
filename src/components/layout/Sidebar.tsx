import { HardDrive, Network, ScrollText, Settings, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export type PageId = "distros" | "config" | "network" | "logs";

const items: { id: PageId; label: string; icon: React.ElementType }[] = [
  { id: "distros", label: "Дистрибутивы", icon: Terminal },
  { id: "config", label: "Конфиг", icon: Settings },
  { id: "network", label: "Сеть", icon: Network },
  { id: "logs", label: "Логи", icon: ScrollText },
];

interface SidebarProps {
  active: PageId;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside className="flex w-52 flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-4">
        <HardDrive className="h-6 w-6 text-[var(--color-primary)]" />
        <span className="font-semibold">WSL Tools</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              active === id
                ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-medium"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
