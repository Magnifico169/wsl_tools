import { useQuery } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export function NetworkPage() {
  const [selectedDistro, setSelectedDistro] = useState<string>("");
  const [listenPort, setListenPort] = useState("8080");
  const [connectPort, setConnectPort] = useState("8080");
  const [connectIp, setConnectIp] = useState("");

  const inApp = isTauriApp();

  const { data: distros = [] } = useQuery({
    queryKey: queryKeys.distros,
    queryFn: api.listDistros,
    enabled: inApp,
  });

  const distroName =
    selectedDistro || distros.find((d) => d.state === "running")?.name;

  const { data: network, isLoading } = useQuery({
    queryKey: queryKeys.network(distroName),
    queryFn: () => api.getNetworkInfo(distroName),
    enabled: inApp && !!distroName,
    refetchInterval: inApp ? 5000 : false,
  });

  const { data: resources } = useQuery({
    queryKey: queryKeys.resources(distroName!),
    queryFn: () => api.getResourceUsage(distroName!),
    enabled: inApp && !!distroName,
    refetchInterval: inApp ? 5000 : false,
  });

  const copyCmd = async () => {
    const ip = network?.ipAddresses[0] ?? connectIp;
    if (!ip) {
      toast({ title: "Укажите IP WSL", variant: "destructive" });
      return;
    }
    const cmd = await api.getPortproxyCommand(
      parseInt(listenPort, 10) || 8080,
      parseInt(connectPort, 10) || 8080,
      ip,
    );
    await navigator.clipboard.writeText(cmd);
    toast({
      title: "Команда скопирована",
      description: "Запустите PowerShell от администратора",
    });
  };

  const memPercent =
    resources?.memoryUsedMb && resources?.memoryTotalMb
      ? Math.min(100, (resources.memoryUsedMb / resources.memoryTotalMb) * 100)
      : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Сеть и ресурсы"
        description="IP, portproxy и использование ресурсов"
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label>Дистрибутив</Label>
          <select
            className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
            value={distroName ?? ""}
            onChange={(e) => setSelectedDistro(e.target.value)}
          >
            {distros.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name} ({d.state})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Сеть</CardTitle>
            <CardDescription>
              Режим: {isLoading ? "…" : (network?.networkMode ?? "—")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-[var(--color-muted-foreground)]">IP: </span>
              {network?.ipAddresses.join(", ") || "—"}
            </p>
            <div>
              <p className="mb-2 font-medium">Port proxy (netsh)</p>
              {network?.portProxies.length ? (
                <ul className="space-y-1 text-[var(--color-muted-foreground)]">
                  {network.portProxies.map((p, i) => (
                    <li key={i}>
                      {p.listenAddress}:{p.listenPort} → {p.connectAddress}:
                      {p.connectPort}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[var(--color-muted-foreground)]">Нет записей</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ресурсы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {resources ? (
              <>
                <div>
                  <div className="mb-1 flex justify-between">
                    <span>RAM</span>
                    <span>
                      {resources.memoryUsedMb?.toFixed(0) ?? "?"} /{" "}
                      {resources.memoryTotalMb?.toFixed(0) ?? "?"} MB
                      {resources.memoryLimitMb
                        ? ` (лимит ${resources.memoryLimitMb.toFixed(0)} MB)`
                        : ""}
                    </span>
                  </div>
                  {memPercent !== null && (
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
                      <div
                        className="h-full bg-[var(--color-primary)]"
                        style={{ width: `${memPercent}%` }}
                      />
                    </div>
                  )}
                </div>
                <p>
                  CPU: {resources.cpuCount ?? "?"} ядер
                  {resources.processorLimit
                    ? ` (лимит ${resources.processorLimit})`
                    : ""}
                </p>
                {resources.swapLimitMb && (
                  <p>Swap лимит: {resources.swapLimitMb.toFixed(0)} MB</p>
                )}
              </>
            ) : (
              <p className="text-[var(--color-muted-foreground)]">
                Запустите дистрибутив для метрик
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Проброс порта</CardTitle>
          <CardDescription>
            Команда netsh (требуются права администратора)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Listen port</Label>
            <Input value={listenPort} onChange={(e) => setListenPort(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Connect port</Label>
            <Input value={connectPort} onChange={(e) => setConnectPort(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>WSL IP (fallback)</Label>
            <Input value={connectIp} onChange={(e) => setConnectIp(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <Button variant="outline" onClick={copyCmd}>
              <Copy className="h-4 w-4" />
              Скопировать команду portproxy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
