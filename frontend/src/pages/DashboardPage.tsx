import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../features/dashboard/hooks/useDashboard'
import { useTranslation } from '../lib/i18n/I18nContext'
import {
  ActivityIcon,
  ClockIcon,
  CrosshairIcon,
  ShieldIcon,
  HeartIcon,
  ZapIcon,
  TrophyIcon,
  FootprintsIcon,
  SwordsIcon,
  SkullIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  MinusIcon,
} from '../assets/icons'

// ── Periods ───────────────────────────────────────────────
const PERIOD_OPTIONS = [7, 14, 30, 45, 60, 90, 180, 365]

// ── StatCard ──────────────────────────────────────────────
function StatCard({
  icon, label, value, suffix, trend, inverseLogic = false,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  suffix?: string
  trend: number
  inverseLogic?: boolean
}) {
  let trendColor = 'text-[var(--text-subtle)]'
  let TrendIcon = MinusIcon

  if (trend > 0) {
    trendColor = inverseLogic ? 'text-rose-400' : 'text-emerald-400'
    TrendIcon = ArrowUpRightIcon
  } else if (trend < 0) {
    trendColor = inverseLogic ? 'text-emerald-400' : 'text-rose-400'
    TrendIcon = ArrowDownRightIcon
  }

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-sm transition-colors hover:border-[var(--border-card-hover)]">
      <div className="mb-2 flex items-start justify-between">
        <span className="text-sm font-medium text-[var(--text-muted)]">{label}</span>
        <div className="rounded-lg bg-[var(--bg-subtle)] p-2 text-[var(--text-primary)]">{icon}</div>
      </div>
      <div>
        <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {value} <span className="text-sm font-normal text-[var(--text-subtle)]">{suffix}</span>
        </h3>
        {trend !== 0 ? (
          <div className={`mt-1 inline-flex items-center text-xs font-medium ${trendColor}`}>
            <TrendIcon />
            <span className="ml-1">{trend > 0 ? '+' : ''}{trend.toFixed(1)}</span>
          </div>
        ) : (
          <span className="mt-1 block text-xs text-[var(--text-subtle)]">—</span>
        )}
      </div>
    </div>
  )
}

// ── ProgressCard ──────────────────────────────────────────
function ProgressCard({
  label, value, icon, colorClass, trend,
}: {
  label: string
  value: number
  icon: React.ReactNode
  colorClass: string
  trend?: number
}) {
  const pct = Math.min(Math.max((value / 5) * 100, 0), 100)
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-sm transition-colors hover:border-[var(--border-card-hover)]">
      <div className="mb-4 flex items-start justify-between">
        <span className="text-sm font-medium text-[var(--text-muted)]">{label}</span>
        <div className="rounded-lg bg-[var(--bg-subtle)] p-2 text-[var(--text-primary)]">{icon}</div>
      </div>
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold text-[var(--text-primary)]">
            {value.toFixed(1)} <span className="text-sm font-normal text-[var(--text-subtle)]">/ 5.0</span>
          </span>
          {trend !== undefined && trend !== 0 && (
            <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}
            </span>
          )}
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── TechniqueList ────────────────────────────────────────
function TechniqueList({
  title, techniques, colorBar, icon, emptyMessage,
}: {
  title: string
  techniques: { name: string; count: number; percentage: number }[]
  colorBar: string
  icon: React.ReactNode
  emptyMessage: string
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6">
      <div className="mb-6 flex items-center gap-2">
        <span className={colorBar.replace('bg-', 'text-')}>{icon}</span>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      <div className="flex-1 space-y-5">
        {techniques.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-[var(--border-card)] py-4 text-sm italic text-[var(--text-subtle)]">
            {emptyMessage}
          </div>
        ) : (
          techniques.map((tech, i) => (
            <div key={tech.name} className="group">
              <div className="mb-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 font-mono text-xs text-[var(--text-subtle)]">#{i + 1}</span>
                  <span className="font-medium text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)]">
                    {tech.name}
                  </span>
                </div>
                <span className="rounded-full bg-[var(--bg-badge)] px-2 py-0.5 font-mono text-xs text-[var(--text-subtle)]">
                  {tech.count}x
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                <div
                  className={`h-full rounded-full opacity-80 transition-all duration-500 group-hover:opacity-100 ${colorBar}`}
                  style={{ width: `${tech.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── CombatStatRow ────────────────────────────────────────
function CombatStatRow({
  label, value, prevValue, icon, colorClass,
}: {
  label: string
  value: number
  prevValue: number
  icon: React.ReactNode
  colorClass: string
}) {
  const diff = value - prevValue
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border-row)] bg-[var(--bg-row)] p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-md p-2 ${colorClass}`}>{icon}</div>
        <span className="text-sm font-medium text-[var(--text-muted)]">{label}</span>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-[var(--text-primary)]">{value}</div>
        {diff !== 0 && (
          <div className={`text-xs ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {diff > 0 ? '+' : ''}{diff}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Dashboard Page ──────────────────────────────────
export default function DashboardPage() {
  const { translate } = useTranslation()
  const navigate = useNavigate()
  const [days, setDays] = useState<number>(30)

  const { data, isLoading } = useDashboard(days)

  if (isLoading) {
    return <div className="animate-pulse p-8 text-[var(--text-muted)]">{translate('dashboard.loading')}</div>
  }

  const cur = data?.current
  const prev = data?.previous
  const topAttacks = data?.topAttacks ?? []
  const topDefenses = data?.topDefenses ?? []

  // Derived stats
  const safeFixed = (v: number | undefined, d: number) => (v ?? 0).toFixed(d)
  const safeTrend = (c: number | undefined, p: number | undefined) => (c ?? 0) - (p ?? 0)

  const curHours = cur ? cur.totalMinutes / 60 : 0
  const prevHours = prev ? prev.totalMinutes / 60 : 0
  const curSubRate = (cur?.totalRolls ?? 0) > 0 ? (cur?.totalSubmissions ?? 0) / (cur?.totalRolls ?? 1) : 0
  const prevSubRate = (prev?.totalRolls ?? 0) > 0 ? (prev?.totalSubmissions ?? 0) / (prev?.totalRolls ?? 1) : 0
  const curDefense = (cur?.totalTaps ?? 0) > 0 ? (cur?.totalEscapes ?? 0) / (cur?.totalTaps ?? 1) : (cur?.totalEscapes ?? 0)
  const prevDefense = (prev?.totalTaps ?? 0) > 0 ? (prev?.totalEscapes ?? 0) / (prev?.totalTaps ?? 1) : (prev?.totalEscapes ?? 0)

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      {/* HEADER */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--border-header)] pb-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {translate('dashboard.title')}
          </h1>
          <p className="mt-1 text-[var(--text-muted)]">
            {translate('dashboard.subtitle', { days })}
          </p>
        </div>
        <div className="flex w-full items-center gap-3 md:w-auto">
          <button
            onClick={() => navigate('/training/new')}
            className="whitespace-nowrap rounded-lg bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-page)] hover:opacity-90"
          >
            {translate('nav.newTraining')}
          </button>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full cursor-pointer rounded-lg border border-[var(--border-select)] bg-[var(--bg-select)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-card-hover)] md:w-auto"
          >
            {PERIOD_OPTIONS.map(d => (
              <option key={d} value={d}>
                {translate('dashboard.period', { days: d })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. KEY METRICS GRID */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<ActivityIcon />}
          label={translate('dashboard.sessions')}
          value={cur?.totalSessions ?? 0}
          trend={safeTrend(cur?.totalSessions, prev?.totalSessions)}
        />
        <StatCard
          icon={<ClockIcon />}
          label={translate('dashboard.matHours')}
          value={safeFixed(curHours, 1)}
          suffix={translate('unit.hours')}
          trend={safeTrend(curHours, prevHours)}
        />
        <StatCard
          icon={<CrosshairIcon />}
          label={translate('dashboard.subRate')}
          value={safeFixed(curSubRate, 2)}
          suffix={translate('unit.perRola')}
          trend={safeTrend(curSubRate, prevSubRate)}
        />
        <StatCard
          icon={<ShieldIcon />}
          label={translate('dashboard.defenseIndex')}
          value={safeFixed(curDefense, 1)}
          suffix={translate('unit.escPerTap')}
          trend={safeTrend(curDefense, prevDefense)}
        />
        <ProgressCard
          label={translate('dashboard.cardio')}
          value={cur?.avgCardioRating ?? 0}
          icon={<HeartIcon />}
          colorClass="bg-rose-500"
          trend={safeTrend(cur?.avgCardioRating, prev?.avgCardioRating)}
        />
        <ProgressCard
          label={translate('dashboard.intensity')}
          value={cur?.avgIntensityRating ?? 0}
          icon={<ZapIcon />}
          colorClass="bg-yellow-500"
          trend={safeTrend(cur?.avgIntensityRating, prev?.avgIntensityRating)}
        />
      </div>

      {/* 2. TOP TECHNIQUES */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TechniqueList
          title={translate('dashboard.topAttacks')}
          techniques={topAttacks}
          icon={<SwordsIcon />}
          colorBar="bg-emerald-500"
          emptyMessage={translate('dashboard.noAttacks')}
        />
        <TechniqueList
          title={translate('dashboard.topDefenses')}
          techniques={topDefenses}
          icon={<SkullIcon />}
          colorBar="bg-rose-500"
          emptyMessage={translate('dashboard.noDefenses')}
        />
      </div>

      {/* 3. COMBAT STATS GRID */}
      <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-6 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
          <FootprintsIcon />
          {translate('dashboard.combatTitle')}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CombatStatRow
            label={translate('dashboard.subsMade')}
            value={cur?.totalSubmissions ?? 0}
            prevValue={prev?.totalSubmissions ?? 0}
            icon={<TrophyIcon />}
            colorClass="text-yellow-400"
          />
          <CombatStatRow
            label={translate('dashboard.subsTaken')}
            value={cur?.totalTaps ?? 0}
            prevValue={prev?.totalTaps ?? 0}
            icon={<TrophyIcon />}
            colorClass="text-rose-500"
          />
          <CombatStatRow
            label={translate('dashboard.takedowns')}
            value={cur?.totalTakedowns ?? 0}
            prevValue={prev?.totalTakedowns ?? 0}
            icon={<FootprintsIcon />}
            colorClass="text-blue-400"
          />
          <CombatStatRow
            label={translate('dashboard.guardPasses')}
            value={cur?.totalGuardPasses ?? 0}
            prevValue={prev?.totalGuardPasses ?? 0}
            icon={<ArrowUpRightIcon />}
            colorClass="text-green-400"
          />
          <CombatStatRow
            label={translate('dashboard.sweeps')}
            value={cur?.totalSweeps ?? 0}
            prevValue={prev?.totalSweeps ?? 0}
            icon={<ArrowDownRightIcon />}
            colorClass="text-orange-400"
          />
          <CombatStatRow
            label={translate('dashboard.escapes')}
            value={cur?.totalEscapes ?? 0}
            prevValue={prev?.totalEscapes ?? 0}
            icon={<MinusIcon />}
            colorClass="text-zinc-400"
          />
        </div>
      </div>
    </div>
  )
}
