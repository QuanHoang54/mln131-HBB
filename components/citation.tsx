"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CitationProps {
  number: number;
  shortReference: string;
  targetId?: string;
}

export function Citation({ number, shortReference, targetId = "phu-luc" }: CitationProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const showTooltip = isHovered || isFocused;

  const handleClick = () => {
    // Find the reference item and scroll to it
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      
      // Highlight the referenced item
      const referenceItem = document.querySelector(`[data-reference-index="${number}"]`);
      if (referenceItem) {
        referenceItem.classList.add("citation-highlight");
        setTimeout(() => {
          referenceItem.classList.remove("citation-highlight");
        }, 2000);
      }
    }
  };

  return (
    <span className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer transition-colors duration-200 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded align-super -translate-y-0.5"
        aria-label={`Trích dẫn ${number}: ${shortReference}`}
        aria-describedby={`tooltip-${number}`}
      >
        [{number}]
      </button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            ref={tooltipRef}
            id={`tooltip-${number}`}
            role="tooltip"
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-lg max-w-xs whitespace-normal text-center"
          >
            <span className="block">{shortReference}</span>
            <span className="block text-gray-400 mt-1 text-[10px]">Click để xem chi tiết</span>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
