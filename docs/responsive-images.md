# Viewport-specific book images

Chapter image references stay unchanged. The content build discovers siblings of the original image:

- `example.png`: desktop and fallback image
- `example.phone.svg`: below 640 CSS pixels
- `example.tablet.svg`: 640 through 1023 CSS pixels

Variants may use SVG, WebP, PNG, or JPEG. Only one file per viewport is allowed. The browser chooses the source with a native picture element. Opening the viewer uses the image the reader actually saw. Without a matching variant the original remains visible.

Place artwork and diagram definitions in the private content repository. Both production promotion and local preview discover the same variants. Source chapter files do not need editing.

## Generated diagrams

Definitions in `responsive-diagrams/*.json` generate phone and tablet SVGs during the content build. Each definition contains `source`, `title`, and `sections`. Sections support `title`, `description`, `nodes`, and an optional exact vector `graphic` with `graphicHeight`. Each node has `text`, optional `next` connector text, and optional `color`. Newlines are preserved. Labels and descriptions are wrapped for each viewport.

Use generated diagrams for precise layouts. Use separately authored variant artwork when preserving an illustration requires art direction. Do not automatically crop diagrams or assume that reducing pixel dimensions improves readability.

Run `npm run images:audit` to list chapter image references and their variant coverage. The command also generates defined variants. Missing variants are review candidates, not failures: photographs and simple diagrams can use their original composition.

Review the rendered phone and tablet assets before publishing new definitions. Verify all branches, loops, labels, and return paths against the original. Existing source images remain the desktop version.

## Composition rules

Viewport changes can alter the layout and level of detail, not only the image dimensions. The `layout` field selects a reusable composition:

| Layout | Phone | Tablet | Desktop |
| --- | --- | --- | --- |
| `campaign` | Vertical icon cards with short captions | Wider vertical rows | Original horizontal artwork |
| `campaign` with `agent` | A shared monitoring line connects every stage to the agent | Wider rows with the same shared connection | Original artwork |
| `hub` | Main route, shared capabilities, and optional handoff occupy separate areas | Main route above a two-column capability group | Original architecture |
| `stages` | Stage labels, graphics, and short captions only | Graphics beside concise explanations | Stage title, graphic, and concise explanation columns |

A shared capability connection must not imply that tools run sequentially. Return paths, routing exits, and conditional handoffs must remain visible. Longer phone explanations belong in the chapter or an optional detail block, not inside a reduced diagram.

`viewports` defaults to `["phone", "tablet"]`. Include `desktop` when the desktop artwork also needs revision. The generated `.desktop.svg` becomes the default image without changing the chapter reference. Original source files are retained.

Use `caption` for a stage's short action label and `description` for its concise larger-screen explanation. A capability node can supply `phoneDetail` to reduce supporting labels on a narrow screen. These are editorial choices in one private definition, not separate files maintained by hand.
