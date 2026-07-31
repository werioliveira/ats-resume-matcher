import { useEffect, useState } from "react"

type ScoreRingProps = {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
}

export function ScoreRing({ score, size = 140, strokeWidth = 12, label = "Match" }: ScoreRingProps) {
  const [progress, setProgress] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  useEffect(() => {
    const timeout = setTimeout(() => setProgress(score), 150)
    return () => clearTimeout(timeout)
  }, [score])

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">{Math.round(progress)}%</span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}