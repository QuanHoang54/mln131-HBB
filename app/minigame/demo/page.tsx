"use client";

import { useRouter } from "next/navigation";
import DemoMode from "@/components/minigame/DemoMode";

export default function DemoPage() {
  const router = useRouter();
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/pictures/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <DemoMode onExit={() => router.push("/#minigame")} />
        </div>
      </div>
    </div>
  );
}
