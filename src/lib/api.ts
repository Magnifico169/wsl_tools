import { invoke } from "@tauri-apps/api/core";
import type {
  DiagnosticsInfo,
  Distro,
  ExportHistoryEntry,
  LogEntry,
  NetworkInfo,
  ResourceUsage,
  WslConfigLimits,
  WslStatusInfo,
} from "./types";

function parseError(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const o = err as { message?: string; details?: string };
    if (o.details) return `${o.message}\n${o.details}`;
    if (o.message) return o.message;
  }
  return String(err);
}

async function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (e) {
    throw new Error(parseError(e));
  }
}

export const api = {
  listDistros: () => call<Distro[]>("list_distros"),
  getWslStatus: () => call<WslStatusInfo>("get_wsl_status"),
  startDistro: (name: string) => call<void>("start_distro", { name }),
  stopDistro: (name: string) => call<void>("stop_distro", { name }),
  shutdownWsl: () => call<void>("shutdown_wsl"),
  setDefaultDistro: (name: string) => call<void>("set_default_distro", { name }),
  openTerminal: (name: string) => call<void>("open_terminal", { name }),
  listOnlineDistros: () => call<string[]>("list_online_distros"),
  installDistro: (name: string) => call<void>("install_distro", { name }),
  unregisterDistro: (name: string) => call<void>("unregister_distro", { name }),
  exportDistro: (name: string, path: string) =>
    call<void>("export_distro", { name, path }),
  importDistro: (name: string, installLocation: string, tarPath: string) =>
    call<void>("import_distro", { name, installLocation, tarPath }),
  getExportHistory: () => call<ExportHistoryEntry[]>("get_export_history"),

  readWslconfig: () => call<string>("read_wslconfig"),
  writeWslconfig: (content: string) => call<void>("write_wslconfig", { content }),
  getWslconfigTemplate: () => call<string>("get_wslconfig_template"),
  parseWslconfigLimits: (content: string) =>
    call<WslConfigLimits>("parse_wslconfig_limits", { content }),

  getNetworkInfo: (distroName?: string) =>
    call<NetworkInfo>("get_network_info", { distroName: distroName ?? null }),
  getResourceUsage: (distroName: string) =>
    call<ResourceUsage>("get_resource_usage", { distroName }),
  getPortproxyCommand: (
    listenPort: number,
    connectPort: number,
    connectIp: string,
  ) =>
    call<string>("get_portproxy_command", {
      listenPort,
      connectPort,
      connectIp,
    }),

  getDiagnostics: () => call<DiagnosticsInfo>("get_diagnostics"),
  getLogs: () => call<LogEntry[]>("get_logs"),
  clearLogs: () => call<void>("clear_logs"),
  exportLogsToFile: (path: string) => call<void>("export_logs_to_file", { path }),
};
