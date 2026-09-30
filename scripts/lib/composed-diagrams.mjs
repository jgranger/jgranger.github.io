const esc = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const colors = { ink: "#eeeae4", muted: "#bcc9cb", cyan: "#56bfd4", blue: "#739ee2", purple: "#aa91cf", gold: "#d8bb82", green: "#a5bb89" };

function lines(value, width, size) {
  const limit = Math.max(1, Math.floor(width / (size * 0.57)));
  return String(value).split("\n").flatMap(paragraph => {
    const result = [];
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (line && `${line} ${word}`.length > limit) { result.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    result.push(line);
    return result;
  });
}

function canvas(width, height, title, description) {
  const body = [];
  const text = (value, x, y, maxWidth, size = 22, fill = colors.ink, weight = 400, anchor = "start") => {
    const content = lines(value, maxWidth, size);
    body.push(`<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}">${content.map((line, i) => `<tspan x="${x}" dy="${i ? size * 1.3 : 0}">${esc(line)}</tspan>`).join("")}</text>`);
    return content.length * size * 1.3;
  };
  const path = (d, color = colors.muted, arrows = "end", dashed = false) => body.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" ${dashed ? 'stroke-dasharray="4 6"' : ""} ${arrows === "both" ? 'marker-start="url(#arrow)"' : ""} ${arrows !== "none" ? 'marker-end="url(#arrow)"' : ""}/>`);
  const rect = (x, y, w, h, color = colors.cyan, fill = "#091318", radius = 12) => body.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${color}" stroke-width="1.5"/>`);
  const dot = (x, y, color = colors.gold, radius = 5) => body.push(`<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}"/>`);
  const label = (value, x, y, maxWidth, size = 18) => {
    const content = lines(value, maxWidth, size);
    const w = Math.min(maxWidth, Math.max(...content.map(line => line.length)) * size * 0.6 + 18);
    body.push(`<rect x="${x - w / 2}" y="${y - size}" width="${w}" height="${content.length * size * 1.3 + 8}" rx="4" fill="#070e11"/>`);
    text(value, x, y, maxWidth, size, colors.muted, 400, "middle");
  };
  const card = (node, x, y, w, h, color = colors.cyan) => {
    rect(x, y, w, h, color);
    const head = text(node.title, x + 16, y + 32, w - 32, 22, color, 600);
    if (node.detail) text(width <= 400 ? node.phoneDetail || node.detail : node.detail, x + 16, y + 40 + head, w - 32, width <= 400 ? 20 : 18, colors.muted);
  };
  const finish = () => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(description)}</desc><defs><linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors.cyan}"/><stop offset="1" stop-color="${colors.purple}"/></linearGradient><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${colors.muted}"/></marker></defs><rect width="100%" height="100%" fill="#070e11"/><g font-family="Arial, sans-serif">${body.join("")}</g></svg>`;
  return { body, text, path, rect, dot, label, card, finish };
}

function icon(kind, x, y, color) {
  const shapes = {
    send: '<path d="M2 18L42 2L30 42L21 27L2 18ZM21 27L42 2M21 27L15 39L15 24"/>',
    people: '<circle cx="22" cy="10" r="7"/><circle cx="5" cy="18" r="4"/><circle cx="39" cy="18" r="4"/><path d="M10 43V35A12 12 0 0 1 34 35V43M0 41V34A7 7 0 0 1 10 28M44 41V34A7 7 0 0 0 34 28"/>',
    receipt: '<path d="M5 2H39Q43 2 43 6V29Q43 33 39 33H23L12 43V33H5Q1 33 1 29V6Q1 2 5 2ZM12 17L20 24L33 11"/>',
    chart: '<path d="M2 43H44M6 42V27H14V42M20 42V16H28V42M34 42V3H42V42"/>',
    insight: '<circle cx="18" cy="18" r="16"/><path d="M29 30L43 44M9 17A10 10 0 0 1 19 8"/>',
  };
  return `<g transform="translate(${x},${y})" fill="none" stroke="${color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${shapes[kind] || shapes.insight}</g>`;
}

export function renderCampaign(spec, viewport) {
  const phone = viewport === "phone";
  const width = phone ? 360 : 720;
  const rail = !!spec.agent;
  const gap = phone ? 30 : 26;
  const cardHeight = phone ? 142 : 112;
  const start = 96;
  const total = start + spec.steps.length * (cardHeight + gap);
  const height = total + (rail ? 208 : 10);
  const d = canvas(width, height, spec.title, spec.description);
  d.text(spec.title, 20, 34, width - 40, phone ? 25 : 30, colors.ink, 600);
  const x = rail ? 46 : 20;
  const w = width - x - 20;
  const center = x + w / 2;
  if (rail) d.path(`M18 ${start + cardHeight / 2} V${total + 80} H46`, colors.gold, "none", true);
  spec.steps.forEach((step, i) => {
    const y = start + i * (cardHeight + gap);
    const color = [colors.cyan, colors.blue, colors.purple, colors.purple, colors.cyan][i % 5];
    d.rect(x, y, w, cardHeight, "url(#edge)");
    d.body.push(icon(step.icon, x + 16, y + 14, rail ? colors.gold : color));
    if (phone) {
      d.text(String(i + 1).padStart(2, "0"), x + w - 19, y + 36, 40, 18, colors.muted, 400, "end");
      d.text(step.title, x + 16, y + 88, w - 32, 22, colors.ink, 600);
      d.text(step.caption, x + 16, y + 120, w - 32, 20, colors.muted);
    } else {
      d.text(step.title, x + 82, y + 40, w - 105, 25, colors.ink, 600);
      d.text(step.caption, x + 82, y + 79, w - 105, 22, colors.muted);
    }
    if (i < spec.steps.length - 1) d.path(`M${center} ${y + cardHeight + 4} V${y + cardHeight + gap - 6}`);
    if (rail) {
      d.path(`M18 ${y + cardHeight / 2} H${x}`, colors.gold, "none", true);
      d.dot(x, y + cardHeight / 2);
    }
  });
  if (rail) {
    d.text(spec.agent.connection, 46, total + 11, width - 66, phone ? 18 : 22, colors.gold);
    d.card(spec.agent, 46, total + 38, width - 66, 150, colors.gold);
  }
  return d.finish();
}

export function renderSearchStages(spec, viewport) {
  const phone = viewport === "phone";
  const tablet = viewport === "tablet";
  const width = phone ? 360 : tablet ? 720 : 1120;
  const rowHeight = phone ? 265 : tablet ? 255 : 230;
  const top = phone ? 95 : 90;
  const d = canvas(width, top + spec.sections.length * rowHeight + 12, spec.title, spec.sections.map(s => `${s.title}. ${phone ? s.caption : s.description}`).join(" "));
  d.text(spec.title, 20, 36, width - 40, phone ? 25 : 32, colors.ink, 600);
  spec.sections.forEach((section, index) => {
    const y = top + index * rowHeight;
    d.path(`M20 ${y - 14} H${width - 20}`, "#304449", "none");
    if (phone || tablet) {
      d.dot(34, y + 11, "#273a40", 15);
      d.text(String(index + 1), 34, y + 18, 28, 18, colors.ink, 600, "middle");
      d.text(section.title, 60, y + 18, width - 80, phone ? 22 : 24, colors.ink, 600);
      const gx = phone ? 24 : 28;
      const gy = y + (phone ? 63 : 53);
      const scale = phone ? 0.88 : 0.9;
      d.body.push(`<g transform="translate(${gx},${gy}) scale(${scale})">${section.graphic}</g>`);
      if (phone) d.text(section.caption, width / 2, y + 239, width - 40, 19, colors.muted, 400, "middle");
      else {
        d.text(section.description, 388, y + 77, 308, 24, colors.muted);
        d.text(section.caption, 186, y + 232, 320, 20, colors.muted, 400, "middle");
      }
    } else {
      d.text(String(index + 1).padStart(2, "0"), 24, y + 43, 60, 25, colors.gold);
      d.text(section.title, 24, y + 85, 245, 26, colors.ink, 600);
      d.body.push(`<g transform="translate(278,${y + 5}) scale(0.93)">${section.graphic}</g>`);
      d.text(section.caption, 442, y + 202, 340, 23, colors.muted, 400, "middle");
      d.text(section.description, 670, y + 52, 418, 28, colors.muted);
    }
  });
  return d.finish();
}

export function renderHub(spec, viewport) {
  const n = spec.nodes;
  const phone = viewport === "phone";
  const width = phone ? 360 : 720;
  const d = canvas(width, phone ? 1630 : 1110, spec.title, spec.description);
  d.text(spec.title, 20, 36, width - 40, phone ? 26 : 32, colors.ink, 600);
  d.text(spec.subtitle, 20, 65, width - 40, 18, colors.muted);
  if (phone) {
    d.path("M68 579 H12 V165 H68", colors.muted);
    d.text(spec.groups.route, 28, 100, 320, 20, colors.cyan, 600);
    d.card(n.slack, 68, 122, 260, 110);
    d.path("M198 236 V260");
    d.label(spec.edges.messages, 258, 246, 120);
    d.card(n.route, 68, 266, 260, 110);
    d.path("M118 380 V492 H198 V511");
    d.label(spec.edges.request, 118, 420, 116);
    d.path("M332 315 H344 V410 H328", colors.purple);
    d.rect(176, 380, 152, 76, colors.purple);
    d.text(n.resolved.title, 252, 409, 136, 18, colors.purple, 600, "middle");
    d.text(n.resolved.detail, 252, 438, 136, 18, colors.muted, 400, "middle");
    d.text(spec.groups.agent, 162, 475, 178, 20, colors.cyan, 600);
    d.card(n.agent, 68, 517, 260, 119, colors.cyan);
    d.label(spec.edges.reply, 228, 680, 200, 18);
    d.path("M108 640 V706 H44 V1190", colors.cyan, "none");
    d.text(spec.groups.context, 78, 739, 246, 20, colors.gold, 600);
    spec.context.forEach((id, i) => {
      const y = 762 + i * 124;
      const h = id === "memory" ? 112 : 110;
      d.path(`M48 ${y + h / 2} H74`, colors.muted, "both");
      d.card(n[id], 78, y, 250, h, i === 3 ? colors.purple : colors.blue);
    });
    d.path("M332 564 H344 V1348 H332", colors.purple, "both");
    d.text(spec.groups.action, 28, 1280, 315, 20, colors.purple, 600);
    d.label(spec.edges.ticket, 197, 1311, 270, 17);
    d.card(n.ticket, 68, 1330, 260, 106, colors.purple);
    d.path("M198 1441 V1488", colors.muted, "both");
    d.label(spec.edges.create, 198, 1470, 210, 18);
    d.card(n.shortcut, 68, 1495, 260, 110, colors.purple);
  } else {
    d.text(spec.groups.route, 32, 104, 650, 22, colors.cyan, 600);
    d.card(n.slack, 32, 128, 242, 108);
    d.card(n.route, 396, 128, 288, 108);
    d.path("M280 178 H390");
    d.label(spec.edges.messages, 334, 165, 112, 18);
    d.path("M390 207 H358 V382 H360 V414");
    d.label(spec.edges.request, 350, 342, 110);
    d.path("M690 180 H704 V290 H684", colors.purple);
    d.card(n.resolved, 396, 255, 288, 72, colors.purple);
    d.text(spec.groups.agent, 32, 399, 650, 22, colors.cyan, 600);
    d.card(n.agent, 220, 420, 280, 120);
    d.path("M214 480 H12 V181 H26");
    d.label(spec.edges.reply, 136, 308, 215, 18);
    d.text(spec.groups.context, 34, 588, 610, 22, colors.gold, 600);
    d.path("M360 544 V817", colors.cyan, "none");
    spec.context.forEach((id, i) => {
      const left = i % 2 === 0;
      const x = left ? 34 : 396;
      const y = 620 + Math.floor(i / 2) * 142;
      d.path(left ? `M356 ${y + 55} H328` : `M364 ${y + 55} H390`, colors.muted, "both");
      d.card(n[id], x, y, 288, 116, i === 3 ? colors.purple : colors.blue);
    });
    d.path("M506 475 H704 V930 H180 V967", colors.purple, "both");
    d.label(spec.edges.ticket, 480, 917, 350, 20);
    d.text(spec.groups.action, 32, 913, 250, 22, colors.purple, 600);
    d.card(n.ticket, 32, 974, 288, 116, colors.purple);
    d.card(n.shortcut, 436, 974, 248, 116, colors.purple);
    d.path("M326 1036 H430", colors.muted, "both");
    d.label(spec.edges.create, 378, 1015, 110, 16);
  }
  return d.finish();
}

export const composedLayouts = { campaign: renderCampaign, stages: renderSearchStages, hub: renderHub };
