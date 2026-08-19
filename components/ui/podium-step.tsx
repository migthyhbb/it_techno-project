"use client";

import { motion } from "motion/react";

export function PodiumStep({
  rank,
  height,
  main,
  light,
  dark,
  delay = 0,
}: {
  rank: number;
  height: number;
  main: string;
  light: string;
  dark: string;
  delay?: number;
}) {
  const depth = 22;
  const width = 150;
  const frontWidth = width - depth;
  const svgHeight = height + depth;

  return (
    <motion.svg
      viewBox={`0 0 ${width} ${svgHeight}`}
      width="100%"
      className="block"
      style={{ transformOrigin: "bottom" }}
      initial={{ scaleY: 0.6, opacity: 0 }}
      whileInView={{ scaleY: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* bidang atas */}
      <polygon
        points={`${depth},0 ${width},0 ${frontWidth},${depth} 0,${depth}`}
        fill={light}
      />
      {/* bidang samping (kanan) */}
      <polygon
        points={`${width},0 ${width},${height} ${frontWidth},${svgHeight} ${frontWidth},${depth}`}
        fill={dark}
      />
      {/* bidang depan */}
      <rect x={0} y={depth} width={frontWidth} height={height} fill={main} />
      {/* angka peringkat */}
      <text
        x={frontWidth / 2}
        y={depth + height / 2 + 16}
        textAnchor="middle"
        fontFamily="var(--font-display), sans-serif"
        fontWeight={700}
        fontSize={44}
        fill="rgba(255,255,255,0.92)"
      >
        {rank}
      </text>
    </motion.svg>
  );
}
