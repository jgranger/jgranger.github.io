import { isIP } from "node:net";

export function clientIpFromHeaders(headers) {
  const cfIp = headers["cf-connecting-ip"];
  const forwarded = headers["x-forwarded-for"];
  const candidate = typeof cfIp === "string" ? cfIp : typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "";
  return isIP(candidate) ? candidate : "";
}

export function deviceInfoFromHeaders(headers) {
  const ua = typeof headers["user-agent"] === "string" ? headers["user-agent"] : "";
  const browser = /Edg\//.test(ua) ? "Edge"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : "Other";
  const platform = /Android/i.test(ua) ? "Android"
    : /iPhone|iPad|iPod/i.test(ua) ? "iOS"
    : /Windows/i.test(ua) ? "Windows"
    : /Macintosh|Mac OS X/i.test(ua) ? "macOS"
    : /Linux/i.test(ua) ? "Linux"
    : "Other";
  const device = /iPad|Tablet/i.test(ua) ? "Tablet"
    : /Mobile|Android|iPhone/i.test(ua) ? "Mobile"
    : "Desktop";
  return { browser, platform, device };
}
