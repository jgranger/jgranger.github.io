import net from "node:net";

const WRITE_SCRIPT = [
  "local first = redis.call('SADD', KEYS[1], ARGV[1])",
  "local readers = redis.call('SCARD', KEYS[1])",
  "local views = redis.call('INCR', KEYS[2])",
  "local chapterViews = redis.call('HINCRBY', KEYS[3], ARGV[2], 1)",
  "redis.call('HINCRBY', KEYS[4], ARGV[3], 1)",
  "local dayViews = redis.call('HINCRBY', KEYS[5], ARGV[4], 1)",
  "redis.call('PFADD', KEYS[6], ARGV[1])",
  "local dayReaders = redis.call('PFCOUNT', KEYS[6])",
  "redis.call('LPUSH', KEYS[7], ARGV[5])",
  "redis.call('LTRIM', KEYS[7], 0, 999)",
  "redis.call('HSETNX', KEYS[8], 'firstSeen', ARGV[6])",
  "redis.call('HSET', KEYS[8], 'lastSeen', ARGV[6], 'source', ARGV[3], 'country', ARGV[7], 'region', ARGV[8], 'city', ARGV[9], 'isp', ARGV[10], 'browser', ARGV[11], 'platform', ARGV[12], 'device', ARGV[13], 'language', ARGV[14], 'timeZone', ARGV[15])",
  "redis.call('HINCRBY', KEYS[8], 'views', 1)",
  "if ARGV[16] ~= '' then redis.call('SET', KEYS[9], ARGV[16], 'EX', 2592000) end",
  "if ARGV[7] ~= '' then redis.call('HINCRBY', KEYS[10], ARGV[7], 1) end",
  "return cjson.encode({first=first, readers=readers, views=views, chapterViews=chapterViews, dayViews=dayViews, dayReaders=dayReaders, country=ARGV[7], region=ARGV[8], city=ARGV[9]})",
].join("\n");

function serializeCommand(values) {
  const parts = [Buffer.from(`*${values.length}\r\n`)];
  for (const value of values) {
    const bytes = Buffer.from(String(value));
    parts.push(Buffer.from(`$${bytes.length}\r\n`), bytes, Buffer.from("\r\n"));
  }
  return Buffer.concat(parts);
}

function parseReply(data) {
  const end = data.indexOf("\r\n");
  if (end < 0) return null;
  const kind = String.fromCharCode(data[0]);
  const head = data.subarray(1, end).toString();
  if (kind === "-") throw new Error(`Key Value rejected the operation: ${head}`);
  if (kind === "+") return { value: head };
  if (kind !== "$") throw new Error("Unexpected Key Value reply");
  const length = Number(head);
  if (!Number.isSafeInteger(length) || length < 0) throw new Error("Invalid Key Value reply length");
  if (data.length < end + 2 + length + 2) return null;
  return { value: data.subarray(end + 2, end + 2 + length).toString() };
}

function runCommand(command) {
  const address = process.env.REDIS_URL;
  if (!address) return Promise.reject(new Error("REDIS_URL is not configured"));
  const url = new URL(address);
  if (url.protocol !== "redis:") return Promise.reject(new Error("Expected a private redis:// connection"));
  if (url.username || url.password) return Promise.reject(new Error("Authenticated Key Value connections require a configured client"));
  if (!url.hostname) return Promise.reject(new Error("Key Value hostname is missing"));
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: url.hostname, port: Number(url.port || 6379) });
    const timer = setTimeout(() => socket.destroy(new Error("Key Value connection timed out")), 3000);
    let received = Buffer.alloc(0);
    let finished = false;

    function finish(error, value) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.destroy();
      if (error) reject(error);
      else resolve(value);
    }

    socket.on("connect", () => socket.write(serializeCommand(command)));
    socket.on("data", (chunk) => {
      try {
        received = Buffer.concat([received, chunk]);
        if (received.length > 65536) throw new Error("Oversized Key Value reply");
        const result = parseReply(received);
        if (result !== null) finish(null, result.value);
      } catch (error) {
        finish(error);
      }
    });
    socket.on("error", (error) => finish(error));
    socket.on("close", () => {
      if (!finished) finish(new Error("Key Value closed the connection unexpectedly"));
    });
  });
}

export async function checkAnalyticsStore() {
  const response = await runCommand(["PING"]);
  if (response !== "PONG") throw new Error("Unexpected Key Value health response");
}

export async function resolveVisitorLocation(ip) {
  if (!ip) return {};
  const key = "agentic-journey:geo:" + (await import("node:crypto")).createHash("sha256").update(ip).digest("hex").slice(0, 24);
  try {
    const cached = await runCommand(["GET", key]);
    if (cached) return JSON.parse(cached);
  } catch {}
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,region,city,connection`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return {};
    const data = await response.json();
    if (!data.success) return {};
    const location = {
      country: String(data.country || "").slice(0, 80),
      region: String(data.region || "").slice(0, 100),
      city: String(data.city || "").slice(0, 100),
      isp: String(data.connection?.isp || "").slice(0, 100),
    };
    await runCommand(["SET", key, JSON.stringify(location), "EX", "604800"]).catch(() => {});
    return location;
  } catch {
    return {};
  }
}

export async function saveAnalyticsVisit({ visitor, path, source, day, ip = "", location = {}, device = {}, language = "", timeZone = "" }) {
  const at = new Date().toISOString();
  const event = JSON.stringify({
    at, path, source,
    country: location.country || "",
    region: location.region || "",
    city: location.city || "",
    browser: device.browser || "",
    platform: device.platform || "",
    device: device.device || "",
  });
  const response = await runCommand([
    "EVAL",
    WRITE_SCRIPT,
    "10",
    "agentic-journey:readers",
    "agentic-journey:views",
    "agentic-journey:chapters",
    "agentic-journey:sources",
    "agentic-journey:daily:views",
    `agentic-journey:daily:readers:${day}`,
    `agentic-journey:visitor:${visitor}:history`,
    `agentic-journey:visitor:${visitor}:profile`,
    `agentic-journey:visitor:${visitor}:ip`,
    "agentic-journey:countries",
    visitor,
    path,
    source,
    day,
    event,
    at,
    location.country || "",
    location.region || "",
    location.city || "",
    location.isp || "",
    device.browser || "",
    device.platform || "",
    device.device || "",
    language,
    timeZone,
    ip,
  ]);
  return JSON.parse(response);
}

export async function getVisitorIp(visitor) {
  if (!/^[0-9a-f]{24}$/.test(visitor)) throw new Error("Invalid visitor identifier");
  return await runCommand(["GET", `agentic-journey:visitor:${visitor}:ip`]);
}
