"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const SCALE_STEP = 0.5;

type Point = { x: number; y: number };

export function ZoomableImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { src, alt, width, height, className, ...rest } = props;
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(MIN_SCALE);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const dragStartRef = useRef<{ point: Point; offset: Point } | null>(null);
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);

  const reset = useCallback(() => {
    setScale(MIN_SCALE);
    setOffset({ x: 0, y: 0 });
    pointersRef.current.clear();
    dragStartRef.current = null;
    pinchStartRef.current = null;
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    reset();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, [reset]);

  const setClampedScale = useCallback((nextScale: number) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    setScale(clamped);
    if (clamped === MIN_SCALE) setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "+" || event.key === "=") setClampedScale(scale + SCALE_STEP);
      if (event.key === "-") setClampedScale(scale - SCALE_STEP);
      if (event.key === "0") reset();
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

  const pointerDistance = () => {
    const points = [...pointersRef.current.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 1 && scale > MIN_SCALE) {
      dragStartRef.current = {
        point: { x: event.clientX, y: event.clientY },
        offset,
      };
    }

    if (pointersRef.current.size === 2) {
      pinchStartRef.current = { distance: pointerDistance(), scale };
      dragStartRef.current = null;
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size >= 2 && pinchStartRef.current) {
      const distance = pointerDistance();
      if (pinchStartRef.current.distance > 0) {
        setClampedScale(pinchStartRef.current.scale * (distance / pinchStartRef.current.distance));
      }
      return;
    }

    if (scale > MIN_SCALE && dragStartRef.current) {
      setOffset({
        x: dragStartRef.current.offset.x + event.clientX - dragStartRef.current.point.x,
        y: dragStartRef.current.offset.y + event.clientY - dragStartRef.current.point.y,
      });
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;
    if (pointersRef.current.size === 0) dragStartRef.current = null;
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setClampedScale(scale + (event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP));
  };

  const toggleZoom = () => {
    if (scale > MIN_SCALE) reset();
    else setClampedScale(2);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={alt ? `Open image viewer: ${alt}` : "Open image viewer"}
        className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} width={width} height={height} className={className} {...rest} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Image viewer"}
          className="fixed inset-0 z-50 bg-black/95"
        >
          <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/20 bg-black/70 p-1 text-white shadow-lg">
            <button type="button" onClick={() => setClampedScale(scale - SCALE_STEP)} disabled={scale <= MIN_SCALE} aria-label="Zoom out" className="flex h-10 w-10 items-center justify-center rounded-full text-xl disabled:opacity-30">−</button>
            <button type="button" onClick={reset} aria-label="Reset zoom" className="min-w-16 rounded-full px-3 py-2 text-sm tabular-nums">{Math.round(scale * 100)}%</button>
            <button type="button" onClick={() => setClampedScale(scale + SCALE_STEP)} disabled={scale >= MAX_SCALE} aria-label="Zoom in" className="flex h-10 w-10 items-center justify-center rounded-full text-xl disabled:opacity-30">+</button>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close image viewer"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/70 text-2xl leading-none text-white hover:border-white/50"
          >
            ×
          </button>

          <div
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={toggleZoom}
            className={`flex h-full w-full select-none items-center justify-center overflow-hidden p-4 pt-20 sm:p-8 sm:pt-20 ${scale > MIN_SCALE ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
            style={{ touchAction: "none" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt ?? ""}
              draggable={false}
              onClick={(event) => event.stopPropagation()}
              className="max-h-full max-w-full object-contain will-change-transform"
              style={{
                transform: `translate(${offset.x / scale}px, ${offset.y / scale}px) scale(${scale})`,
                transformOrigin: "center center",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
