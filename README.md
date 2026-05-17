# WSL Tools

[English](README.md) | [Русский](README.ru.md)

Minimal desktop app for managing WSL on Windows (Tauri 2 + Rust + React).

## Features

- List, start/stop, set default, open Windows Terminal
- Install from catalog, import/export, unregister
- Edit `.wslconfig` with validation
- Network IP, portproxy (read-only), resource usage
- Command logs and diagnostics (`wsl --status`, Windows features)

## Requirements

- Windows 10 21H2+ / Windows 11
- [WSL 2](https://learn.microsoft.com/windows/wsl/install)
- [Node.js 20+](https://nodejs.org/)
- [Rust (rustup)](https://rustup.rs/)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (C++ workload)
- WebView2 (usually preinstalled on Windows 11)

## Development

Run from **PowerShell** on Windows (not WSL):

```powershell
cd C:\path\to\wsl_tools
npm install
npm run dev
```

- `npm run dev` — starts **Tauri desktop app** (recommended)
- `npm run dev:web` — Vite only in browser (UI layout preview only; **no WSL** — use `npm run dev` for real features)

Build installer:

```powershell
npm run icons
npm run tauri build
```

Output: `src-tauri\target\release\bundle\`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Tauri dev (app window) |
| `npm run dev:web` | Vite on http://127.0.0.1:1420 |
| `npm run build` | Production frontend build |
| `npm run lint` | TypeScript + ESLint |
| `npm run lint:rust` | rustfmt + clippy (from `src-tauri`) |
| `npm run format` | Prettier write |
| `npm run icons` | Generate icons from `assets/icon.svg` |

## Troubleshooting

### Garbled Cyrillic in logs / diagnostics

Fixed in app via UTF-16/CP1251 decoding of `wsl.exe` output. Rebuild after pulling latest code.

### Flashing console window on startup

Background commands use `CREATE_NO_WINDOW`. Only «Open terminal» launches Windows Terminal.

### `cargo` / `node` not found

Install toolchain on **Windows**, not only in WSL. See [README.ru.md](README.ru.md) for details.

### `icon.ico is not in 3.00 format`

```powershell
npm run icons:fallback
# or
npm run icons
```

## Architecture

See [docs/architecture.md](docs/architecture.md).

## License

MIT
