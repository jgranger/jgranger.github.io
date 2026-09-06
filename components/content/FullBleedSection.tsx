export function FullBleedSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative left-1/2 my-8 w-dvw -translate-x-1/2 overflow-x-auto">
      {children}
    </div>
  );
}
