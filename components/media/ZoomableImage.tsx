"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Chapter images, click-to-enlarge.
 *
 * Mapped as `img` in ChapterView's MDX components, so every image the
 * promote script emits becomes zoomable without any markup in the
 * source chapter. Inline, the image renders as it always did — the
 * only additions are a button wrapper for keyboard access and a zoom
 * cursor. Clicking opens the same file scaled to the viewport, which
 * is a real resolution gain: the originals are 1250-1670px wide and
 * the chapter column shows them at ~1088px.
 *
 * No dependency and no portal — a fixed-position overlay is enough,
 * and this has to work under `output: 'export'` with no server.
 */
export function ZoomableImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { src, alt, width, height, className, ...rest } = props;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    // Send focus back where it came from, so keyboard users don't get
    // dropped at the top of the document after closing.
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    // Lock scrolling behind the overlay, restoring whatever the page
    // had rather than assuming it was the default.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  if (!src) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={alt ? `Enlarge image: ${alt}` : "Enlarge image"}
        className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} width={width} height={height} className={className} {...rest} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Enlarged image"}
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close enlarged image"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-2xl leading-none text-white hover:border-white/50"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt ?? ""}
            onClick={(event) => event.stopPropagation()}
            className="max-h-full max-w-full cursor-zoom-out object-contain"
          />
        </div>
      )}
    </>
  );
}
