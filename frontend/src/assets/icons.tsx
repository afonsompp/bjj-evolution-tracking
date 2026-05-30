
// ── Shared SVG icon components ──────────────────────────────
// All icons are Lucide-compatible paths with currentColor fill=none.
// Every icon accepts { size?, className? } defaults to the original pixel size.

type Props = { size?: number; className?: string }

function s(size: number | undefined, def: number): number {
  return size ?? def
}

// ── Navigation / UI ────────────────────────────────────────

export function SunIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

export function MoonIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export function ChevronUpIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 14)} height={s(size, 14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  )
}

export function ChevronDownIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 14)} height={s(size, 14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

export function ChevronLeftIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}

export function ChevronRightIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

export function UserIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

export function GlobeIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

export function LogOutIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

export function BuildingIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2"/><path d="M12 22v-6"/><path d="M12 8a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2 2 2 0 0 1-2-2v0a2 2 0 0 1 2-2z"/>
    </svg>
  )
}

// ── Dashboard / History stat icons ─────────────────────────

export function ActivityIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 20)} height={s(size, 20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )
}

export function ClockIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 20)} height={s(size, 20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

export function CrosshairIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 20)} height={s(size, 20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>
    </svg>
  )
}

export function ShieldIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 20)} height={s(size, 20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

export function HeartIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 20)} height={s(size, 20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  )
}

export function ZapIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 20)} height={s(size, 20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}

export function TrophyIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 18)} height={s(size, 18)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  )
}

export function FootprintsIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 18)} height={s(size, 18)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2Z"/><path d="M2 20h2"/><path d="M20 20h2"/>
    </svg>
  )
}

export function SwordsIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 18)} height={s(size, 18)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="14" x2="9" y2="18"/>
    </svg>
  )
}

export function SkullIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 18)} height={s(size, 18)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="M12.5 17c-.5-1-.5-2.5-.5-3h-2c0 .5 0 2-.5 3Z"/><path d="M12 22c-4 0-6-3-6-7 0-3.5 2-7 6-7s6 3.5 6 7c0 4-2 7-6 7Z"/>
    </svg>
  )
}

export function ArrowUpRightIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 14)} height={s(size, 14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
    </svg>
  )
}

export function ArrowDownRightIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 14)} height={s(size, 14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/>
    </svg>
  )
}

export function MinusIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 14)} height={s(size, 14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

// ── Action icons ───────────────────────────────────────────

export function PencilIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 14)} height={s(size, 14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    </svg>
  )
}

export function TrashIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 14)} height={s(size, 14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  )
}

export function SearchIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 14)} height={s(size, 14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

export function DownloadIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 14)} height={s(size, 14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

export function PlusIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 14)} height={s(size, 14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

export function CheckIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 14)} height={s(size, 14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

export function XIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 14)} height={s(size, 14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

export function AlertTriangleIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 20)} height={s(size, 20)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

// ── Form / Misc icons ──────────────────────────────────────

export function StarIcon({ filled, size, className }: { filled: boolean } & Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 24)} height={s(size, 24)} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

export function LoaderIcon({ size, className }: Props) {
  return (
    <svg className={`animate-spin ${className ?? ''}`} xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  )
}

// ── Academy / Schedule icons ───────────────────────────────

export function CalendarIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

export function MapPinIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

export function UsersIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

export function CheckCircleIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

export function HourglassIcon({ size, className }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s(size, 16)} height={s(size, 16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
    </svg>
  )
}
