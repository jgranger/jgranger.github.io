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
  /** "lg" is 1.5x the default width (max-w-xl vs max-w-sm). */
  size?: "sm" | "lg";
}) {
  const maxWidth = size === "lg" ? "max-w-xl" : "max-w-sm";
  return (
    <figure className={`my-8 mx-auto w-full ${maxWidth}`}>
      <video
        controls
        playsInline
        poster={poster}
        aria-label={title}
        className="w-full rounded-lg border border-border"
      >
        <source src={src} />
      </video>
      <figcaption className="mt-2 text-small text-foreground-subtle">
        {title}
        {description && <span> — {description}</span>}
      </figcaption>
    </figure>
  );
}
