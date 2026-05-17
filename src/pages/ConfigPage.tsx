import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { showErrorToast } from "@/lib/errors";
import { PageHeader } from "@/components/layout/PageHeader";
import { isTauriApp } from "@/lib/tauri-env";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export function ConfigPage() {
  const [content, setContent] = useState("");

  const inApp = isTauriApp();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.wslConfig,
    queryFn: api.readWslconfig,
    enabled: inApp,
  });

  const { data: limits } = useQuery({
    queryKey: queryKeys.wslConfigLimits(content),
    queryFn: () => api.parseWslconfigLimits(content),
    enabled: inApp && content.length > 0,
  });

  useEffect(() => {
    if (data !== undefined) setContent(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => api.writeWslconfig(content),
    onSuccess: () =>
      toast({
        title: "Конфиг сохранён",
        description:
          "Выполните «Перезапуск WSL» на вкладке дистрибутивов для применения.",
      }),
    onError: (e: Error) => showErrorToast(e),
  });

  const loadTemplate = async () => {
    const tpl = await api.getWslconfigTemplate();
    setContent(tpl);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Конфигурация" description="Редактор %UserProfile%\\.wslconfig" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">.wslconfig</CardTitle>
          <CardDescription>
            После сохранения требуется{" "}
            <code className="rounded bg-[var(--color-muted)] px-1">wsl --shutdown</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Загрузка...</p>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[280px]"
              spellCheck={false}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              Сохранить
            </Button>
            <Button variant="outline" onClick={loadTemplate}>
              Шаблон
            </Button>
          </div>
        </CardContent>
      </Card>

      {limits && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Текущие лимиты [wsl2]</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-[var(--color-muted-foreground)]">Память</dt>
              <dd>{limits.memory ?? "—"}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Процессоры</dt>
              <dd>{limits.processors ?? "—"}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Swap</dt>
              <dd>{limits.swap ?? "—"}</dd>
              <dt className="text-[var(--color-muted-foreground)]">
                localhostForwarding
              </dt>
              <dd>
                {limits.localhostForwarding === null ||
                limits.localhostForwarding === undefined
                  ? "—"
                  : limits.localhostForwarding
                    ? "true"
                    : "false"}
              </dd>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
