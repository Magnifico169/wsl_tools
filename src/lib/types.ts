export type DistroState = "running" | "stopped" | "unknown";

export interface Distro {
  name: string;
  state: DistroState;
  version: number;
  isDefault: boolean;
  osVersion?: string | null;
}

export interface WslStatusInfo {
  installed: boolean;
  defaultVersion?: number | null;
  statusText: string;
  versionText: string;
}

export interface NetworkInfo {
  ipAddresses: string[];
  networkMode: string;
  portProxies: PortProxy[];
}

export interface PortProxy {
  listenAddress: string;
  listenPort: string;
  connectAddress: string;
  connectPort: string;
}

export interface ResourceUsage {
  distroName: string;
  memoryUsedMb?: number | null;
  memoryTotalMb?: number | null;
  memoryLimitMb?: number | null;
  cpuCount?: number | null;
  processorLimit?: number | null;
  swapLimitMb?: number | null;
}

export interface LogEntry {
  timestamp: string;
  command: string;
  success: boolean;
  stdout: string;
  stderr: string;
}

export interface DiagnosticsInfo {
  wslStatus: string;
  wslVersion: string;
  windowsVersion: string;
  features: WindowsFeature[];
}

export interface WindowsFeature {
  name: string;
  state: string;
}

export interface ExportHistoryEntry {
  distroName: string;
  path: string;
  exportedAt: string;
}

export interface WslConfigLimits {
  memory?: string | null;
  processors?: number | null;
  swap?: string | null;
  localhostForwarding?: boolean | null;
}

export interface AppErrorPayload {
  code: string;
  message: string;
  details?: string | null;
}
