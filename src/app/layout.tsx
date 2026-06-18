import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { BetSmartAI } from "@/components/BetSmartAI";
import { getCurrentUser } from "@/lib/session";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "FWC26 Predictions",
  description: "World Cup 2026 prediction game. Points only — no real money. For fun among friends.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        {user && <BetSmartAI />}
        <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-slate-500">
          <div className="mx-auto mb-4 max-w-3xl rule" />
          <p className="font-medium text-slate-400">
            Points only — no real money · For fun among friends
          </p>
          <p className="mt-1">
            No outcome is guaranteed. Play responsibly — set your own limits. No deposits,
            withdrawals, or payments of any kind.
          </p>
        </footer>
      </body>
    </html>
  );
}
