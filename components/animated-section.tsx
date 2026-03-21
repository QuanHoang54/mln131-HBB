"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

export function AnimatedSection({
  children,
  className,
  id,
  delay = 0,
  direction = "up",
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const directionOffset = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      id={id}
      initial={{ 
        opacity: 0, 
        ...directionOffset[direction]
      }}
      animate={isInView ? { 
        opacity: 1, 
        y: 0, 
        x: 0 
      } : {}}
      transition={{ 
        duration: 0.6, 
        delay, 
        ease: "easeOut" 
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

// Animated Card with hover effects
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({ children, className, delay = 0 }: AnimatedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={cn(
        "transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_10px_40px_rgba(0,0,0,0.15)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// Animated Counter for statistics
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ 
  value, 
  suffix = "", 
  prefix = "", 
  duration = 2,
  className 
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      className={cn(className)}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
    >
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.3 }}
      >
        {isInView && (
          <Counter from={0} to={value} duration={duration} />
        )}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

function Counter({ from, to, duration }: { from: number; to: number; duration: number }) {
  return (
    <motion.span
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <CounterValue from={from} to={to} duration={duration} />
      </motion.span>
    </motion.span>
  );
}

function CounterValue({ from, to, duration }: { from: number; to: number; duration: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  motion.useAnimationFrame(() => {
    // This is just for display, the actual animation is handled by CSS
  });

  return (
    <motion.span
      ref={nodeRef}
      initial={{ opacity: 1 }}
      animate={{ 
        opacity: 1,
      }}
      transition={{ duration }}
      onAnimationStart={() => {
        if (nodeRef.current) {
          const startTime = Date.now();
          const endTime = startTime + duration * 1000;
          
          const updateValue = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / (duration * 1000), 1);
            const currentValue = Math.floor(from + (to - from) * progress);
            
            if (nodeRef.current) {
              nodeRef.current.textContent = currentValue.toString();
            }
            
            if (progress < 1) {
              requestAnimationFrame(updateValue);
            }
          };
          
          updateValue();
        }
      }}
    >
      {from}
    </motion.span>
  );
}

// Staggered children animation
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className, staggerDelay = 0.1 }: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

// Workflow step animation with sequential highlighting
interface WorkflowStepProps {
  children: React.ReactNode;
  index: number;
  isActive: boolean;
  className?: string;
}

export function WorkflowStep({ children, index, isActive, className }: WorkflowStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        boxShadow: isActive 
          ? "0 0 20px rgba(234, 179, 8, 0.4), 0 0 40px rgba(234, 179, 8, 0.2)" 
          : "none"
      }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.2,
        ease: "easeOut"
      }}
      className={cn(
        "transition-all duration-300",
        isActive && "ring-2 ring-yellow-400/50",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// Animated progress bar
interface AnimatedProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
}

export function AnimatedProgress({ value, className, barClassName }: AnimatedProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className={cn("w-full bg-muted rounded-full h-2 overflow-hidden", className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={isInView ? { width: `${value}%` } : { width: 0 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        className={cn("h-full bg-primary rounded-full", barClassName)}
      />
    </div>
  );
}
