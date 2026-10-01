const theme = { teal: "#54aaa5", purple: "#9678bd", blue: "#6398c0", ink: "#eeeae4", muted: "#bcc9cb", panel: "#101e27", edge: "#30434c" };

export function dogfoodingScene(kind) {
  const parts = [];
  const line = (d, color = theme.muted, arrow = false, opacity = 1) => parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" ${arrow ? 'marker-end="url(#arrow)"' : ""}/>`);
  const box = (x, y, w, h, color = theme.edge, fill = theme.panel, r = 5) => parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${color}" stroke-width="1.3"/>`);
  const text = (value, x, y, color = theme.muted, size = 14) => parts.push(`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="500">${value}</text>`);
  const dot = (x, y, color, r = 3) => parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`);
  const note = (x, y, w, color, marked = false) => {
    box(x, y, w, 28, color);
    dot(x + 10, y + 9, color, 2.5);
    line(`M${x + 19} ${y + 9} h${w - 28} M${x + 9} ${y + 18} h${w - 27}`, color, false, 0.7);
    if (marked) {
      box(x + w - 20, y + 17, 24, 16, color, "#152b30", 8);
      line(`M${x + w - 13} ${y + 25} l3 3 l6 -6`, theme.teal);
    }
  };
  const ticket = (x, y, color, w = 62, h = 42) => {
    box(x, y, w, h, color);
    line(`M${x + 8} ${y + 10} h${w - 16}`, color);
    box(x + 8, y + 18, 6, 6, color, "none", 1);
    line(`M${x + 20} ${y + 21} h${w - 28} M${x + 8} ${y + 32} h${w - 24}`, theme.muted, false, 0.65);
  };
  if (kind === "input") {
    parts.push('<g transform="rotate(-5 73 43)">');
    note(5, 5, 116, theme.teal);
    note(17, 43, 106, theme.teal);
    parts.push('</g>');
    box(146, 2, 111, 62, theme.purple);
    line("M152 12 H251", theme.purple, false, 0.5);
    dot(156, 7, theme.purple, 1.5);
    line("M159 51 L179 29 L194 42 L211 23 L244 51 Z", theme.purple);
    dot(232, 24, theme.purple, 4);
    parts.push('<g transform="rotate(4 195 89)">');
    box(123, 77, 145, 30, theme.blue);
    parts.push(`<path d="M136 85 L136 99 L146 92 Z" fill="${theme.blue}"/>`);
    line("M158 92 H255", theme.blue, false, 0.6);
    for (let i = 0; i < 13; i++) line(`M${161 + i * 7} ${92 - (i % 3 + 1) * 3} v${(i % 3 + 1) * 6}`, theme.blue);
    parts.push('</g>');
    line("M35 86 V108 H73", theme.teal, false, 0.65);
    note(73, 96, 38, theme.teal);
  } else if (kind === "anchor") {
    box(8, 28, 65, 58, theme.blue);
    line("M8 43 H73 M24 23 V33 M57 23 V33", theme.blue);
    [24,40,56].forEach(x => [55,69].forEach(y => dot(x, y, theme.blue, 2)));
    line("M77 57 H103", theme.blue, true);
    box(109, 13, 154, 89, theme.teal);
    box(122, 25, 51, 18, theme.teal, "#183131", 3);
    text("EPIC", 133, 38, theme.teal, 12);
    text("Session brief", 122, 66, theme.ink, 17);
    line("M122 78 H243 M122 86 H219", theme.muted, false, 0.55);
    line("M218 12 L226 4 L237 15 L229 23 Z M226 15 L216 25", theme.purple);
  } else if (kind === "mark") {
    note(8, 7, 170, theme.edge);
    note(25, 43, 194, theme.teal, true);
    note(8, 84, 170, theme.edge);
    parts.push(`<path d="M236 54 L236 79 L244 73 L251 83 L257 79 L250 69 L260 67 Z" fill="${theme.ink}" stroke="#070e11" stroke-width="2"/>`);
    line("M21 40 H14 V75 H21 M224 40 H231 V48", theme.teal);
  } else if (kind === "collect") {
    note(7, 2, 92, theme.teal, true);
    note(7, 43, 92, theme.blue, true);
    note(7, 84, 92, theme.purple, true);
    line("M113 17 H127 V57 H156 M113 58 H156 M113 99 H127 V57", theme.teal, true);
    box(169, 19, 91, 87, theme.edge);
    box(164, 13, 91, 87, theme.blue);
    box(159, 7, 91, 87, theme.teal);
    text("Context", 172, 30, theme.ink, 16);
    line("M172 42 H233 M172 50 H222 M172 64 V78 H184", theme.muted, false, 0.7);
    note(184, 59, 56, theme.purple);
  } else if (kind === "classify") {
    const xs = [9,101,193];
    const cs = [theme.teal,theme.purple,theme.blue];
    const labels = ["Issue","Request","Other"];
    [18,48,82,119,149,184,218,246].forEach((x,i) => box(x, 4 + i % 2 * 10, 17, 12, cs[i % 3], theme.panel, 2));
    line("M20 39 H257", theme.edge, false, 0.8);
    xs.forEach((x,i) => {
      line(`M${x + 34} 43 V62`, cs[i], true);
      box(x + 12, 70, 44, 20, cs[i], theme.panel, 3);
      line(`M${x + 5} 77 V97 H${x + 65} V77`, cs[i]);
      text(labels[i], x + (i === 1 ? 3 : 15), 117, cs[i], 14);
    });
  } else if (kind === "dedupe") {
    note(5, 5, 92, theme.purple);
    note(17, 40, 92, theme.purple);
    note(5, 75, 92, theme.purple);
    line("M113 20 L140 54 M122 54 H161 M113 89 L140 54", theme.purple, true);
    ticket(173, 30, theme.teal, 87, 58);
    box(229, 17, 33, 21, theme.teal, "#183131", 10);
    text("×3", 237, 33, theme.teal, 14);
    [184,199,214].forEach(x => line(`M${x} 93 v12`, theme.purple));
  } else if (kind === "route") {
    ticket(8, 35, theme.teal, 77, 55);
    line("M91 61 H126 V24 H162 M126 61 H162 M126 61 V98 H162", theme.blue, true);
    [5,44,83].forEach((y,i) => {
      const color = [theme.teal,theme.blue,theme.purple][i];
      box(174, y, 86, 31, color);
      parts.push(`<circle cx="187" cy="${y + 10}" r="3.5" fill="none" stroke="${color}" stroke-width="1.4"/>`);
      line(`M181 ${y + 23} Q187 ${y + 14} 193 ${y + 23} M202 ${y + 12} H250 M202 ${y + 20} H236`, color);
    });
  } else if (kind === "close") {
    box(35, 10, 198, 103, theme.edge);
    note(47, 22, 147, theme.blue);
    line("M60 55 V81 H76", theme.teal);
    note(77, 65, 142, theme.teal, true);
    line("M88 105 C15 137 -2 57 26 33", theme.purple, true);
    line("M208 17 C276 -2 283 87 241 92", theme.teal, true);
  } else if (kind === "ticket") {
    ticket(7, 12, theme.teal, 44, 42);
  } else if (kind === "document") {
    box(11, 8, 36, 49, theme.purple);
    line("M19 21 H39 M19 29 H39 M19 37 H34 M19 45 H39", theme.purple);
  } else if (kind === "thread") {
    note(3, 7, 42, theme.blue);
    line("M10 40 V50 H20", theme.blue);
    note(20, 36, 33, theme.teal);
  }
  return parts.join("");
}
