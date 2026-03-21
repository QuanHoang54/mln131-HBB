"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
}

const navItems: NavItem[] = [
  { id: "ly-luan", label: "Cơ sở lý luận" },
  { id: "dac-diem", label: "Đặc điểm VN" },
  { id: "chinh-sach", label: "Chính sách" },
  { id: "nguyen-nhan", label: "Nguyên nhân" },
  { id: "bac-bo", label: "Bác bỏ" },
  { id: "ket-luan", label: "Kết luận" },
];

export function StickyNavigation() {
  const [activeSection, setActiveSection] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const contentSection = document.getElementById("noi-dung");
      const appendixSection = document.getElementById("phu-luc");
      
      if (contentSection && appendixSection) {
        const contentTop = contentSection.offsetTop;
        const appendixTop = appendixSection.offsetTop;
        const scrollY = window.scrollY + 150;
        
        // Show navigation only when in content section
        setIsVisible(scrollY >= contentTop - 100 && scrollY < appendixTop - 100);
      }

      // Determine active section based on which section is most visible
      const viewportCenter = window.scrollY + window.innerHeight / 3;
      
      const sections = navItems.map((item) => {
        const element = document.getElementById(item.id);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const absoluteTop = window.scrollY + rect.top;
        const absoluteBottom = absoluteTop + rect.height;
        return {
          id: item.id,
          top: absoluteTop,
          bottom: absoluteBottom,
        };
      }).filter(Boolean) as { id: string; top: number; bottom: number }[];

      // Find the section that contains the viewport center point
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (viewportCenter >= section.top) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      )}
    >
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-full px-2 py-2 shadow-lg">
        <ul className="flex items-center gap-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
