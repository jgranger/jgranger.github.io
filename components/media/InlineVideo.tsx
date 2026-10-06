import { ZoomableImage } from "@/components/media/ZoomableImage";

// A video dropped into a chapter with Obsidian's ![[clip.mp4]] or
// ![[clip.mp4|1250]]. Mirrors ZoomableImage's sizing so a clip sits at the
// same width and in the same frame as the screenshots around it.
//
// A clip.phone.png beside the video (same convention as image variants)
// replaces it on phones, where a screen recording is too small to read.
export function InlineVideo({ src, width, phoneSrc }: { src: string; width?: string | number; phoneSrc?: string }) {
  const animated = /(?:^|\/)neural-pathways-volume\.mp4(?:\?|$)/.test(src);
  const style = width ? { maxWidth: `min(100%, ${width}px)` } : undefined;
  const video = (
    <video
      className={phoneSrc ? "book-video book-video--has-phone" : "book-video"}
      src={src}
      controls
      autoPlay={animated}
      muted={animated}
      loop={animated}
      playsInline
      preload="metadata"
      style={style}
    />
  );
  if (!phoneSrc) return video;
  return (
    <>
      {video}
      <div className="book-video-phone">
        <ZoomableImage src={phoneSrc} alt="" />
      </div>
    </>
  );
}
