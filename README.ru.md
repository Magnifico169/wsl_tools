# WSL Tools

[English](README.md) | [Русский](README.ru.md)

Минималистичное десктоп-приложение для управления WSL на Windows (Tauri 2 + Rust + React).

## Возможности

- Список дистрибутивов: запуск, остановка, default, Windows Terminal
- Установка из каталога, импорт/экспорт, удаление (unregister)
- Редактор `.wslconfig` с валидацией
- Сеть: IP WSL, portproxy (чтение), использование RAM/CPU
- Логи команд и диагностика (`wsl --status`, компоненты Windows)

## Требования

- Windows 10 21H2+ / Windows 11
- [WSL 2](https://learn.microsoft.com/ru-ru/windows/wsl/install)
- [Node.js 20+](https://nodejs.org/)
- [Rust (rustup)](https://rustup.rs/) — `rustfmt` и `clippy` (ставятся через `rust-toolchain.toml` или `rustup component add rustfmt clippy`)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (рабочая нагрузка C++)
- WebView2 (обычно уже есть в Windows 11)

## Разработка

Запускайте из **PowerShell** в Windows, **не из WSL**:

```powershell
cd C:\Users\...\wsl_tools
npm install
npm run dev
```

- `npm run dev` — **десктопное приложение** Tauri (основной режим)
- `npm run dev:web` — только предпросмотр UI в браузере (**без WSL**; для работы с дистрибутивами — `npm run dev`)

Сборка установщика:

```powershell
npm run icons
npm run tauri build
```

Результат: `src-tauri\target\release\bundle\`

## Скрипты

| Скрипт                     | Описание                      |
| -------------------------- | ----------------------------- |
| `npm run dev`              | Tauri dev (окно приложения)   |
| `npm run dev:web`          | Vite на http://127.0.0.1:1420 |
| `npm run build`            | Сборка фронтенда              |
| `npm run lint`             | TypeScript + ESLint           |
| `npm run lint:rust`        | rustfmt (запись) + clippy     |
| `npm run format:rust`      | только rustfmt                |
| `npm run format`           | Prettier + rustfmt            |
| `npm run format:check`     | проверка Prettier             |
| `npm run format:check:all` | Prettier + rustfmt            |
| `npm run icons`            | Иконки из `assets/icon.svg`   |

## Устранение неполадок

### Кракозябры в логах / диагностике

Исправлено декодированием UTF-16/CP1251 вывода `wsl.exe`. Пересоберите приложение после обновления.

### Мигающее окно консоли при запуске

Фоновые команды запускаются с `CREATE_NO_WINDOW`. Консоль появляется только при «Открыть терминал» (Windows Terminal).

### `cargo metadata` / `node` не найден

Установите Node и Rust **в Windows**, а не только в Ubuntu/WSL.

### «Waiting for frontend dev server»

Используйте `npm run dev` (Tauri), не открывайте вручную только Vite. Адрес dev-сервера: `http://127.0.0.1:1420`.

### `icon.ico is not in 3.00 format`

```powershell
npm run icons:fallback
npm run icons
```

## Архитектура

См. [docs/architecture.md](docs/architecture.md).

## Лицензия

MIT
