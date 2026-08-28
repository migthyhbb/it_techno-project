// Podium 3D buatan sendiri (SVG, isometrik sederhana) — dipakai supaya posisi
// kartu logo perusahaan bisa dihitung tepat dari koordinat yang sama dengan
// gambarnya sendiri, bukan diperkirakan dari foto.

type Shade = { front: string; top: string; side: string; text: string };

const shades: Record<"gold" | "forest" | "clay", Shade> = {
  gold: { front: "#C99A3D", top: "#E7BB64", side: "#A17B31", text: "#17301F" },
  forest: { front: "#17301F", top: "#26472F", side: "#0F2417", text: "#F6F2E6" },
  clay: { front: "#7A5738", top: "#977151", side: "#5E4229", text: "#F6F2E6" },
};

// Geometri bersama (viewBox 620x300). dx/dy = arah "kedalaman" isometrik.
const DX = 34;
const DY = -20;
const Y_BASE = 280;

interface BlockSpec {
  x: number;
  w: number;
  yTop: number;
  accent: "gold" | "forest" | "clay";
  label: string;
  fontSize: number;
}

const blocks: BlockSpec[] = [
  { x: 15, w: 150, yTop: 160, accent: "forest", label: "2", fontSize: 40 },
  { x: 180, w: 170, yTop: 110, accent: "gold", label: "1", fontSize: 46 },
  { x: 365, w: 150, yTop: 200, accent: "clay", label: "3", fontSize: 36 },
];

// Titik tengah-atas tiap balok, dalam persen dari viewBox — dipakai untuk
// menaruh kartu logo di leaderboard.tsx supaya presisi di atas anak tangga.
export const podiumAnchors: Record<
  1 | 2 | 3,
  { left: string; top: string }
> = {
  2: { left: "14.5%", top: "53.3%" },
  1: { left: "42.7%", top: "36.7%" },
  3: { left: "71%", top: "66.7%" },
};

function Block({ x, w, yTop, accent, label, fontSize }: BlockSpec) {
  const shade = shades[accent];
  const yBase = Y_BASE;
  const A = `${x},${yTop}`;
  const B = `${x + w},${yTop}`;
  const C = `${x + w},${yBase}`;
  const Ad = `${x + DX},${yTop + DY}`;
  const Bd = `${x + w + DX},${yTop + DY}`;
  const Cd = `${x + w + DX},${yBase + DY}`;

  return (
    <g>
      <polygon points={`${B} ${C} ${Cd} ${Bd}`} fill={shade.side} />
      <polygon points={`${A} ${B} ${Bd} ${Ad}`} fill={shade.top} />
      <rect x={x} y={yTop} width={w} height={yBase - yTop} fill={shade.front} />
      <text
        x={x + w / 2}
        y={yTop + (yBase - yTop) * 0.34}
        textAnchor="middle"
        fill={shade.text}
        fontSize={fontSize}
        fontWeight={700}
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        {label}
      </text>
    </g>
  );
}

export function PodiumGraphic({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 620 300"
      className={className}
      role="img"
      aria-label="Podium peringkat 1, 2, dan 3"
    >
      <ellipse cx="300" cy="291" rx="270" ry="12" fill="#17301F" opacity="0.08" />
      {blocks.map((b) => (
        <Block key={b.label} {...b} />
      ))}
    </svg>
  );
}
