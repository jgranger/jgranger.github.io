import path from "node:path";

function slugifyFilename(name) {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  return base.replace(/\s+/g, "-").toLowerCase() + ext.toLowerCase();
}

// Maps each original image filename to a unique URL-safe one. Slugifying
// alone isn't enough: Obsidian names a pasted duplicate "msg-send 2.png",
// which slugifies to the same "msg-send-2.png" as an unrelated existing
// file, and whichever was copied last silently replaced the other on the
// site. Names that are already safe keep them; anything that would collide
// gets a numeric suffix instead.
export function assignSafeNames(originalNames) {
  const names = [...new Set(originalNames)].sort();
  const taken = new Set();
  const result = new Map();

  const alreadySafe = names.filter((n) => slugifyFilename(n) === n);
  const needsSlug = names.filter((n) => slugifyFilename(n) !== n);

  for (const name of alreadySafe) {
    taken.add(name);
    result.set(name, name);
  }
  for (const name of needsSlug) {
    const slug = slugifyFilename(name);
    const ext = path.extname(slug);
    const base = path.basename(slug, ext);
    let candidate = slug;
    for (let n = 1; taken.has(candidate); n++) candidate = `${base}-${n}${ext}`;
    taken.add(candidate);
    result.set(name, candidate);
  }
  return result;
}
