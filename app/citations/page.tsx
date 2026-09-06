import { CitationGraph } from "@/components/citations/CitationGraph";

export default function CitationsPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="mb-8 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
          Agentic Journey
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Citation Graph
        </h1>
        <p className="mt-4 text-base leading-7 text-white/65 sm:text-lg">
          The ideas in the book sit inside a larger graph of research, production experience and independent convergence. Explore the relationships and follow each node back to the paper, article or artifact behind it.
        </p>
      </div>

      <CitationGraph />
    </main>
  );
}
