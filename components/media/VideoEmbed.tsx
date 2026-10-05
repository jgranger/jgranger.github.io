// Accepts a YouTube watch/share link as src and plays it through YouTube's
// own player, so a chapter can embed a talk without re-hosting the file.
function youTubeId(src: string): string | null {
  const match = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

export function VideoEmbed({
  src,
  title,
  poster,
  description,
  size = "sm",
}: {
  src: string;
  title: string;
  poster?: string;
  description?: string;
  /**
   * "lg" is 1.5x the default width (max-w-xl vs max-w-sm). "wide" matches
   * "lg" on phones and tablets, then on desktop sits just inside the
   * full-column screenshots around it.
   */
  size?: "sm" | "lg" | "wide";
}) {
  const maxWidth = {
    sm: "max-w-sm",
    lg: "max-w-xl",
    wide: "max-w-xl lg:max-w-[calc(100%-30px)]",
  }[size];
  return (
    <figure className={`my-8 mx-auto w-full ${maxWidth}`}>
      {youTubeId(src) ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youTubeId(src)}`}
          title={title}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="block aspect-video w-full rounded-lg border border-border"
        />
      ) : (
        <video
          controls
          playsInline
          poster={poster}
          aria-label={title}
          className="w-full rounded-lg border border-border"
        >
          <source src={src} />
        </video>
      )}
      <figcaption className="mt-2 text-small text-foreground-subtle">
        {title}
        {description && <span> — {description}</span>}
      </figcaption>
    </figure>
  );
}
