"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { ReactNode, MouseEvent } from "react";

export function MagneticButton({
  children,
  href,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  function handleMouseMove(e: MouseEvent<HTMLAnchorElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const base =
    "inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium transition-colors";
  const styles =
    variant === "primary"
      ? "bg-forest text-cream hover:bg-forest-2"
      : "text-forest border border-forest/25 hover:border-forest/50";

  return (
    <motion.a
      href={href}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </motion.a>
  );
}
