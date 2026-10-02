const slackMark = "data:image/png;base64,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";
const shortcutMark = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyOCI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik05LjMxODQxIDguMTQ2NDFlLTA3TDI5LjE3ODQgMi41NTA4NmUtMDZMMjAuMTg3IDkuNTk5ODlMMjkuMDA1OSAxOC4xNTQxTDE5LjkyMDIgMjcuODU0MUwtMi40MzQ2NmUtMDYgMjcuODQ5Mkw5LjAyOTA5IDE4LjIwOTFMMC4yNDQ5ODEgOS42ODkzNkw5LjMxODQxIDguMTQ2NDFlLTA3Wk0xMC42NTA1IDE5Ljc4MThMNS4yMDg0NCAyNS41OTIxTDE2LjY0NCAyNS41OTQ5TDEwLjY1MDUgMTkuNzgxOFpNMTkuMzkyMiAyNS4xMTQyTDEyLjE5NDYgMTguMTMzMkwxOC42NDI5IDExLjI0ODVMMjUuODQwNCAxOC4yMjk5TDE5LjM5MjIgMjUuMTE0MlpNMTcuMDIxNiA5LjY3NTgxTDEwLjU3MzIgMTYuNTYwNkwzLjQxMDMyIDkuNjEzMjNMOS44NTgyNyAyLjcyNzU4TDE3LjAyMTYgOS42NzU4MVpNMTguNTY1NyA4LjAyNzIyTDIzLjk2ODggMi4yNTg0M0wxMi42MTgzIDIuMjU4NDNMMTguNTY1NyA4LjAyNzIyWiIgZmlsbD0iIzQ5NEJDQiIvPjwvc3ZnPg==";
const theme = { teal: "#54aaa5", purple: "#9678bd", blue: "#6398c0", ink: "#eeeae4", muted: "#bcc9cb", panel: "#101e27", edge: "#30434c" };

export function dogfoodingScene(kind) {
  const parts = [];
  const line = (d, color = theme.muted, arrow = false, opacity = 1) => parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" ${arrow ? 'marker-end="url(#arrow)"' : ""}/>`);
  const box = (x, y, w, h, color = theme.edge, fill = theme.panel, r = 5) => parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${color}" stroke-width="1.3"/>`);
  const text = (value, x, y, color = theme.muted, size = 14) => parts.push(`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="500">${value}</text>`);
  const dot = (x, y, color, r = 3) => parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`);
  const brand = (name, x, y, size = 18) => parts.push(`<image x="${x}" y="${y}" width="${size}" height="${size}" href="${name === "slack" ? slackMark : shortcutMark}"/>`);
  const slackHeader = (label, x = 8, y = 2, w = 258) => {
    box(x, y, w, 30, theme.teal, "#10272b", 5);
    brand("slack", x + 8, y + 6, 18);
    text(label, x + 34, y + 20, theme.ink, 14);
  };
  const message = (x, y, w, label, detail, color = theme.teal) => {
    box(x, y, 20, 20, color, "#183038", 4);
    text(label.slice(0,1), x + 5, y + 15, color, 13);
    text(label, x + 29, y + 13, theme.ink, 14);
    text(detail, x + 29, y + 32, theme.muted, 13);
  };
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
    box(0, 0, 274, 130, theme.edge, "#0e1c24", 7);
    slackHeader("# dogfooding", 0, 0, 274);
    message(12, 42, 246, "Feedback", "Message + screenshot", theme.teal);
    box(42, 84, 86, 33, theme.purple, "#211e32", 3);
    line("M48 110 L63 95 L78 103 L91 91 L119 110", theme.purple);
    box(139, 84, 117, 33, theme.blue, "#162a39", 3);
    parts.push(`<path d="M148 94 L148 107 L159 100 Z" fill="${theme.blue}"/>`);
    line("M171 100 H245", theme.blue);
    [181,190,199,208,217,226].forEach((x,i) => line(`M${x} ${96-i%3*2} V${104+i%3*2}`, theme.blue));
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
    slackHeader("# dogfooding");
    message(18, 45, 245, "Feedback", "A request worth capturing", theme.purple);
    box(47, 86, 56, 25, theme.teal, "#173738", 12);
    line("M58 98 L63 103 L72 92", theme.teal);
    text("1", 84, 103, theme.ink, 14);
    parts.push(`<path d="M112 98 L112 117 L118 112 L124 121 L129 118 L123 109 L132 107 Z" fill="${theme.ink}"/>`);
    text("Selected", 153, 103, theme.teal, 14);
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
    box(0, 18, 133, 91, theme.purple, "#1c2032", 6);
    brand("shortcut", 10, 28, 18);
    text("Ticket", 36, 43, theme.ink, 15);
    line("M11 56 H119 M11 64 H98", theme.muted, false, 0.65);
    box(10, 77, 74, 20, theme.teal, "#153032", 10);
    text("Assigned", 18, 91, theme.teal, 12);
    line("M140 65 H154 V23 H176 M154 65 H176 M154 65 V105 H176", theme.blue, true);
    [5,47,89].forEach((y,i) => {
      const color = [theme.teal,theme.blue,theme.purple][i];
      box(184, y, 86, 33, color, ["#14302f","#182a39","#242139"][i]);
      parts.push(`<circle cx="197" cy="${y + 11}" r="3.5" fill="none" stroke="${color}" stroke-width="1.4"/>`);
      line(`M191 ${y + 25} Q197 ${y + 16} 203 ${y + 25}`, color);
      text("Owner", 211, y + 21, theme.ink, 13);
    });
  } else if (kind === "close") {
    parts.push('<g transform="translate(10,0) scale(0.88)">');
    box(5, 0, 246, 137, theme.edge, "#101d26", 6);
    slackHeader("Thread", 5, 0, 246);
    message(16, 41, 223, "Original feedback", "Request or issue", theme.blue);
    line("M24 73 V103 H42", theme.teal);
    box(44, 86, 190, 37, theme.teal, "#143034", 5);
    brand("shortcut", 53, 94, 19);
    text("Ticket + outcome", 80, 109, theme.ink, 14);
    line("M249 113 C281 107 288 46 263 32", theme.purple, true);
    parts.push("</g>");
  } else if (kind === "ticket") {
    brand("shortcut", 12, 17, 32);
  } else if (kind === "document") {
    box(11, 8, 36, 49, theme.purple);
    line("M19 21 H39 M19 29 H39 M19 37 H34 M19 45 H39", theme.purple);
  } else if (kind === "thread") {
    brand("slack", 10, 16, 34);
  }
  return parts.join("");
}
