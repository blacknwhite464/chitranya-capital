import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHITRANYA CAPITAL | AI-Powered Financial Intelligence",
  description: "CHITRANYA CAPITAL brings Nepal stock-market research, portfolio tools, technical analysis and evidence-led investing education into one workspace.",
  applicationName: "CHITRANYA CAPITAL",
  keywords: ["NEPSE","Nepal stock market","stock research","portfolio tracker","technical analysis","investing education"],
  openGraph: { title: "CHITRANYA CAPITAL | Smarter Investing. Better Decisions.", description: "AI-powered financial intelligence and research tools for Nepal’s capital market.", type: "website", siteName: "CHITRANYA CAPITAL" },
  twitter: { card: "summary", title: "CHITRANYA CAPITAL", description: "Smarter Investing. Better Decisions." },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
