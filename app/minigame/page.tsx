import MinigameRoot from "@/components/minigame/index";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "🎋 Hồn Việt Trong Bánh – Minigame",
};

export default function MinigamePage() {
  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/pictures/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto py-6 px-4">
          {/* Back link */}
          <Link
            href="/#minigame"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white drop-shadow hover:text-white/80 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-2">
              🎋 Hồn Việt Trong Bánh
            </h1>
            <p className="text-white/90 drop-shadow text-sm max-w-md mx-auto leading-relaxed">
              Trả lời câu hỏi để nhận nguyên liệu, phối hợp cùng team gói bánh chưng.
              Dù khác dân tộc, chúng ta vẫn cùng chung một bếp lửa Việt Nam.
            </p>
          </div>

          {/* Game */}
          <MinigameRoot />
        </div>
      </div>
    </div>
  );
}
