import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { save } from "@tauri-apps/plugin-dialog";
import { RefreshCw, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { showErrorToast } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConsoleBlock } from "@/components/shared/ConsoleBlock";
import { toast } from "@/hooks/use-toast";
import { isTauriApp } from "@/lib/tauri-env";

export function LogsPage() {
  const queryClient = useQueryClient();

  const inApp = isTauriApp();

  const { data: logs = [], refetch, isFetching } = useQuery({
    queryKey: queryKeys.logs,
    queryFn: api.getLogs,
    refetchInterval: inApp ? 3000 : false,
    enabled: inApp,
  });

  const { data: diagnostics } = useQuery({
    queryKey: queryKeys.diagnostics,
    queryFn: api.getDiagnostics,
    enabled: inApp,
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await api.clearLogs();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.logs });
      toast({ title: "Логи очищены" });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const path = await save({
        defaultPath: "wsl-tools-logs.txt",
        filters: [{ name: "Text", extensions: ["txt"] }],
      });
      if (!path) return;
      await api.exportLogsToFile(path);
    },
    onSuccess: () => toast({ title: "Лог экспортирован" }),
    onError: (e: Error) => showErrorToast(e),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Логи и диагностика"
        description="История команд wsl.exe и системная информация"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Обновить
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              Экспорт
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Очистить
            </Button>
          </>
        }
      />

      {diagnostics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Диагностика</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ConsoleBlock label="Windows" content={diagnostics.windowsVersion} />
            <ConsoleBlock label="wsl --status" content={diagnostics.wslStatus} />
            <ConsoleBlock label="wsl --version" content={diagnostics.wslVersion} />
            {diagnostics.features.length > 0 && (
              <div>
                <p className="mb-2 font-medium">Компоненты Windows</p>
                <ul className="space-y-1">
                  {diagnostics.features.map((f) => (
                    <li key={f.name} className="flex justify-between gap-2">
                      <span className="truncate">{f.name}</span>
                      <Badge variant="muted">{f.state}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Журнал команд</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[400px] space-y-3 overflow-y-auto">
          {logs.length === 0 && (
            <p className="text-sm text-[var(--color-muted-foreground)]">Пока пусто</p>
          )}
          {logs.map((log, i) => (
            <div
              key={`${log.timestamp}-${i}`}
              className="rounded-md border border-[var(--color-border)] p-3 text-xs"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <code className="font-medium">{log.command}</code>
                <Badge variant={log.success ? "success" : "warning"}>
                  {log.success ? "OK" : "FAIL"}
                </Badge>
              </div>
              <p className="mb-2 text-[var(--color-muted-foreground)]">
                {new Date(log.timestamp).toLocaleString("ru")}
              </p>
              {log.stdout && (
                <ConsoleBlock content={log.stdout} maxHeight="120px" />
              )}
              {log.stderr && (
                <pre className="mt-1 whitespace-pre-wrap text-[var(--color-destructive)]">
                  {log.stderr.slice(0, 500)}
                </pre>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
