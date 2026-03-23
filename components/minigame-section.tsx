"use client";

import Link from "next/link";
import { Gamepad2, ArrowRight, Users, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MinigameSection() {
  return (
    <section id="minigame" className="py-16 px-4 bg-muted/30">
      <div className="max-w-2xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
          <Gamepad2 className="w-4 h-4" />
          <span className="text-sm font-medium">Minigame</span>
        </div>

        {/* Title */}
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-3">
          🎋 Hồn Việt Trong Bánh
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-sm mb-8">
          Trả lời câu hỏi để nhận nguyên liệu, phối hợp cùng team gói bánh chưng.
          Dù khác dân tộc, chúng ta vẫn cùng chung một bếp lửa Việt Nam.
        </p>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8">
          <div className="bg-background rounded-xl border border-border/50 p-3 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">Nhiều team</p>
            <p className="text-xs text-muted-foreground">3 người/team</p>
          </div>
          <div className="bg-background rounded-xl border border-border/50 p-3 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">7 phút</p>
            <p className="text-xs text-muted-foreground">mỗi ván</p>
          </div>
          <div className="bg-background rounded-xl border border-border/50 p-3 text-center">
            <Star className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">100 câu</p>
            <p className="text-xs text-muted-foreground">trắc nghiệm</p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/minigame">
            <Button size="lg" className="gap-2 px-8">
              <Gamepad2 className="w-5 h-5" />
              Chơi ngay
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/minigame/demo">
            <Button size="lg" variant="outline" className="gap-2 px-6 border-amber-400 text-amber-600 hover:bg-amber-50">
              👁 Xem Demo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
