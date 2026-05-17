use crate::error::{AppError, AppResult};
use crate::models::LogEntry;
use crate::util::encoding::decode_console_output;
use chrono::Utc;
use once_cell::sync::Lazy;
use std::process::Stdio;
use std::sync::Mutex;
use tokio::process::Command;
use tokio::time::{timeout, Duration};

const MAX_LOG_ENTRIES: usize = 100;
const DEFAULT_TIMEOUT_SECS: u64 = 120;
const LONG_TIMEOUT_SECS: u64 = 3600;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

static LOG_BUFFER: Lazy<Mutex<Vec<LogEntry>>> = Lazy::new(|| Mutex::new(Vec::new()));

pub fn get_logs() -> Vec<LogEntry> {
    LOG_BUFFER.lock().map(|g| g.clone()).unwrap_or_default()
}

pub fn clear_logs() {
    if let Ok(mut guard) = LOG_BUFFER.lock() {
        guard.clear();
    }
}

fn push_log(entry: LogEntry) {
    if let Ok(mut guard) = LOG_BUFFER.lock() {
        guard.insert(0, entry);
        guard.truncate(MAX_LOG_ENTRIES);
    }
}

pub struct CommandOutput {
    pub stdout: String,
    pub stderr: String,
}

impl CommandOutput {
    pub fn text(&self) -> String {
        let stdout = self.stdout.trim();
        let stderr = self.stderr.trim();
        match (stdout.is_empty(), stderr.is_empty()) {
            (true, true) => String::new(),
            (true, false) => self.stderr.clone(),
            (false, true) => self.stdout.clone(),
            (false, false) => format!("{}\n{}", self.stdout, self.stderr),
        }
    }
}

fn decode_output(stdout: &[u8], stderr: &[u8]) -> (String, String) {
    (decode_console_output(stdout), decode_console_output(stderr))
}

#[cfg(windows)]
fn configure_command(command: &mut Command, program: &str, hide_window: bool) {
    if hide_window {
        command.creation_flags(CREATE_NO_WINDOW);
    }
    if program == "wsl" {
        command.env("WSL_UTF8", "1");
    }
}

#[cfg(not(windows))]
fn configure_command(command: &mut Command, program: &str, _hide_window: bool) {
    if program == "wsl" {
        command.env("WSL_UTF8", "1");
    }
}

fn build_command(program: &str, args: &[&str], hide_window: bool) -> Command {
    let mut command = Command::new(program);
    command.args(args);
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());
    configure_command(&mut command, program, hide_window);
    command
}

async fn run_command_internal(
    program: &str,
    args: &[&str],
    timeout_secs: Option<u64>,
    hide_window: bool,
) -> AppResult<CommandOutput> {
    let cmd_str = format!("{} {}", program, args.join(" "));
    let mut command = build_command(program, args, hide_window);

    let output = if let Some(secs) = timeout_secs {
        let child = command.spawn().map_err(|e| {
            if program == "wsl" && e.kind() == std::io::ErrorKind::NotFound {
                AppError::WslNotInstalled
            } else {
                AppError::Io(e)
            }
        })?;

        let result = timeout(Duration::from_secs(secs), child.wait_with_output()).await;

        match result {
            Ok(Ok(out)) => out,
            Ok(Err(e)) => return Err(AppError::Io(e)),
            Err(_) => {
                return Err(AppError::Other(format!(
                    "Таймаут команды ({secs} с): {cmd_str}"
                )));
            }
        }
    } else {
        command.output().await.map_err(AppError::Io)?
    };

    let (stdout, stderr) = decode_output(&output.stdout, &output.stderr);
    let success = output.status.success();

    push_log(LogEntry {
        timestamp: Utc::now().to_rfc3339(),
        command: cmd_str.clone(),
        success,
        stdout: stdout.clone(),
        stderr: stderr.clone(),
    });

    if !success && timeout_secs.is_some() {
        return Err(AppError::CommandFailed {
            message: format!("Команда не выполнена: {cmd_str}"),
            stderr: if stderr.is_empty() { stdout } else { stderr },
        });
    }

    Ok(CommandOutput { stdout, stderr })
}

pub async fn run_wsl(args: &[&str], long_running: bool) -> AppResult<CommandOutput> {
    let timeout_secs = if long_running {
        LONG_TIMEOUT_SECS
    } else {
        DEFAULT_TIMEOUT_SECS
    };
    run_program("wsl", args, timeout_secs).await
}

pub async fn run_program(
    program: &str,
    args: &[&str],
    timeout_secs: u64,
) -> AppResult<CommandOutput> {
    run_command_internal(program, args, Some(timeout_secs), true).await
}

pub async fn run_program_allow_failure(program: &str, args: &[&str]) -> AppResult<CommandOutput> {
    run_command_internal(program, args, None, true).await
}

/// Spawn a process without showing a console window (e.g. Windows Terminal launcher).
pub async fn spawn_hidden(program: &str, args: &[&str]) -> AppResult<()> {
    let cmd_str = format!("{} {}", program, args.join(" "));
    let mut command = build_command(program, args, true);
    command.stdin(Stdio::null());
    command.stdout(Stdio::null());
    command.stderr(Stdio::null());

    command.spawn().map_err(AppError::Io)?;

    push_log(LogEntry {
        timestamp: Utc::now().to_rfc3339(),
        command: cmd_str,
        success: true,
        stdout: String::new(),
        stderr: String::new(),
    });

    Ok(())
}
