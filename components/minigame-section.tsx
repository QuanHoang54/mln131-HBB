"use client";

import Link from "next/link";
import Image from "next/image";
import { Gamepad2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MinigameSection() {
  return (
    <section id="minigame" className="relative py-16 px-4 overflow-hidden">
      {/* Dark gradient overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/65 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white border border-white/20 mb-4">
          <Gamepad2 className="w-4 h-4" />
          <span className="text-sm font-medium">Minigame</span>
        </div>

        {/* Title */}
        <h2
          className="font-serif text-3xl md:text-4xl font-semibold text-white mb-3 flex items-center justify-center gap-2"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)" }}
        >
          <Image src="/pictures/chung-cake.png" alt="bánh chưng" width={36} height={36} className="object-contain drop-shadow-lg" />
          Hồn Việt Trong Bánh
        </h2>
        <p
          className="text-white/85 max-w-xl mx-auto leading-relaxed text-sm mb-8"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
        >
          Trả lời câu hỏi để nhận nguyên liệu, phối hợp cùng nhóm gói bánh chưng.
          Dù khác dân tộc, chúng ta vẫn cùng chung một bếp lửa Việt Nam.
        </p>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white/30 p-3 text-center shadow-lg">
            <Image src="/pictures/group.png" alt="nhóm" width={20} height={20} className="object-contain mx-auto mb-1" />
            <p className="text-xs font-medium text-foreground">Nhiều nhóm</p>
            <p className="text-xs text-muted-foreground">3 người/nhóm</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white/30 p-3 text-center shadow-lg">
            <Image src="/pictures/time.png" alt="thời gian" width={20} height={20} className="object-contain mx-auto mb-1" />
            <p className="text-xs font-medium text-foreground">10 phút</p>
            <p className="text-xs text-muted-foreground">mỗi ván</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white/30 p-3 text-center shadow-lg">
            <Image src="/pictures/question-sign.png" alt="câu hỏi" width={20} height={20} className="object-contain mx-auto mb-1" />
            <p className="text-xs font-medium text-foreground">100 câu</p>
            <p className="text-xs text-muted-foreground">trắc nghiệm</p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/minigame">
            <Button size="lg" className="gap-2 px-8 shadow-xl">
              <Gamepad2 className="w-5 h-5" />
              Chơi ngay
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
