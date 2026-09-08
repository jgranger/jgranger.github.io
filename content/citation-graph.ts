export type CitationConnection =
  | string
  | {
      title: string;
      relationship: string;
    };

export type CitationNode = {
  title: string;
  description: string;
  link: string;
  kind?: "concept" | "research" | "experience";
  chapter?: number;
  connections?: CitationConnection[];
};

export const citationNodes: CitationNode[] = [
  {
    title: "Operational Context",
    description:
      "The right context is not the largest context. It is the smallest high-signal neighborhood needed for the work in front of the agent.",
    link: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
    kind: "concept",
    chapter: 3,
    connections: [
      { title: "Anthropic Context Engineering", relationship: "independent convergence" },
      { title: "Context Rot", relationship: "supports" },
      { title: "Context Before Chat", relationship: "independent convergence" },
      { title: "LIMA", relationship: "supports" },
      { title: "GraphRAG + Context Optimization", relationship: "supports" },
      { title: "Graph Engineering", relationship: "extends" },
    ],
  },
  {
    title: "Anthropic Context Engineering",
    description:
      "Just-in-time context, progressive disclosure, compaction, subagents and deliberate management of finite attention.",
    link: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
  },
  {
    title: "Context Rot",
    description:
      "Empirical evidence that model performance can become less reliable as irrelevant or excessive input grows.",
    link: "https://www.trychroma.com/research/context-rot",
  },
  {
    title: "Context Before Chat",
    description:
      "Useful context already exists in behavior, history, environment and prior artifacts. Systems should retrieve and organize it rather than forcing users to restate the world every time.",
    link: "https://eugeneyan.com/writing/llm-ux/",
  },
  {
    title: "LIMA",
    description:
      "A useful independent example of how careful selection and quality can matter more than sheer volume.",
    link: "https://arxiv.org/abs/2305.11206",
  },
  {
    title: "GraphRAG + Context Optimization",
    description:
      "Graph and agentic retrieval can improve access to evidence, but retrieving more does not automatically improve generation.",
    link: "https://arxiv.org/abs/2606.25656",
  },
  {
    title: "Graph Engineering",
    description:
      "Intelligence comes from discovering, narrowing and traversing the relationships that matter. The path itself becomes an artifact.",
    link: "https://www.transformer-circuits.pub/2025/attribution-graphs/methods.html",
    kind: "concept",
    chapter: 7,
    connections: [
      {
        title: "GraphRAG + Context Optimization",
        relationship: "independent convergence",
      },
      { title: "Circuit Tracing", relationship: "independent convergence" },
      { title: "Multi-Agent Research", relationship: "supports" },
    ],
  },
  {
    title: "Circuit Tracing",
    description:
      "Attribution graphs reduce large internal computations to important nodes, edges and multi-step paths.",
    link: "https://www.transformer-circuits.pub/2025/attribution-graphs/methods.html",
  },
  {
    title: "Multi-Agent Research",
    description:
      "Orchestrated parallel agents search broadly, work in separate contexts, follow leads and progressively narrow toward useful evidence.",
    link: "https://www.anthropic.com/engineering/multi-agent-research-system",
    connections: [
      { title: "Intelligence in the Middle", relationship: "supports" },
    ],
  },
  {
    title: "News Agents",
    description:
      "A coordinating agent splits an information space across subagents, lets them work in separate contexts and recombines the results into one artifact.",
    link: "https://eugeneyan.com/writing/news-agents/",
    connections: [
      {
        title: "Intelligence in the Middle",
        relationship: "independent convergence",
      },
    ],
  },
  {
    title: "Intelligence in the Middle",
    description:
      "The useful intelligence of a system can emerge from relationships among people, agents, tools and information rather than one isolated mind.",
    link: "https://www.anthropic.com/engineering/multi-agent-research-system",
    kind: "concept",
    chapter: 8,
    connections: [{ title: "Self Replication", relationship: "extends" }],
  },
  {
    title: "BitBot",
    description:
      "A separate evaluator judges Ask Product behavior while deterministic checks and human review cover failure modes a single score can miss.",
    link: "https://arxiv.org/abs/2407.00215",
    kind: "experience",
    chapter: 4,
    connections: [
      {
        title: "Operational Context",
        relationship: "observed in production",
      },
    ],
  },
  {
    title: "Evaluating the Evaluator",
    description:
      "LLM judges vary by task, can miss obvious quality drops and must themselves be calibrated against human judgment and real product failures.",
    link: "https://eugeneyan.com/writing/llm-evaluators/",
    connections: [{ title: "BitBot", relationship: "supports" }],
  },
  {
    title: "Learning Flywheel",
    description:
      "Feedback can improve tests, context, tools, graph relationships and human behavior even when the underlying model does not change.",
    link: "https://eugeneyan.com/writing/working-with-ai/",
    kind: "concept",
    chapter: 9,
    connections: [
      { title: "BitBot", relationship: "implemented as" },
      {
        title: "Work and Compound with AI",
        relationship: "independent convergence",
      },
      { title: "Self Replication", relationship: "extends" },
    ],
  },
  {
    title: "Work and Compound with AI",
    description:
      "Finished artifacts become context for future work, corrections update configuration and organized context becomes infrastructure through which capability compounds.",
    link: "https://eugeneyan.com/writing/working-with-ai/",
  },
  {
    title: "Self Replication",
    description:
      "Package context, tools, standards, relationships and judgment so your strongest capabilities can operate beyond the limits of your own attention.",
    link: "https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills",
    kind: "concept",
    chapter: 10,
    connections: [
      { title: "Agent Skills", relationship: "independent convergence" },
    ],
  },
  {
    title: "Agent Skills",
    description:
      "Procedural knowledge and organizational expertise can be packaged into reusable resources that agents discover and load when needed.",
    link: "https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills",
  },
];
