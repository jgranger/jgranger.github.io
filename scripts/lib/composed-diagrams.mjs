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
  const card = (node, x, y, w, h, color = colors.cyan, titleColor = color) => {
    rect(x, y, w, h, color);
    const head = text(node.title, x + 16, y + 32, w - 32, 22, titleColor, 600);
    if (node.detail) text(width <= 400 ? node.phoneDetail || node.detail : node.detail, x + 16, y + 40 + head, w - 32, width <= 400 ? 20 : 18, colors.muted);
  };
  const finish = () => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(description)}</desc><defs><linearGradient id="agent-edge" x1="0%" y1="0%" x2="100%" y2="0%"><stop stop-color="#00d5ed"/><stop offset="0.5" stop-color="#328cff"/><stop offset="1" stop-color="#df27ed"/></linearGradient><linearGradient id="campaign-agent-edge" x1="0%" y1="0%" x2="100%" y2="0%"><stop stop-color="#55a9ef"/><stop offset="0.2" stop-color="#ffda8c"/><stop offset="0.8" stop-color="#ffda8c"/><stop offset="1" stop-color="#9473ef"/></linearGradient><linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors.cyan}"/><stop offset="1" stop-color="${colors.purple}"/></linearGradient><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${colors.muted}"/></marker></defs><rect width="100%" height="100%" fill="#070e11"/><g font-family="Arial, sans-serif">${body.join("")}</g></svg>`;
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
  const gap = phone ? 24 : 26;
  const cardHeight = 112;
  const agentOnTop = phone && rail;
  const start = agentOnTop ? 348 : 96;
  const total = start + spec.steps.length * (cardHeight + gap);
  const height = total + (rail && !agentOnTop ? 258 : 10);
  const d = canvas(width, height, spec.title, spec.description);
  d.text(spec.title, 20, 34, width - 40, phone ? 25 : 30, colors.ink, 600);
  const x = rail ? 46 : 20;
  const w = width - x - 20;
  const center = x + w / 2;
  if (rail) d.path(agentOnTop
    ? `M40 298 V308 H18 V${total - gap - cardHeight / 2}`
    : `M18 ${start + cardHeight / 2} V${total + 80} H46`, colors.gold, "none", true);
  spec.steps.forEach((step, i) => {
    const y = start + i * (cardHeight + gap);
    const color = [colors.cyan, colors.blue, colors.purple, colors.purple, colors.cyan][i % 5];
    d.rect(x, y, w, cardHeight, "url(#edge)");
    d.body.push(phone
      ? `<g transform="translate(${x + 16},${y + 12}) scale(0.75)">${icon(step.icon, 0, 0, rail ? colors.gold : color)}</g>`
      : icon(step.icon, x + 16, y + 14, rail ? colors.gold : color));
    if (phone) {
      d.text(String(i + 1).padStart(2, "0"), x + w - 19, y + 36, 40, 18, colors.muted, 400, "end");
      d.text(step.title, x + 16, y + 68, w - 32, 19, colors.ink, 600);
      d.text(step.caption, x + 16, y + 94, w - 32, 18, colors.muted);
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
    const ax = phone ? 20 : 46;
    const ay = agentOnTop ? 96 : total + 38;
    const aw = width - ax - 20;
    const ah = phone ? 202 : 190;
    const ink = colors.ink;
    d.text(spec.agent.connection, 46, agentOnTop ? 326 : total + 11, width - 66, phone ? 18 : 22, colors.gold);
    d.body.push(`<rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" rx="16" fill="#080f12" stroke="url(#campaign-agent-edge)" stroke-width="3"/>`);
    d.body.push(`<circle cx="${ax + 39}" cy="${ay + 48}" r="28" fill="none" stroke="url(#campaign-agent-edge)" stroke-width="2"/>`);
    d.body.push(`<g transform="translate(${ax + 23},${ay + 25})" fill="none" stroke="${colors.gold}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="10" r="7"/><path d="M5 27V25A11 11 0 0 1 27 25V27M3 28H29V44H3ZM3 28L16 38L29 28"/></g>`);
    d.text(spec.agent.title, ax + 78, ay + 44, phone ? aw - 110 : aw - 96, phone ? 26 : 28, ink, 700);
    d.body.push(`<rect x="${ax + 20}" y="${ay + (phone ? 98 : 82)}" width="${aw - 40}" height="2" rx="1" fill="url(#campaign-agent-edge)"/>`);
    d.text(phone ? spec.agent.phoneDetail || spec.agent.detail : spec.agent.detail, ax + 20, ay + (phone ? 130 : 108), aw - 40, phone ? 19 : 22, colors.muted);
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
  const d = canvas(width, phone ? 800 : 1110, spec.title, spec.description);
  d.text(spec.title, 20, 36, width - 40, phone ? 26 : 32, colors.ink, 600);
  d.text(spec.subtitle, 20, 65, width - 40, 18, colors.muted);
  if (phone) {
    const node = (id, x, y, w, h, color = colors.blue) => {
      d.rect(x, y, w, h, color);
      const size = 18;
      const title = n[id].title.replaceAll("-", "-\n");
      const count = lines(title, w - 16, size).length;
      d.text(title, x + w / 2, y + h / 2 + 7 - (count - 1) * size * 0.65, w - 16, size, colors.ink, 600, "middle");
    };
    node("slack", 16, 104, 128, 60, colors.cyan);
    node("route", 214, 104, 130, 60, colors.cyan);
    d.path("M148 133 H208");
    d.label(spec.edges.messages, 179, 92, 124, 18);
    d.path("M280 168 V190", colors.purple);
    node("resolved", 214, 196, 130, 62, colors.purple);
    d.path("M348 134 H354 V410 H300", colors.cyan);
    d.label(spec.edges.request, 294, 371, 104, 18);
    d.path("M60 410 H6 V178 H48 V168", colors.cyan);
    d.label(spec.edges.reply, 81, 199, 144, 18);
    node("docs", 12, 266, 174, 60);
    node("code", 216, 266, 128, 60);
    d.path("M98 332 V346 H126 V378", colors.blue, "both");
    d.path("M280 332 V346 H234 V378", colors.blue, "both");
    d.rect(64, 384, 232, 114, "url(#agent-edge)");
    d.text(n.agent.title, 180, 417, 216, 20, "#c4e7ff", 600, "middle");
    d.text(n.agent.phoneDetail || n.agent.detail, 180, 451, 216, 18, colors.muted, 400, "middle");
    d.path("M126 504 V526 H90 V545", colors.blue, "both");
    d.path("M234 504 V526 H274 V545", colors.purple, "both");
    node("data", 16, 552, 148, 62);
    node("memory", 206, 552, 138, 62, colors.purple);
    d.path("M180 504 V652 H87 V698", colors.purple, "both");
    d.label(spec.edges.ticket, 181, 650, 300, 18);
    node("ticket", 16, 704, 142, 62, colors.purple);
    node("shortcut", 214, 704, 130, 62, colors.purple);
    d.path("M164 735 H208", colors.purple, "both");
    d.label(spec.edges.create, 180, 789, 250, 18);
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
    d.card(n.agent, 220, 420, 280, 120, "url(#agent-edge)", "#c4e7ff");
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

export function renderMessageLoop(spec) {
  const d = canvas(360, 476, spec.title, spec.description);
  d.text(spec.title, 20, 34, 320, 26, colors.ink, 600);
  const positions = [[16, 112, 136], [210, 112, 134], [210, 352, 134]];
  spec.nodes.forEach((node, i) => {
    const [x, y, w] = positions[i];
    const color = [colors.cyan, colors.blue, colors.purple][i];
    d.rect(x, y, w, 104, "url(#edge)");
    const cx = x + w / 2;
    if (node.icon === "person") {
      d.body.push(`<g transform="translate(${cx - 14},${y + 14})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"><circle cx="14" cy="8" r="7"/><path d="M1 34V29A13 13 0 0 1 27 29V34Z"/></g>`);
    } else if (node.icon === "product") {
      d.body.push(`<g transform="translate(${cx - 17},${y + 12})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"><path d="M17 0L34 10V30L17 40L0 30V10ZM0 10L17 20L34 10M17 20V40"/></g>`);
    }
    d.text(node.title, cx, y + (node.icon ? 73 : 59), w - 12, 18, colors.ink, 600, "middle");
  });
  d.path("M84 106 V82 H277 V106");
  d.label(spec.messages[0], 180, 67, 310, 18);
  d.path("M277 222 V346");
  d.label(spec.messages[1], 270, 274, 172, 18);
  d.path("M204 404 H84 V222");
  d.label(spec.messages[2], 88, 294, 152, 18);
  return d.finish();
}

export const composedLayouts = { campaign: renderCampaign, stages: renderSearchStages, hub: renderHub, messageLoop: renderMessageLoop };
