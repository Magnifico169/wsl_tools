use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("WSL не установлен или недоступен")]
    WslNotInstalled,

    #[error("Дистрибутив не найден: {0}")]
    DistroNotFound(String),

    #[error("Недопустимое имя дистрибутива: {0}")]
    InvalidDistroName(String),

    #[error("Команда завершилась с ошибкой: {message}")]
    CommandFailed { message: String, stderr: String },

    #[error("Ошибка ввода-вывода: {0}")]
    Io(#[from] std::io::Error),

    #[error("{0}")]
    Other(String),
}

#[derive(Debug, Clone, Serialize)]
pub struct ErrorPayload {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
}

impl AppError {
    pub fn code(&self) -> &'static str {
        match self {
            AppError::WslNotInstalled => "WSL_NOT_INSTALLED",
            AppError::DistroNotFound(_) => "DISTRO_NOT_FOUND",
            AppError::InvalidDistroName(_) => "INVALID_DISTRO_NAME",
            AppError::CommandFailed { .. } => "COMMAND_FAILED",
            AppError::Io(_) => "IO_ERROR",
            AppError::Other(_) => "OTHER",
        }
    }

    pub fn to_payload(&self) -> ErrorPayload {
        ErrorPayload {
            code: self.code().to_string(),
            message: self.to_string(),
            details: match self {
                AppError::CommandFailed { stderr, .. } if !stderr.is_empty() => {
                    Some(stderr.clone())
                }
                _ => None,
            },
        }
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_payload().serialize(serializer)
    }
}

pub type AppResult<T> = Result<T, AppError>;

/// Maps WSL "distribution not found" stderr to [`AppError::DistroNotFound`].
pub fn map_distro_error(distro: &str, err: AppError) -> AppError {
    if let AppError::CommandFailed { stderr, .. } = &err {
        let s = stderr.to_lowercase();
        if s.contains("does not exist")
            || s.contains("not registered")
            || s.contains("no distribution")
            || s.contains("is unknown")
            || s.contains("не зарегистрирован")
            || s.contains("не существует")
        {
            return AppError::DistroNotFound(distro.to_string());
        }
    }
    err
}
