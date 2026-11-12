import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHITRANYA CAPITAL | AI-Powered Financial Intelligence",
  description: "Nepal stock market research, portfolio intelligence and AI-powered investment analysis."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
