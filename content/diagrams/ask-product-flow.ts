import type { FlowData } from "@/types/diagrams";

export const askProductFlow: FlowData = {
  nodes: [
    { id: "slack", label: "Slack Question" },
    { id: "vector-search", label: "Approved Answer Search" },
    { id: "router", label: "Router" },
    { id: "classification", label: "Product Classification" },
    { id: "response", label: "Response" },
    { id: "eval", label: "BitBot Evaluation" },
    { id: "review", label: "Human Review" },
  ],
  edges: [
    { from: "slack", to: "vector-search" },
    { from: "vector-search", to: "router" },
    { from: "router", to: "classification" },
    { from: "classification", to: "response" },
    { from: "response", to: "eval" },
    { from: "eval", to: "review" },
  ],
  steps: [
    {
      activeNodes: ["slack"],
      text: "A question is submitted in Slack.",
    },
    {
      activeNodes: ["vector-search"],
      activeEdges: ["slack-vector-search"],
      text: "The question is compared against approved answers.",
    },
    {
      activeNodes: ["router"],
      activeEdges: ["vector-search-router"],
      text: "A router decides how to handle the match (or lack of one).",
    },
    {
      activeNodes: ["classification"],
      activeEdges: ["router-classification"],
      text: "The question is classified against the relevant product area.",
    },
    {
      activeNodes: ["response"],
      activeEdges: ["classification-response"],
      text: "A response is drafted from the matched approved answer.",
    },
    {
      activeNodes: ["eval"],
      activeEdges: ["response-eval"],
      text: "BitBot evaluates the response before it goes out.",
    },
    {
      activeNodes: ["review"],
      activeEdges: ["eval-review"],
      text: "A human reviews the evaluation result and the final response.",
    },
  ],
};
