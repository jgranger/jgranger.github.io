export interface DiagramNode {
  id: string;
  label: string;
  description?: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface FlowStep {
  activeNodes: string[];
  activeEdges?: string[];
  text: string;
}

export interface FlowData extends DiagramData {
  steps: FlowStep[];
}
