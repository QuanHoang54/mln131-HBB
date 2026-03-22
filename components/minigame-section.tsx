"use client";

import { Gamepad2 } from "lucide-react";
import MinigameRoot from "@/components/minigame/index";

export function MinigameSection() {
  return (
    <section id="minigame" className="py-16 px-4 bg-muted/30">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Gamepad2 className="w-4 h-4" />
            <span className="text-sm font-medium">Minigame</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-3">
            🎋 Gói Bánh Đoàn Kết
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-sm">
            Trả lời câu hỏi để nhận nguyên liệu, phối hợp cùng team gói bánh chưng.
            Dù khác dân tộc, chúng ta vẫn cùng chung một bếp lửa Việt Nam.
          </p>
        </div>

        {/* Game */}
        <MinigameRoot />
      </div>
    </section>
  );
}
