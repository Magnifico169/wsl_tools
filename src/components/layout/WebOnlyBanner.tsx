import { Monitor } from "lucide-react";
import { isTauriApp } from "@/lib/tauri-env";

export function WebOnlyBanner() {
  if (isTauriApp()) {
    return null;
  }

  return (
    <div
      className="mb-4 flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
      role="status"
    >
      <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div>
        <p className="font-medium text-amber-900 dark:text-amber-100">
          Режим предпросмотра в браузере
        </p>
        <p className="mt-1 text-amber-800/90 dark:text-amber-200/80">
          WSL доступен только в десктоп-приложении. Запустите в PowerShell:{" "}
          <code className="rounded bg-amber-500/15 px-1 font-mono text-xs">
            npm run dev
          </code>{" "}
          (не <code className="rounded bg-amber-500/15 px-1 font-mono text-xs">dev:web</code>
          ).
        </p>
      </div>
    </div>
  );
}
