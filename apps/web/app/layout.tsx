import type { Metadata } from "next";
import { Lora, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinSage AI — Personal Wealth Management",
  description: "Disciplined personal wealth management and financial intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${ibmPlexSans.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased selection:bg-teal-tint selection:text-ink">
        {children}
      </body>
    </html>
  );
}
