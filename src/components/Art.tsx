/** Flat, outlined illustrations in the brand style (thick ink strokes, flat fills, hard shadows). */

const INK = "#16131F";
const CORAL = "#FE5550";
const VIOLET = "#6547CA";
const VIOLET_TINT = "#E7E0FB";
const CORAL_TINT = "#FFE3E1";

/** Hero: a blob with a hand holding a phone showing a house + heart. */
export function HeroArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 260" className={className} role="img" aria-label="Hand holding a phone with a home and a heart">
      {/* blob */}
      <path
        d="M80 40C120 10 170 25 200 30S280 25 295 70 285 140 300 175 280 245 225 240 150 225 110 235 30 230 25 185 45 135 30 100 50 60 80 40Z"
        fill={VIOLET_TINT}
        stroke={INK}
        strokeWidth="3"
      />
      {/* cuff hole */}
      <ellipse cx="66" cy="170" rx="22" ry="34" fill="#fff" stroke={INK} strokeWidth="3" />
      {/* arm + hand */}
      <path
        d="M58 150c20-8 55-12 80-14l40-4c10-1 14 10 4 14l-22 8 38-4c10-1 12 12 2 14l-30 6c10 2 8 14-2 14l-38 4c-20 2-50 0-70-6z"
        fill={CORAL_TINT}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* phone shadow + phone */}
      <g transform="rotate(-14 205 105)">
        <rect x="168" y="38" width="86" height="150" rx="16" fill={INK} transform="translate(5 5)" />
        <rect x="168" y="38" width="86" height="150" rx="16" fill={INK} stroke={INK} strokeWidth="3" />
        <rect x="176" y="52" width="70" height="122" rx="10" fill="#fff" stroke={INK} strokeWidth="2" />
        {/* house */}
        <path d="M193 116l18-16 18 16v24h-36z" fill={VIOLET} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <rect x="205" y="124" width="12" height="16" fill="#fff" stroke={INK} strokeWidth="2.5" />
        {/* signal */}
        <path d="M201 76a14 14 0 0 1 20 0M205 82a8 8 0 0 1 12 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* thumb over phone */}
      <path
        d="M150 142c8-10 22-14 30-8 6 5 2 12-6 14l-20 6z"
        fill={CORAL_TINT}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* heart badge */}
      <circle cx="268" cy="62" r="25" fill={INK} transform="translate(4 4)" />
      <circle cx="268" cy="62" r="25" fill={CORAL} stroke={INK} strokeWidth="3" />
      <path
        d="M268 75l-11-11a6.5 6.5 0 0 1 11-7 6.5 6.5 0 0 1 11 7z"
        fill="#fff"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Small wordmark pill: FlatMate on a tinted pill with a hard shadow. */
export function Wordmark({ size = "lg" }: { size?: "sm" | "lg" }) {
  const big = size === "lg";
  return (
    <span
      className={`inline-block rounded-full border-2 border-ink bg-violet-tint font-bold tracking-tight shadow-brut ${
        big ? "px-7 py-2 text-4xl sm:text-5xl" : "px-3.5 py-1 text-lg"
      }`}
    >
      Flat<span className="text-coral">Mate</span>
    </span>
  );
}
