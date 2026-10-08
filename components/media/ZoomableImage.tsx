"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const SCALE_STEP = 0.5;

type ZoomableImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  phoneSrc?: string;
  tabletSrc?: string;
  desktopSrc?: string;
  fullSrc?: string;
};

export function ZoomableImage(props: ZoomableImageProps) {
  const { src, phoneSrc, tabletSrc, desktopSrc, fullSrc, alt, width, height, className, style, ...rest } = props;
  const [viewerSrc, setViewerSrc] = useState(fullSrc || desktopSrc || src);
  // Obsidian's ![[file.png|420]] resize arrives as `width`. `.prose img`
  // forces width: auto, so a plain width attribute is ignored — apply it
  // as a cap instead, never wider than the column.
  const inlineStyle = width ? { ...style, maxWidth: `min(100%, ${width}px)` } : style;
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(MIN_SCALE);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setScale(MIN_SCALE);
    if (canvasRef.current) {
      canvasRef.current.scrollTop = 0;
      canvasRef.current.scrollLeft = 0;
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    reset();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, [reset]);

  const setClampedScale = useCallback((nextScale: number) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    setScale(clamped);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "+" || event.key === "=") setClampedScale(scale + SCALE_STEP);
      if (event.key === "-") setClampedScale(scale - SCALE_STEP);
      if (event.key === "0") reset();
      if (event.key === "Tab") {
        const controls = viewerRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close, reset, scale, setClampedScale]);

  if (!src) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          setViewerSrc(fullSrc || event.currentTarget.querySelector("img")?.currentSrc || desktopSrc || src);
          reset();
          setOpen(true);
        }}
        aria-label={alt ? `Open image viewer: ${alt}` : "Open image viewer"}
        className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <picture>
          {phoneSrc && <source media="(max-width: 639px)" srcSet={phoneSrc} />}
          {tabletSrc && <source media="(min-width: 640px) and (max-width: 1023px)" srcSet={tabletSrc} />}
          <img src={desktopSrc || src} alt={alt ?? ""} height={phoneSrc || tabletSrc ? undefined : height} className={className} style={inlineStyle} {...rest} />
        </picture>
      </button>

      {open && createPortal(
        <div
          ref={viewerRef}
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Image viewer"}
          className="image-viewer fixed inset-0 z-50 bg-black/95"
        >
          <div className="image-viewer__controls gap-1 rounded-full border border-white/20 bg-black/70 p-1 text-white shadow-lg">
            <button type="button" onClick={() => setClampedScale(scale - SCALE_STEP)} disabled={scale <= MIN_SCALE} aria-label="Zoom out" className="flex h-11 w-11 items-center justify-center rounded-full text-xl disabled:opacity-30">−</button>
            <button type="button" onClick={reset} aria-label="Reset zoom" className="min-h-11 min-w-16 rounded-full px-3 py-2 text-sm tabular-nums">{Math.round(scale * 100)}%</button>
            <button type="button" onClick={() => setClampedScale(scale + SCALE_STEP)} disabled={scale >= MAX_SCALE} aria-label="Zoom in" className="flex h-11 w-11 items-center justify-center rounded-full text-xl disabled:opacity-30">+</button>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close image viewer"
            className="image-viewer__close flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/70 text-2xl leading-none text-white hover:border-white/50"
          >
            ×
          </button>

          <div ref={canvasRef} className="image-viewer__canvas" tabIndex={0} aria-label="Scrollable image">
            <img
              src={viewerSrc}
              alt={alt ?? ""}
              draggable={false}
              className="image-viewer__image"
              style={{ width: `calc(min(100vw - 2rem, 1200px) * ${scale})` }}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
