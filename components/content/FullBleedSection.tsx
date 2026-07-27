export function FullBleedSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 w-screen relative left-1/2 -translate-x-1/2">
      {children}
    </div>
  );
}
