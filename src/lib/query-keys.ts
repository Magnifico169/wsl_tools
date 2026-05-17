export const queryKeys = {
  distros: ["distros"] as const,
  wslStatus: ["wsl-status"] as const,
  onlineDistros: ["online-distros"] as const,
  exportHistory: ["export-history"] as const,
  wslConfig: ["wslconfig"] as const,
  wslConfigLimits: (content: string) => ["wslconfig-limits", content] as const,
  network: (distro?: string) => ["network", distro] as const,
  resources: (distro: string) => ["resources", distro] as const,
  logs: ["logs"] as const,
  diagnostics: ["diagnostics"] as const,
};
