import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "World Cup Predictions",
  description: "World Cup prediction game. Play-money points only — no real money.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-slate-500">
          World Cup Predictions · a private game for points only. Not gambling — no real
          money, deposits, or withdrawals.
        </footer>
      </body>
    </html>
  );
}
