"use client";

import { Navbar } from "@/components/Navbar";
import { FinFlipLanding } from "@/components/FinFlipLanding";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#060B12]">
      <Navbar />
      <FinFlipLanding />
    </main>
  );
}
