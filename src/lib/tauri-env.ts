import { isTauri } from "@tauri-apps/api/core";

/** True when UI runs inside the Tauri desktop shell (Rust backend available). */
export function isTauriApp(): boolean {
  return isTauri();
}
