import fs from "node:fs";
import path from "node:path";
import { composedLayouts } from "./composed-diagrams.mjs";

const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function wrap(text, width, fontSize) {
  const limit = Math.floor(width / (fontSize * 0.6));
  const lines = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (line && `${line} ${word}`.length > limit) { lines.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    lines.push(line);
  }
  return lines;
}

export function renderDiagram(spec, viewport) {
  if (spec.layout) {
    const render = composedLayouts[spec.layout];
    if (!render) throw new Error(`Unknown diagram layout: ${spec.layout}`);
    return render(spec, viewport);
  }
  const width = viewport === "phone" ? 400 : 760;
  const margin = viewport === "phone" ? 24 : 40;
  const inner = width - margin * 2;
  const font = 24;
  const lineHeight = 34;
  let y = 40;
  const body = [];
  const text = (value, x, top, maxWidth, size = font, color = "#eeeae2", weight = "normal") => {
    const lines = wrap(value, maxWidth, size);
    body.push(`<text x="${x}" y="${top}" fill="${color}" font-size="${size}" font-weight="${weight}">${lines.map((line, i) => `<tspan x="${x}" dy="${i ? lineHeight : 0}">${escape(line)}</tspan>`).join("")}</text>`);
    return lines.length * lineHeight;
  };
  y += text(spec.title, margin, y, inner, 28, "#eeeae2", "600") + 24;
  for (const [index, section] of spec.sections.entries()) {
    body.push(`<line x1="${margin}" y1="${y}" x2="${width - margin}" y2="${y}" stroke="#455052"/>`);
    y += 38;
    y += text(`${index + 1}. ${section.title}`, margin, y, inner, 24, "#c1add7", "600") + 12;
    if (section.graphic) {
      const graphicWidth = Math.min(inner, 352);
      const scale = graphicWidth / 352;
      body.push(`<g transform="translate(${(width - graphicWidth) / 2},${y}) scale(${scale})">${section.graphic}</g>`);
      y += section.graphicHeight * scale + 24;
    }
    if (section.description) y += text(section.description, margin, y, inner) + 20;
    for (const [nodeIndex, node] of (section.nodes || []).entries()) {
      const lines = wrap(node.text, inner - 36, font);
      const boxHeight = 28 + lines.length * lineHeight;
      body.push(`<rect x="${margin}" y="${y}" width="${inner}" height="${boxHeight}" rx="8" fill="#141a1c" stroke="${node.color || "#679c9c"}" stroke-width="1.5"/>`);
      text(node.text, margin + 18, y + 29, inner - 36);
      y += boxHeight + 14;
      if (node.next) {
        y += text(node.next, margin + 20, y + 12, inner - 40, 17, "#bbc3ca") + 8;
        body.push(`<path d="M${width / 2} ${y - 5} v15" fill="none" stroke="#9aabba" marker-end="url(#arrow)"/>`);
        y += 28;
      } else if (nodeIndex < section.nodes.length - 1) y += 8;
    }
    y += 22;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${y}" viewBox="0 0 ${width} ${y}" role="img" aria-labelledby="title desc"><title id="title">${escape(spec.title)}</title><desc id="desc">${escape(spec.sections.map(s => s.title + ". " + (s.description || "") + " " + (s.nodes || []).map(n => n.text).join(". ")).join("\n"))}</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#aebdc6"/></marker></defs><rect width="100%" height="100%" fill="#101313"/><g font-family="Georgia, serif">${body.join("")}</g></svg>`;
}

export function generateDiagramVariants(privateDir) {
  const specsDir = path.join(privateDir, "responsive-diagrams");
  if (!fs.existsSync(specsDir)) return;
  for (const filename of fs.readdirSync(specsDir).filter(name => name.endsWith(".json"))) {
    const spec = JSON.parse(fs.readFileSync(path.join(specsDir, filename), "utf8"));
    if (!spec.source || path.basename(spec.source) !== spec.source) throw new Error(`Invalid diagram definition: ${filename}`);
    if (!fs.existsSync(path.join(privateDir, spec.source))) throw new Error(`Missing diagram source: ${spec.source}`);
    const stem = spec.source.slice(0, -path.extname(spec.source).length);
    if (spec.layout === "dogfooding") spec.sourceData = `data:image/png;base64,${fs.readFileSync(path.join(privateDir, spec.source)).toString("base64")}`;
    for (const viewport of spec.viewports || ["phone", "tablet"]) {
      if (!["phone", "tablet", "desktop"].includes(viewport)) throw new Error(`Invalid viewport: ${viewport}`);
      fs.writeFileSync(path.join(privateDir, `${stem}.${viewport}.svg`), renderDiagram(spec, viewport));
    }
  }
}
