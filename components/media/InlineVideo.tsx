// A video dropped into a chapter with Obsidian's ![[clip.mp4]] or
// ![[clip.mp4|1250]]. Mirrors ZoomableImage's sizing so a clip sits at the
// same width and in the same frame as the screenshots around it.
export function InlineVideo({ src, width }: { src: string; width?: string | number }) {
  const style = width ? { maxWidth: `min(100%, ${width}px)` } : undefined;
  return <video className="book-video" src={src} controls playsInline preload="metadata" style={style} />;
}
