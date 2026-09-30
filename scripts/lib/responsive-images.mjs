import path from "node:path";

export function responsiveSources(src, imageMap, prefix) {
  const original = [...imageMap.entries()].find(([, value]) => `${prefix}/${value.safeName}` === src)?.[0];
  if (!original) return {};
  const stem = original.slice(0, -path.extname(original).length);
  const sources = {};
  for (const viewport of ["phone", "tablet"]) {
    const candidates = [...imageMap.entries()].filter(([name]) =>
      name.startsWith(`${stem}.${viewport}.`) && /\.(svg|webp|png|jpe?g)$/i.test(name)
    );
    if (candidates.length > 1) throw new Error(`Multiple ${viewport} variants for ${original}`);
    if (candidates.length) sources[`${viewport}Src`] = `${prefix}/${candidates[0][1].safeName}`;
  }
  return sources;
}

export function imageAttributes(src, imageMap, prefix) {
  return Object.entries(responsiveSources(src, imageMap, prefix))
    .map(([name, value]) => ` ${name}={${JSON.stringify(value)}}`).join("");
}
