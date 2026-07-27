export function WideSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 w-full max-w-(--width-wide) mx-auto px-4">
      {children}
    </div>
  );
}
