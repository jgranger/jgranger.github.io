#!/usr/bin/env python3
"""Build public/collision-mask.png from Jon's hand-marked image map
(public/golf-course-defined.jpg): green = wall/solid, orange = energy-wall
hazard (currently treated as solid too), magenta = hole position marker
(informational only here — GolfGame.tsx's HOLE constant was set from it
separately, this script doesn't need to re-derive it).

Output is a grayscale PNG at the game's canvas resolution (1000x278):
255 = walkable floor, 0 = solid. GolfGame.tsx samples it directly at
runtime (see ballFits/isWalkable) instead of approximating walls with
hand-traced rects/circles/segments.

No erosion is applied here for the ball's radius — that would double-count
it, since ballFits() already ring-samples 8 points at the ball's actual
collision radius against this mask at runtime. Baking erosion into the
mask on top of that closes real passages (this exact bug cost a full
debugging pass: a 15px pre-erosion made the hole provably unreachable).

Re-run this whenever golf-course-defined.jpg changes:
  python3 scripts/build-collision-mask.py
"""

from PIL import Image
from collections import deque
import os

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_MAP = os.path.join(REPO_ROOT, "public", "golf-course-defined.jpg")
OUTPUT_MASK = os.path.join(REPO_ROOT, "public", "collision-mask.png")

CANVAS_WIDTH = 1000
CANVAS_HEIGHT = 278

# Same tee position as GolfGame.tsx's TEE constant, in the source image's
# native resolution — the flood fill seeds from here.
TEE_SEED = (265, 295)

# JPEG compression introduces stray green/orange-ish pixels well outside
# anything Jon actually drew — a handful of 1-6px specks scattered near
# real linework. Left in, a speck this small barely shows in the raw mask
# but (previously, when erosion was still applied) got inflated into a
# meaningfully-sized fake wall. Every real hand-drawn component was 548px
# or larger, so 50px is a comfortable, unambiguous cutoff.
MIN_COMPONENT_PX = 50


def is_green(r, g, b):
    return g > 150 and r < 120 and b < 120


def is_orange(r, g, b):
    return r > 180 and 80 < g < 180 and b < 100


def main():
    im = Image.open(SOURCE_MAP).convert("RGB")
    w, h = im.size
    px = im.load()

    raw_barrier = set()
    for x in range(w):
        for y in range(h):
            r, g, b = px[x, y]
            if is_green(r, g, b) or is_orange(r, g, b):
                raw_barrier.add((x, y))

    visited = set()
    barrier = bytearray(w * h)
    for p in list(raw_barrier):
        if p in visited:
            continue
        comp = []
        q = deque([p])
        visited.add(p)
        while q:
            cx, cy = q.popleft()
            comp.append((cx, cy))
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    np_ = (cx + dx, cy + dy)
                    if np_ in raw_barrier and np_ not in visited:
                        visited.add(np_)
                        q.append(np_)
        if len(comp) >= MIN_COMPONENT_PX:
            for cx, cy in comp:
                barrier[cy * w + cx] = 1

    walkable = bytearray(w * h)
    seed = TEE_SEED
    q = deque([seed])
    walkable[seed[1] * w + seed[0]] = 1
    while q:
        cx, cy = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h:
                idx = ny * w + nx
                if not walkable[idx] and not barrier[idx]:
                    walkable[idx] = 1
                    q.append((nx, ny))

    mask = Image.new("L", (w, h), 0)
    mpx = mask.load()
    for x in range(w):
        for y in range(h):
            mpx[x, y] = 255 if walkable[y * w + x] else 0

    mask.resize((CANVAS_WIDTH, CANVAS_HEIGHT), Image.NEAREST).save(OUTPUT_MASK)
    print(f"saved {OUTPUT_MASK} ({CANVAS_WIDTH}x{CANVAS_HEIGHT})")


if __name__ == "__main__":
    main()
