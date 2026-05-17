//! Decode Windows console subprocess output (UTF-8, UTF-16 LE, CP1251).

/// Decodes raw bytes from a Windows child process into a Rust `String`.
pub fn decode_console_output(bytes: &[u8]) -> String {
    if bytes.is_empty() {
        return String::new();
    }

    if let Ok(s) = std::str::from_utf8(bytes) {
        return s.to_string();
    }

    if bytes.starts_with(&[0xFF, 0xFE]) {
        return decode_utf16_le(&bytes[2..]);
    }

    if looks_like_utf16_le(bytes) {
        return decode_utf16_le(bytes);
    }

    encoding_rs::WINDOWS_1251.decode(bytes).0.into_owned()
}

fn looks_like_utf16_le(bytes: &[u8]) -> bool {
    if bytes.len() < 4 || bytes.len() % 2 != 0 {
        return false;
    }
    let zero_high = bytes
        .chunks(2)
        .filter(|c| c.len() == 2 && c[1] == 0)
        .count();
    zero_high > bytes.len() / 4
}

fn decode_utf16_le(bytes: &[u8]) -> String {
    if bytes.len() % 2 != 0 {
        return encoding_rs::WINDOWS_1251.decode(bytes).0.into_owned();
    }
    let units: Vec<u16> = bytes
        .chunks_exact(2)
        .map(|c| u16::from_le_bytes([c[0], c[1]]))
        .collect();
    String::from_utf16_lossy(&units)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_utf8() {
        let bytes = "Hello WSL".as_bytes();
        assert_eq!(decode_console_output(bytes), "Hello WSL");
    }

    #[test]
    fn decodes_utf16_le_russian() {
        let text = "Распределение по умолчанию: Ubuntu";
        let mut bytes = Vec::new();
        for unit in text.encode_utf16() {
            bytes.extend_from_slice(&unit.to_le_bytes());
        }
        let decoded = decode_console_output(&bytes);
        assert!(decoded.contains("Ubuntu"));
        assert!(decoded.contains('Р') || decoded.contains("аспределение"));
    }

    #[test]
    fn decodes_utf16_with_bom() {
        let inner = "test";
        let mut bytes = vec![0xFF, 0xFE];
        for unit in inner.encode_utf16() {
            bytes.extend_from_slice(&unit.to_le_bytes());
        }
        assert_eq!(decode_console_output(&bytes), "test");
    }
}
