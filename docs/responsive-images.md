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
