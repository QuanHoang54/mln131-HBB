"use client";

import { ChevronDown, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function HeroSection() {
  const scrollToContent = () => {
    document.getElementById("noi-dung")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToMinigame = () => {
    document.getElementById("minigame")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="trang-chu"
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20"
    >
      {/* Header with Logo and Minigame */}
      <motion.div 
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* FPT University Logo */}
        <motion.div 
          className="flex items-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-FORroY25I5CCbxfycg7Gf0Jm1f6ffG.png"
            alt="FPT University"
            className="h-12 w-auto object-contain"
          />
        </motion.div>

        {/* Minigame Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={scrollToMinigame}
            variant="outline"
            className="flex items-center gap-2 border-white/50 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Minigame</span>
          </Button>
        </motion.div>
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Subject label */}
        <motion.p 
          className="text-sm uppercase tracking-[0.3em] text-white mb-6 drop-shadow-lg [text-shadow:_1px_1px_4px_rgba(0,0,0,0.9)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          MLN131_IA1807
        </motion.p>

        {/* Main subject title */}
        <motion.h1 
          className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6 text-balance drop-shadow-xl [text-shadow:_3px_3px_6px_rgba(0,0,0,0.9)]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          {"DÂN TỘC TẠI VIỆT NAM – KHOẢNG CÁCH PHÁT TRIỂN HAY SỰ \"CHIẾM DỤNG\"?"}
        </motion.h1>

        {/* Topic subtitle */}
        <motion.h2 
          className="font-serif text-xl md:text-2xl lg:text-3xl text-yellow-400 font-semibold mb-8 text-balance drop-shadow-xl [text-shadow:_2px_2px_6px_rgba(0,0,0,0.9)]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          Chủ nghĩa xã hội khoa học
        </motion.h2>

        {/* Short introduction */}
        <motion.p 
          className="text-lg md:text-xl text-white leading-relaxed max-w-2xl mx-auto mb-12 drop-shadow-lg [text-shadow:_2px_2px_4px_rgba(0,0,0,0.9)]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          Tìm hiểu về thực trạng chênh lệch phát triển giữa các dân tộc ở Việt Nam
          và những tranh luận xung quanh vấn đề này.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={scrollToContent}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg font-semibold shadow-xl border-2 border-red-500"
            >
              Xem nội dung
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.button
          onClick={scrollToContent}
          className="text-white hover:text-yellow-400 transition-colors drop-shadow-xl [filter:_drop-shadow(0_0_8px_rgba(0,0,0,0.8))]"
          aria-label="Cuộn xuống"
          animate={{ y: [0, 10, 0] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          whileHover={{ scale: 1.2 }}
        >
          <ChevronDown className="w-10 h-10" />
        </motion.button>
      </motion.div>
    </section>
  );
}
