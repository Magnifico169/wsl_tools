# Architecture

## Layers

```
React pages → api.ts (invoke) → Tauri commands → services → wsl.exe / netsh / fs
```

- **commands/** — thin `#[tauri::command]` IPC handlers
- **services/** — business logic, WSL parsing
- **util/encoding** — Windows console output decoding
- **process_runner** — subprocess, timeouts, log buffer, `CREATE_NO_WINDOW`

## Encoding pipeline

Windows tools (`wsl.exe`, legacy console) may emit:

1. UTF-8
2. UTF-16 LE (common for `wsl --status` on localized Windows)
3. Windows-1251 fallback

`decode_console_output()` in `util/encoding.rs` normalizes all subprocess stdout/stderr before UI display.

`WSL_UTF8=1` is set for `wsl` child processes when supported.

## Hidden console

Background subprocesses use Win32 `CREATE_NO_WINDOW` so polling `wsl --list` does not flash `conhost.exe`.

User-initiated **Open terminal** spawns `wt.exe` hidden; Windows Terminal opens as GUI.

## Data paths

- `%APPDATA%/wsl-tools/export-history.json`
- `%UserProfile%/.wslconfig`

## Errors

`AppError` serializes to `{ code, message, details }` for the React UI.
