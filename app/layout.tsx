import type { Metadata } from "next";
import { Header } from "@/components/publication/Header";
import { Footer } from "@/components/publication/Footer";
import { KonamiListener } from "@/components/KonamiListener";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Agentic Journey",
  description: "An interactive book about building an agentic development platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <KonamiListener />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
