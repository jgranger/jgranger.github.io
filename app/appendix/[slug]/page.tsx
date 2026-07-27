import { notFound } from "next/navigation";

export async function generateStaticParams() {
  // No appendix pages exist yet - this scaffolds the route as empty
  // When appendix content is added in a future task, return entries here
  return [];
}

export default function AppendixPage() {
  notFound();
}
