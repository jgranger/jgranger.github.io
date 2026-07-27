import type { Metadata } from "next";
import { Header } from "@/components/publication/Header";
import { Footer } from "@/components/publication/Footer";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Agentic Journey",
  description: "An interactive book about building an agentic development platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
