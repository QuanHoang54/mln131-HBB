"use client";

import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// Animated underline link component
function AnimatedNavLink({ 
  children, 
  onClick 
}: { 
  children: React.ReactNode; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative text-white/70 hover:text-white transition-colors duration-300 group"
    >
      {children}
      <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-white/80 transition-all duration-300 ease-out group-hover:w-full" />
    </button>
  );
}

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, { once: true, margin: "-50px" });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer ref={footerRef} className="relative overflow-hidden">
      {/* Glowing divider line with moving light effect */}
      <div className="relative h-[1px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
        <motion.div 
          className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          animate={{
            x: ["-128px", "calc(100vw + 128px)"],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Animated background with subtle breathing effect */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90"
        animate={{
          opacity: [0.85, 0.95, 0.85],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Footer content with entrance animation */}
      <motion.div
        className="relative z-10 py-12 px-6 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left side - Subject info */}
            <motion.div 
              className="text-center md:text-left"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="font-serif text-lg font-semibold mb-2 text-white">
                Chủ nghĩa xã hội khoa học
              </h3>
              <p className="text-white/70 text-sm">
                Bài thuyết trình học thuật • {new Date().getFullYear()}
              </p>
            </motion.div>

            {/* Center - Quick links with animated underline */}
            <motion.nav 
              className="flex items-center gap-6 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AnimatedNavLink
                onClick={() =>
                  document
                    .getElementById("trang-chu")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Trang chủ
              </AnimatedNavLink>
              <AnimatedNavLink
                onClick={() =>
                  document
                    .getElementById("noi-dung")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Nội dung
              </AnimatedNavLink>
              <AnimatedNavLink
                onClick={() =>
                  document
                    .getElementById("minigame")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Minigame
              </AnimatedNavLink>
              <AnimatedNavLink
                onClick={() =>
                  document
                    .getElementById("phu-luc")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Phụ lục
              </AnimatedNavLink>
            </motion.nav>

            {/* Right side - Back to top with hover effects */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollToTop}
                  className="border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/50 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300"
                >
                  <ArrowUp className="w-5 h-5 text-white" />
                  <span className="sr-only">Về đầu trang</span>
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom copyright */}
          <motion.div 
            className="mt-8 pt-6 border-t border-white/20 text-center"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-white/50 text-xs">
              Được tạo cho mục đích học tập và nghiên cứu. 
              Nội dung được tổng hợp từ các nguồn tài liệu chính thống.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </footer>
  );
}
