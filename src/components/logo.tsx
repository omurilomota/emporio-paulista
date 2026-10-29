import { useId } from "react";

const INK = "#1E1A16";
const CREAM = "#F7F0E3";
const RED = "#C8341F";

/**
 * Emblem artwork drawn on a 64×64 grid: a striped emporium awning over an
 * "EP" monogram. Letters are vector paths, so the mark never depends on fonts.
 */
function MarkArt({ letters = CREAM }: { letters?: string }) {
  return (
    <>
      <rect x="6" y="7" width="52" height="2.6" rx="1.3" fill={CREAM} />
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const x = 8 + index * 8;
        return (
          <g key={index} fill={index % 2 === 0 ? RED : CREAM}>
            <rect x={x} y="10.5" width="8" height="9" />
            <path d={`M${x} 19.5a4 4 0 0 0 8 0Z`} />
          </g>
        );
      })}
      <path
        fill={letters}
        fillRule="evenodd"
        d="M13 30h16v5.5H19v4.2h8.6v5.1H19v4.7h10.2V55H13ZM34 30h9.5a8.2 8.2 0 0 1 0 16.4H40V55h-6ZM40 35.4h3.2a2.8 2.8 0 0 1 0 5.6H40Z"
      />
    </>
  );
}

type MarkProps = { size?: number; className?: string; title?: string };

export function LogoMark({ size = 44, className, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <rect width="64" height="64" rx="13" fill={INK} />
      <MarkArt />
    </svg>
  );
}

export function LogoWordmark({ tone = "dark", caption }: { tone?: "dark" | "light"; caption?: string }) {
  return (
    <span className={`logo-word logo-word-${tone}`}>
      <span className="logo-word-name">Empório</span>
      <span className="logo-word-sub">Paulista</span>
      {caption ? <span className="logo-word-caption">{caption}</span> : null}
    </span>
  );
}

export function LogoSeal({ size = 120, className }: { size?: number; className?: string }) {
  const pathId = `seal-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      viewBox="0 0 140 140"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Selo Empório Paulista — comida caseira em Junqueirópolis, SP"
      focusable="false"
    >
      <circle cx="70" cy="70" r="69" fill={INK} />
      <circle cx="70" cy="70" r="63.5" fill="none" stroke={CREAM} strokeOpacity="0.38" />
      <circle cx="70" cy="70" r="44" fill="none" stroke={CREAM} strokeOpacity="0.38" />
      <defs>
        <path id={pathId} d="M70 70m-52 0a52 52 0 1 1 104 0a52 52 0 1 1-104 0" />
      </defs>
      <text
        fill={CREAM}
        fontFamily="'Barlow Condensed', 'Arial Narrow', sans-serif"
        fontSize="11.5"
        fontWeight="700"
        letterSpacing="1.1"
      >
        <textPath href={`#${pathId}`} textLength="322" lengthAdjust="spacing">
          EMPÓRIO PAULISTA • COMIDA CASEIRA • JUNQUEIRÓPOLIS · SP •
        </textPath>
      </text>
      <g transform="translate(38 39)">
        <MarkArt />
      </g>
    </svg>
  );
}
