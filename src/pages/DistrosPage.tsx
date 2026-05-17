import { useQuery, useQueryClient } from "@tanstack/react-query";
import { save } from "@tauri-apps/plugin-dialog";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Download,
  MoreVertical,
  Play,
  Plus,
  Power,
  RefreshCw,
  Square,
  Star,
  Terminal,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Distro } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { useWslMutation } from "@/hooks/use-wsl-mutation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancelButton,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { isTauriApp } from "@/lib/tauri-env";

function stateBadge(state: Distro["state"]) {
  if (state === "running") return <Badge variant="success">Running</Badge>;
  if (state === "stopped") return <Badge variant="muted">Stopped</Badge>;
  return <Badge>Unknown</Badge>;
}

export function DistrosPage() {
  const queryClient = useQueryClient();
  const [installName, setInstallName] = useState("");
  const [importName, setImportName] = useState("");
  const [importLocation, setImportLocation] = useState("");
  const [importTar, setImportTar] = useState("");

  const inApp = isTauriApp();

  const {
    data: distros = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.distros,
    queryFn: api.listDistros,
    refetchInterval: inApp ? 4000 : false,
    enabled: inApp,
  });

  const { data: status } = useQuery({
    queryKey: queryKeys.wslStatus,
    queryFn: api.getWslStatus,
    enabled: inApp,
  });

  const { data: online = [] } = useQuery({
    queryKey: queryKeys.onlineDistros,
    queryFn: api.listOnlineDistros,
    enabled: inApp && (status?.installed ?? true),
  });

  const { data: history = [] } = useQuery({
    queryKey: queryKeys.exportHistory,
    queryFn: api.getExportHistory,
    enabled: inApp,
  });

  const action = useWslMutation({
    invalidate: [queryKeys.distros, queryKeys.wslStatus, queryKeys.exportHistory],
  });

  const handleExport = async (name: string) => {
    const path = await save({
      defaultPath: `${name}.tar`,
      filters: [{ name: "TAR", extensions: ["tar"] }],
    });
    if (!path) return;
    action.mutate({
      fn: () => api.exportDistro(name, path),
      success: `Экспорт ${name} завершён`,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.exportHistory });
  };

  const handleImport = () => {
    if (!importName || !importLocation || !importTar) {
      toast({
        title: "Заполните все поля импорта",
        variant: "destructive",
      });
      return;
    }
    action.mutate({
      fn: () => api.importDistro(importName, importLocation, importTar),
      success: `Импорт ${importName} завершён`,
    });
  };

  const pickTar = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Archive", extensions: ["tar", "gz"] }],
    });
    if (typeof selected === "string") setImportTar(selected);
  };

  if (!inApp) {
    return null;
  }

  if (!status?.installed && !isLoading && distros.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WSL не установлен</CardTitle>
          <CardDescription>
            Установите WSL в PowerShell от администратора:{" "}
            <code className="rounded bg-[var(--color-muted)] px-1">wsl --install</code>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Дистрибутивы"
        description="Управление WSL-дистрибутивами"
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Power className="h-4 w-4" />
                  Перезапуск WSL
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg font-semibold">
                    Перезапустить WSL?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Все запущенные дистрибутивы будут остановлены (wsl --shutdown).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancelButton>Отмена</AlertDialogCancelButton>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() =>
                      action.mutate({
                        fn: api.shutdownWsl,
                        success: "WSL перезапущен",
                      })
                    }
                  >
                    Перезапустить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Установить
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Установить дистрибутив</DialogTitle>
                  <DialogDescription>
                    Выберите из каталога или введите имя вручную
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {online.map((name) => (
                      <Button
                        key={name}
                        variant="outline"
                        size="sm"
                        onClick={() => setInstallName(name)}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Имя</Label>
                    <Input
                      value={installName}
                      onChange={(e) => setInstallName(e.target.value)}
                      placeholder="Ubuntu-24.04"
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!installName || action.isPending}
                    onClick={() =>
                      action.mutate({
                        fn: () => api.installDistro(installName),
                        success: `Установка ${installName} запущена`,
                      })
                    }
                  >
                    Установить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Upload className="h-4 w-4" />
                  Импорт
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Импорт дистрибутива</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Имя</Label>
                    <Input
                      value={importName}
                      onChange={(e) => setImportName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Папка установки</Label>
                    <Input
                      value={importLocation}
                      onChange={(e) => setImportLocation(e.target.value)}
                      placeholder="C:\\WSL\\MyDistro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Файл .tar</Label>
                    <div className="flex gap-2">
                      <Input value={importTar} readOnly />
                      <Button variant="outline" onClick={pickTar}>
                        Обзор
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={action.isPending}
                    onClick={handleImport}
                  >
                    Импортировать
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted-foreground)]">
                <th className="p-3 font-medium">Имя</th>
                <th className="p-3 font-medium">Состояние</th>
                <th className="p-3 font-medium">WSL</th>
                <th className="p-3 font-medium">ОС</th>
                <th className="p-3 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-[var(--color-muted-foreground)]"
                  >
                    Загрузка...
                  </td>
                </tr>
              )}
              {!isLoading && distros.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-[var(--color-muted-foreground)]"
                  >
                    Дистрибутивы не найдены
                  </td>
                </tr>
              )}
              {distros.map((d) => (
                <DistroRow
                  key={d.name}
                  distro={d}
                  busy={action.isPending}
                  onStart={() =>
                    action.mutate({
                      fn: () => api.startDistro(d.name),
                      success: `${d.name} запущен`,
                    })
                  }
                  onStop={() =>
                    action.mutate({
                      fn: () => api.stopDistro(d.name),
                      success: `${d.name} остановлен`,
                    })
                  }
                  onDefault={() =>
                    action.mutate({
                      fn: () => api.setDefaultDistro(d.name),
                      success: `${d.name} — по умолчанию`,
                    })
                  }
                  onTerminal={() =>
                    action.mutate({
                      fn: () => api.openTerminal(d.name),
                      success: `Терминал открыт`,
                    })
                  }
                  onExport={() => handleExport(d.name)}
                  onUnregister={() =>
                    action.mutate({
                      fn: () => api.unregisterDistro(d.name),
                      success: `${d.name} удалён`,
                    })
                  }
                />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">История экспортов</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-[var(--color-muted-foreground)]">
              {history.slice(0, 5).map((h) => (
                <li key={`${h.exportedAt}-${h.path}`}>
                  {h.distroName} → {h.path} ({new Date(h.exportedAt).toLocaleString("ru")}
                  )
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DistroRow({
  distro,
  busy,
  onStart,
  onStop,
  onDefault,
  onTerminal,
  onExport,
  onUnregister,
}: {
  distro: Distro;
  busy: boolean;
  onStart: () => void;
  onStop: () => void;
  onDefault: () => void;
  onTerminal: () => void;
  onExport: () => void;
  onUnregister: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)]/50">
      <td className="p-3 font-medium">
        {distro.name}
        {distro.isDefault && (
          <span className="ml-2 text-xs text-[var(--color-primary)]">default</span>
        )}
      </td>
      <td className="p-3">{stateBadge(distro.state)}</td>
      <td className="p-3">WSL {distro.version}</td>
      <td className="p-3 text-[var(--color-muted-foreground)]">
        {distro.osVersion ?? "—"}
      </td>
      <td className="p-3">
        <div className="flex justify-end gap-1">
          {distro.state === "running" ? (
            <Button
              variant="ghost"
              size="icon"
              disabled={busy}
              onClick={onStop}
              title="Остановить"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              disabled={busy}
              onClick={onStart}
              title="Запустить"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            disabled={busy}
            onClick={onTerminal}
            title="Терминал"
          >
            <Terminal className="h-4 w-4" />
          </Button>
          {!distro.isDefault && (
            <Button
              variant="ghost"
              size="icon"
              disabled={busy}
              onClick={onDefault}
              title="По умолчанию"
            >
              <Star className="h-4 w-4" />
            </Button>
          )}
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical className="h-4 w-4" />
            </Button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-50 mt-1 w-40 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] py-1 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-muted)]"
                    onClick={() => {
                      setMenuOpen(false);
                      onExport();
                    }}
                  >
                    <Download className="h-4 w-4" /> Экспорт
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-destructive)] hover:bg-[var(--color-muted)]"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Trash2 className="h-4 w-4" /> Удалить
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-semibold">
                          Удалить {distro.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Данные дистрибутива будут безвозвратно удалены (unregister).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancelButton>Отмена</AlertDialogCancelButton>
                        <AlertDialogAction variant="destructive" onClick={onUnregister}>
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
