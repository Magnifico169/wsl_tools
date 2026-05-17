use crate::error::AppResult;
use crate::models::{NetworkInfo, PortProxy, ResourceUsage};
use crate::services::config_service::{memory_limit_mb, parse_limits, read_wslconfig};
use crate::services::process_runner::{run_program_allow_failure, run_wsl};
use crate::services::validation::validate_distro_name;
use regex::Regex;

pub async fn get_network_info(distro_name: Option<&str>) -> AppResult<NetworkInfo> {
    let mut args = vec!["hostname", "-I"];
    if let Some(name) = distro_name {
        validate_distro_name(name)?;
        args = vec!["-d", name, "--", "hostname", "-I"];
    }

    let ip_output = run_wsl(&args, false).await;
    let ip_addresses: Vec<String> = ip_output
        .map(|o| {
            o.text()
                .split_whitespace()
                .filter(|s| !s.is_empty())
                .map(String::from)
                .collect()
        })
        .unwrap_or_default();

    let port_proxies = list_port_proxies().await.unwrap_or_default();
    let network_mode = detect_network_mode().await;

    Ok(NetworkInfo {
        ip_addresses,
        network_mode,
        port_proxies,
    })
}

async fn detect_network_mode() -> String {
    let config = read_wslconfig().unwrap_or_default();
    if config.to_lowercase().contains("networkingmode=mirrored") {
        return "mirrored".to_string();
    }
    if config.to_lowercase().contains("networkingmode=nat") {
        return "nat".to_string();
    }
    "auto (NAT/mirrored)".to_string()
}

pub async fn list_port_proxies() -> AppResult<Vec<PortProxy>> {
    let output = run_program_allow_failure(
        "netsh",
        &["interface", "portproxy", "show", "v4"],
    )
    .await?;

    let mut proxies = Vec::new();
    let line_re = Regex::new(
        r"(?x)
        ^\s*
        (\S+)\s+       # listen addr
        (\d+)\s+       # listen port
        (\S+)\s+       # connect addr
        (\d+)\s*       # connect port
        $",
    )
    .ok();

    for line in output.text().lines().skip(2) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 4 {
            proxies.push(PortProxy {
                listen_address: parts[0].to_string(),
                listen_port: parts[1].to_string(),
                connect_address: parts[2].to_string(),
                connect_port: parts[3].to_string(),
            });
        } else if let Some(re) = &line_re {
            if let Some(caps) = re.captures(line) {
                proxies.push(PortProxy {
                    listen_address: caps[1].to_string(),
                    listen_port: caps[2].to_string(),
                    connect_address: caps[3].to_string(),
                    connect_port: caps[4].to_string(),
                });
            }
        }
    }

    Ok(proxies)
}

pub fn portproxy_add_command(
    listen_port: u16,
    connect_port: u16,
    connect_ip: &str,
) -> String {
    format!(
        "netsh interface portproxy add v4tov4 listenport={listen_port} listenaddress=0.0.0.0 connectport={connect_port} connectaddress={connect_ip}"
    )
}

pub async fn get_resource_usage(distro_name: &str) -> AppResult<ResourceUsage> {
    validate_distro_name(distro_name)?;

    let mem_output = run_wsl(
        &[
            "-d",
            distro_name,
            "--",
            "sh",
            "-c",
            "free -m | awk '/Mem:/ {print $2, $3}'",
        ],
        false,
    )
    .await;

    let (memory_total_mb, memory_used_mb) = mem_output
        .ok()
        .and_then(|o| {
            let parts: Vec<f64> = o
                .text()
                .split_whitespace()
                .filter_map(|s| s.parse().ok())
                .collect();
            if parts.len() >= 2 {
                Some((Some(parts[0]), Some(parts[1])))
            } else {
                None
            }
        })
        .unwrap_or((None, None));

    let cpu_output = run_wsl(
        &["-d", distro_name, "--", "nproc"],
        false,
    )
    .await
    .ok()
    .and_then(|o| o.text().trim().parse().ok());

    let config = read_wslconfig().unwrap_or_default();
    let limits = parse_limits(&config);

    Ok(ResourceUsage {
        distro_name: distro_name.to_string(),
        memory_used_mb,
        memory_total_mb,
        memory_limit_mb: memory_limit_mb(&config),
        cpu_count: cpu_output,
        processor_limit: limits.processors,
        swap_limit_mb: limits
            .swap
            .as_deref()
            .and_then(|s| {
                let upper = s.to_uppercase();
                if let Some(n) = upper.strip_suffix("GB") {
                    n.trim().parse::<f64>().ok().map(|v| v * 1024.0)
                } else if let Some(n) = upper.strip_suffix("MB") {
                    n.trim().parse().ok()
                } else {
                    None
                }
            }),
    })
}
