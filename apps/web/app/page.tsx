"use client";

import { Navbar } from "@/components/Navbar";
import { FinFlipLanding } from "@/components/FinFlipLanding";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <Navbar />
      <FinFlipLanding />
    </main>
  );
}
