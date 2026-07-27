export function VideoEmbed({
  src,
  title,
  poster,
  description,
}: {
  src: string;
  title: string;
  poster?: string;
  description?: string;
}) {
  return (
    <figure className="my-8">
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
