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
  "return cjson.encode({first=first, readers=readers, views=views, chapterViews=chapterViews, dayViews=dayViews, dayReaders=dayReaders})",
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

export async function saveAnalyticsVisit({ visitor, path, source, day }) {
  const response = await runCommand([
    "EVAL",
    WRITE_SCRIPT,
    "6",
    "agentic-journey:readers",
    "agentic-journey:views",
    "agentic-journey:chapters",
    "agentic-journey:sources",
    `agentic-journey:daily:views`,
    `agentic-journey:daily:readers:${day}`,
    visitor,
    path,
    source,
    day,
  ]);
  return JSON.parse(response);
}
