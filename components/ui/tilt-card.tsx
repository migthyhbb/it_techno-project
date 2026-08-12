"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";

export function TiltCard({
  children,
  rotate = 0,
  floatDistance = 12,
  floatDuration = 6,
  delay = 0,
  className,
  style,
}: {
  children: ReactNode;
  rotate?: number;
  floatDistance?: number;
  floatDuration?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, rotate: rotate - 8, y: 20 }}
      whileInView={{
        opacity: 1,
        scale: 1,
        rotate,
        y: [0, -floatDistance, 0],
      }}
      viewport={{ once: true }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.6, delay },
        rotate: { duration: 0.6, delay },
        y: {
          duration: floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        },
      }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}
