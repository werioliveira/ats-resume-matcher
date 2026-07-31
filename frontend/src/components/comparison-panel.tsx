import type { AnalysisResult } from "../lib/mock-data"

type ViewMode = "original" | "optimized" | "diff"

type ComparisonPanelProps = {
  analysis: AnalysisResult
  view: ViewMode
  onChangeView: (view: ViewMode) => void
}

const tabs: { id: ViewMode; label: string }[] = [
  { id: "original", label: "CV Original" },
  { id: "optimized", label: "CV Otimizado" },
  { id: "diff", label: "Comparação" },
]

function renderDiff(original: string, optimized: string) {
  const originalLines = new Set(original.split("\n").map((l) => l.trim()))
  return optimized.split("\n").map((line, i) => {
    const trimmed = line.trim()
    const isAdded = trimmed.length > 0 && !originalLines.has(trimmed)
    return (
      <div
        key={i}
        className={
          isAdded
            ? "-mx-2 rounded bg-success/15 px-2 text-foreground"
            : trimmed.length === 0
              ? "h-4"
              : "text-muted-foreground"
        }
      >
        {isAdded && <span className="mr-1 select-none font-mono text-success">+</span>}
        {line || "\u00A0"}
      </div>
    )
  })
}

export function ComparisonPanel({ analysis, view, onChangeView }: ComparisonPanelProps) {
  const content = view === "original" ? analysis.originalCV : analysis.optimizedCV

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <h3 className="font-semibold text-card-foreground">Pré-visualização</h3>
        <div className="inline-flex rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeView(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                view === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {view === "diff" ? (
          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap font-mono text-[13px] leading-relaxed">
            {renderDiff(analysis.originalCV, analysis.optimizedCV)}
          </pre>
        ) : (
          <textarea
            defaultValue={content}
            key={view}
            aria-label={view === "original" ? "Currículo original" : "Currículo otimizado, editável"}
            readOnly={view === "original"}
            className={`min-h-[520px] w-full resize-none whitespace-pre-wrap rounded-xl border border-border bg-background p-4 font-mono text-[13px] leading-relaxed text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30 ${
              view === "original" ? "text-muted-foreground" : ""
            }`}
          />
        )}
        {view === "optimized" && (
          <p className="mt-2 text-xs text-muted-foreground">Dica: você pode editar o texto acima para ajustes manuais.</p>
        )}
      </div>
    </div>
  )
}