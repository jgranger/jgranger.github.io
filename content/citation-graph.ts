export type CitationLink = {
  label: string;
  url: string;
  kind: "paper" | "article" | "talk" | "book" | "artifact" | "post";
};

export type CitationNode = {
  id: string;
  title: string;
  type: "concept" | "research" | "experience";
  chapter?: number;
  subtitle?: string;
  summary: string;
  x: number;
  y: number;
  links: CitationLink[];
};

export type CitationEdge = {
  source: string;
  target: string;
  relationship:
    | "supports"
    | "challenges"
    | "independent convergence"
    | "implemented as"
    | "observed in production"
    | "extends";
};

export const citationNodes: CitationNode[] = [
  {
    id: "operational-context",
    title: "Operational Context",
    type: "concept",
    chapter: 3,
    subtitle: "Smallest useful working state",
    summary:
      "The right context is not the largest context. It is the smallest high-signal neighborhood needed for the work in front of the agent.",
    x: 250,
    y: 150,
    links: [
      {
        label: "Effective context engineering for AI agents",
        url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
        kind: "article",
      },
      {
        label: "Context Rot",
        url: "https://www.trychroma.com/research/context-rot",
        kind: "article",
      },
    ],
  },
  {
    id: "context-engineering",
    title: "Anthropic Context Engineering",
    type: "research",
    subtitle: "Anthropic, 2025",
    summary:
      "Just-in-time context, progressive disclosure, compaction, subagents and deliberate management of finite attention.",
    x: 90,
    y: 330,
    links: [
      {
        label: "Read the article",
        url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
        kind: "article",
      },
    ],
  },
  {
    id: "context-rot",
    title: "Context Rot",
    type: "research",
    subtitle: "Chroma, 2025",
    summary:
      "Empirical evidence that model performance can become less reliable as irrelevant or excessive input grows.",
    x: 390,
    y: 350,
    links: [
      {
        label: "Read the research",
        url: "https://www.trychroma.com/research/context-rot",
        kind: "article",
      },
    ],
  },
  {
    id: "lima",
    title: "LIMA",
    type: "research",
    subtitle: "Less Is More for Alignment",
    summary:
      "A useful independent example of how careful selection and quality can matter more than sheer volume.",
    x: 610,
    y: 160,
    links: [
      {
        label: "Less Is More for Alignment",
        url: "https://arxiv.org/abs/2305.11206",
        kind: "paper",
      },
    ],
  },
  {
    id: "graph-engineering",
    title: "Graph Engineering",
    type: "concept",
    chapter: 7,
    subtitle: "Traverse relationships, not piles of information",
    summary:
      "Intelligence comes from discovering, narrowing and traversing the relationships that matter. The path itself becomes an artifact.",
    x: 760,
    y: 320,
    links: [
      {
        label: "Circuit Tracing",
        url: "https://www.transformer-circuits.pub/2025/attribution-graphs/methods.html",
        kind: "paper",
      },
      {
        label: "Anthropic multi-agent research system",
        url: "https://www.anthropic.com/engineering/multi-agent-research-system",
        kind: "article",
      },
    ],
  },
  {
    id: "circuit-tracing",
    title: "Circuit Tracing",
    type: "research",
    subtitle: "Anthropic interpretability",
    summary:
      "Attribution graphs reduce large internal computations to important nodes, edges and multi-step paths. The domain differs from the book's external knowledge graph, but the structure strongly converges.",
    x: 1010,
    y: 150,
    links: [
      {
        label: "Revealing Computational Graphs in Language Models",
        url: "https://www.transformer-circuits.pub/2025/attribution-graphs/methods.html",
        kind: "paper",
      },
      {
        label: "On the Biology of a Large Language Model",
        url: "https://www.transformer-circuits.pub/2025/attribution-graphs/biology.html",
        kind: "paper",
      },
    ],
  },
  {
    id: "multi-agent",
    title: "Multi-Agent Research",
    type: "research",
    subtitle: "Anthropic",
    summary:
      "Orchestrated parallel agents search broadly, work in separate contexts, follow leads and progressively narrow toward useful evidence.",
    x: 1030,
    y: 500,
    links: [
      {
        label: "How we built our multi-agent research system",
        url: "https://www.anthropic.com/engineering/multi-agent-research-system",
        kind: "article",
      },
    ],
  },
  {
    id: "intelligence-middle",
    title: "Intelligence in the Middle",
    type: "concept",
    chapter: 8,
    subtitle: "Capability emerges between connected minds",
    summary:
      "The useful intelligence of a system can emerge from the relationships among people, agents, tools and information rather than from one isolated mind.",
    x: 790,
    y: 610,
    links: [
      {
        label: "Anthropic multi-agent research system",
        url: "https://www.anthropic.com/engineering/multi-agent-research-system",
        kind: "article",
      },
      {
        label: "Agent Skills",
        url: "https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills",
        kind: "article",
      },
    ],
  },
  {
    id: "bitbot",
    title: "BitBot",
    type: "experience",
    chapter: 4,
    subtitle: "Independent intelligent evaluation",
    summary:
      "A separate evaluator judges Ask Product behavior while deterministic checks and human review cover failure modes a single score can miss.",
    x: 450,
    y: 600,
    links: [
      {
        label: "LLM Critics Help Catch LLM Bugs",
        url: "https://arxiv.org/abs/2407.00215",
        kind: "paper",
      },
      {
        label: "Demystifying evals for AI agents",
        url: "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents",
        kind: "article",
      },
    ],
  },
  {
    id: "learning-flywheel",
    title: "Learning Flywheel",
    type: "concept",
    chapter: 9,
    subtitle: "Every run can improve the next one",
    summary:
      "Feedback can improve tests, context, tools, graph relationships and human behavior even when the underlying model does not change.",
    x: 210,
    y: 590,
    links: [
      {
        label: "Grant and Dweck on achievement goals",
        url: "https://pubmed.ncbi.nlm.nih.gov/14498789/",
        kind: "paper",
      },
      {
        label: "Deep reinforcement learning from human preferences",
        url: "https://arxiv.org/abs/1706.03741",
        kind: "paper",
      },
    ],
  },
  {
    id: "self-replication",
    title: "Self Replication",
    type: "concept",
    chapter: 10,
    subtitle: "Give what makes you valuable more reach",
    summary:
      "Package context, tools, standards, relationships and judgment so your strongest capabilities can operate beyond the limits of your own attention.",
    x: 570,
    y: 455,
    links: [
      {
        label: "Agent Skills",
        url: "https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills",
        kind: "article",
      },
      {
        label: "How AI assistance impacts coding skills",
        url: "https://www.anthropic.com/research/AI-assistance-coding-skills",
        kind: "article",
      },
    ],
  },
  {
    id: "agent-skills",
    title: "Agent Skills",
    type: "research",
    subtitle: "Anthropic",
    summary:
      "Procedural knowledge and organizational expertise can be packaged into reusable resources that agents discover and load when needed.",
    x: 580,
    y: 690,
    links: [
      {
        label: "Equipping agents for the real world with Agent Skills",
        url: "https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills",
        kind: "article",
      },
    ],
  },
];

export const citationEdges: CitationEdge[] = [
  { source: "operational-context", target: "context-engineering", relationship: "independent convergence" },
  { source: "operational-context", target: "context-rot", relationship: "supports" },
  { source: "operational-context", target: "lima", relationship: "supports" },
  { source: "operational-context", target: "graph-engineering", relationship: "extends" },
  { source: "graph-engineering", target: "circuit-tracing", relationship: "independent convergence" },
  { source: "graph-engineering", target: "multi-agent", relationship: "supports" },
  { source: "multi-agent", target: "intelligence-middle", relationship: "supports" },
  { source: "intelligence-middle", target: "self-replication", relationship: "extends" },
  { source: "learning-flywheel", target: "bitbot", relationship: "implemented as" },
  { source: "learning-flywheel", target: "self-replication", relationship: "extends" },
  { source: "self-replication", target: "agent-skills", relationship: "independent convergence" },
  { source: "bitbot", target: "operational-context", relationship: "observed in production" },
];
