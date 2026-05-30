/**
 * BJJ Evolution lockup — gradient triangle mark + wordmark.
 *
 * The mark is two ascending chevrons (leveling up) that read as a triangle,
 * the iconic BJJ submission. It carries a fixed purple gradient (the brand
 * color). The "BJJ" letterforms use `currentColor` and the widely-tracked
 * "EVOLUTION" label is muted — both theme-adaptive (ink on light, paper on
 * dark).
 *
 * Two layouts, both scaled by a single `font-size` (via `className`):
 *   - "stacked"     mark above the wordmark (default) — for splash / crests
 *   - "horizontal"  mark beside the wordmark — for navbars / headers
 */
import { useId } from 'react'

type LogoProps = {
  className?: string
  title?: string
  variant?: 'stacked' | 'horizontal' | 'icon'
}

function TriangleMark({ className }: { className?: string }) {
  // Unique per instance — multiple Logos on one page must not share a
  // gradient id, or url(#…) resolves to the first match (possibly hidden).
  const gradId = useId()
  return (
    <svg viewBox="145 145 222 222" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="256" y1="162" x2="256" y2="350" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b9a0ff" />
          <stop offset="1" stopColor="#6320d6" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${gradId})`} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round">
        <path d="M196 232 L256 162 L316 232" />
        <path d="M160 350 L256 246 L352 350" />
      </g>
    </svg>
  )
}

function Bjj({ className }: { className?: string }) {
  return (
    <svg viewBox="100 150 312 212" className={className} fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth={30} strokeLinecap="round" strokeLinejoin="round">
        {/* B */}
        <path d="M128 168 V344" />
        <path d="M128 168 C 212 168 212 256 128 256" />
        <path d="M128 256 C 220 256 220 344 128 344" />
        {/* J */}
        <path d="M300 168 V304 C 300 334 276 348 252 334" />
        {/* J */}
        <path d="M384 168 V304 C 384 334 360 348 336 334" />
      </g>
    </svg>
  )
}

function Evolution({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-medium text-[var(--text-muted)] ${className}`}
      style={{
        fontFamily: '"Hanken Grotesk", ui-sans-serif, system-ui, sans-serif',
        letterSpacing: '0.46em',
        textIndent: '0.46em',
      }}
    >
      EVOLUTION
    </span>
  )
}

export function Logo({ className = '', title = 'BJJ Evolution', variant = 'stacked' }: LogoProps) {
  if (variant === 'icon') {
    return (
      <span role="img" aria-label={title} className="inline-flex select-none">
        <TriangleMark className={`w-auto ${className || 'h-[1em]'}`} />
      </span>
    )
  }

  if (variant === 'horizontal') {
    return (
      <span
        role="img"
        aria-label={title}
        className={`inline-flex select-none items-center gap-[0.42em] leading-none text-[var(--text-primary)] ${className}`}
      >
        <TriangleMark className="h-[1.7em] w-auto" />
        <span className="inline-flex flex-col">
          <Bjj className="h-[0.92em] w-auto" />
          <Evolution className="mt-[0.36em] text-[0.26em]" />
        </span>
      </span>
    )
  }

  return (
    <span
      role="img"
      aria-label={title}
      className={`inline-flex select-none flex-col items-center leading-none text-[var(--text-primary)] ${className}`}
    >
      <TriangleMark className="h-[0.9em] w-auto" />
      <Bjj className="mt-[0.22em] h-[0.92em] w-auto" />
      <Evolution className="mt-[0.42em] text-[0.3em]" />
    </span>
  )
}
