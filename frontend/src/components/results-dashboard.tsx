
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Plus,
  RotateCcw,
  Wand2,
  XCircle,
} from "lucide-react"
import { useState } from "react"
import { finetunePrompts, type AnalysisResult } from "../lib/mock-data"
import { ScoreRing } from "./score-ring"
import { ComparisonPanel } from "./comparison-panel"
import jsPDF from 'jspdf'
import type { AnalysisResult as BackendResult } from "../types/analysis"
type ViewMode = "original" | "optimized" | "diff"

type ResultsDashboardProps = {
  analysis: AnalysisResult
  onReset: () => void
  onExportDocx: () => void
  isExporting: boolean
  rawBackendData: BackendResult | null
}

export function ResultsDashboard({ analysis, onReset, onExportDocx, isExporting, rawBackendData }: ResultsDashboardProps) {
  const [view, setView] = useState<ViewMode>("diff")
  const [copied, setCopied] = useState(false)
  const [addedKeywords, setAddedKeywords] = useState<string[]>([])

  const stats = [
    {
      label: "Palavras-chave encontradas",
      value: analysis.matchedKeywords.length,
      icon: CheckCircle2,
      tone: "text-success",
    },
    {
      label: "Palavras-chave ausentes",
      value: analysis.missingKeywords.length,
      icon: XCircle,
      tone: "text-destructive",
    },
    {
      label: "Qualidade do formato",
      value: `${analysis.formatQuality}%`,
      icon: FileText,
      tone: "text-primary",
    },
  ]

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(analysis.optimizedCV)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  function handleExportPdf() {
    if (!rawBackendData) return
    const data = rawBackendData.optimized_resume

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)
    let y = 25

    const checkPage = () => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
    }

    // --- 1. NAME ---
    checkPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    const nameLines = doc.splitTextToSize(data.name.toUpperCase(), contentWidth)
    nameLines.forEach((line: string) => {
      checkPage()
      doc.text(line, pageWidth / 2, y, { align: 'center' })
      y += 8
    })

    // --- 2. CONTACT INFO ---
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const contactLines = doc.splitTextToSize(data.contact_info, contentWidth)
    contactLines.forEach((line: string) => {
      checkPage()
      doc.text(line, pageWidth / 2, y, { align: 'center' })
      y += 4
    })
    doc.setTextColor(0, 0, 0)
    y += 6

    // --- 3. OBJECTIVE ---
    if (data.objective) {
      checkPage()
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(11)
      const objLines = doc.splitTextToSize(data.objective, contentWidth)
      objLines.forEach((line: string) => {
        checkPage()
        doc.text(line, margin, y)
        y += 5.5
      })
      y += 6
    }

    // --- 4. RESUMO PROFISSIONAL ---
    if (data.summary) {
      checkPage()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('RESUMO PROFISSIONAL', margin, y) // <--- PT-BR
      y += 7

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      const sumLines = doc.splitTextToSize(data.summary, contentWidth)
      sumLines.forEach((line: string) => {
        checkPage()
        doc.text(line, margin, y)
        y += 5.5
      })
      y += 6
    }

    // --- 5. EXPERIÊNCIA ---
    if (data.experience.length > 0) {
      checkPage()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('EXPERIÊNCIA', margin, y) // <--- PT-BR
      y += 7

      data.experience.forEach((exp) => {
        checkPage()
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text(`${exp.role} na ${exp.company}`, margin, y) // <--- PT-BR ("na" instead of "at")
        y += 5.5

        doc.setFont('helvetica', 'italic')
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        doc.text(exp.dates, margin, y)
        doc.setTextColor(0, 0, 0)
        y += 6

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        exp.bullets.forEach((bullet) => {
          const bulletLines = doc.splitTextToSize(bullet, contentWidth - 10)
          bulletLines.forEach((bLine: string, i: number) => {
            checkPage()
            if (i === 0) {
              doc.text('•', margin + 5, y)
              doc.text(bLine, margin + 10, y)
            } else {
              doc.text(bLine, margin + 10, y)
            }
            y += 5.5
          })
        })
        y += 4
      })
    }

    // --- 6. HABILIDADES (WITH BOLD CATEGORIES) ---
    if (data.skills.length > 0) {
      checkPage()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('HABILIDADES', margin, y) // <--- PT-BR
      y += 7

      data.skills.forEach((skillGroup) => {
        checkPage()
        
        // Print Category on its own line in BOLD
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text(skillGroup.category, margin, y)
        y += 5.5

        // Print Skills on the next lines in NORMAL, slightly indented
        doc.setFont('helvetica', 'normal')
        const fullSkillText = skillGroup.skills.join(', ')
        const skillLines = doc.splitTextToSize(fullSkillText, contentWidth - 5)
        
        skillLines.forEach((line: string) => {
          checkPage()
          doc.text(line, margin + 5, y) // Indented slightly
          y += 5
        })
        y += 3 // Extra space between categories
      })
      y += 4
    }

    // --- 7. EDUCAÇÃO ---
    if (data.education.length > 0) {
      checkPage()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('EDUCAÇÃO', margin, y) // <--- PT-BR
      y += 7

      data.education.forEach((edu) => {
        checkPage()
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        
        const eduText = `${edu.degree} - ${edu.institution}`
        const eduLines = doc.splitTextToSize(eduText, contentWidth)
        eduLines.forEach((line: string) => {
          checkPage()
          doc.text(line, margin, y)
          y += 5.5
        })

        doc.setFont('helvetica', 'italic')
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        doc.text(edu.dates, margin, y)
        doc.setTextColor(0, 0, 0)
        y += 8
      })
    }

    doc.save('curriculo_otimizado.pdf')
  }
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      {/* Summary banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
          <ScoreRing score={analysis.score} />
          <div className="flex-1 text-center sm:text-left">
            <div className="mb-1 flex items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success">
                <CheckCircle2 className="size-4" /> Boa compatibilidade
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-card-foreground">
              Seu currículo combina bem com a vaga
            </h2>
            <p className="mt-1 max-w-lg text-pretty leading-relaxed text-muted-foreground">
              Adicione as {analysis.missingKeywords.length} palavras-chave ausentes para elevar seu score e passar com
              folga pelos filtros de recrutamento (ATS).
            </p>
          </div>
          <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:grid-cols-1 sm:gap-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-background px-4 py-3 text-center sm:flex sm:min-w-[220px] sm:items-center sm:gap-3 sm:text-left"
              >
                <stat.icon className={`mx-auto size-5 sm:mx-0 ${stat.tone}`} aria-hidden="true" />
                <div>
                  <div className="font-mono text-xl font-semibold tabular-nums text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keyword analysis */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
            <h3 className="font-semibold text-card-foreground">Palavras-chave encontradas</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.matchedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1.5 text-sm font-medium text-success"
              >
                <Check className="size-3.5" aria-hidden="true" /> {kw}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <XCircle className="size-5 text-destructive" aria-hidden="true" />
            <h3 className="font-semibold text-card-foreground">Palavras-chave ausentes no original</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.missingKeywords.map((kw) => {
              // Check if the AI actually added this keyword to the Optimized CV text
              const wasAddedByAI = analysis.optimizedCV.toLowerCase().includes(kw.toLowerCase())
              const added = addedKeywords.includes(kw)
              
              return (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setAddedKeywords((prev) => (added ? prev.filter((k) => k !== kw) : [...prev, kw]))}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    added
                      ? "bg-success/15 text-success" // Green if user clicks it
                      : wasAddedByAI
                      ? "bg-primary/15 text-primary" // BLUE if AI added it to the optimized CV
                      : "bg-warning/15 text-warning-foreground hover:bg-warning/25" // Red if truly missing
                  }`}
                >
                  {added || wasAddedByAI ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                  {kw}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Clique para marcar como adicionado. Termos em <span className="text-primary font-semibold">azul</span> foram incluídos automaticamente no currículo otimizado para baixar.
          </p>
        </div>
      </div>

      {/* Comparison + actions */}
      <div className="mt-6">
        <ComparisonPanel analysis={analysis} view={view} onChangeView={setView} />
      </div>

      {/* Action toolbar */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copiado!" : "Copiar texto otimizado"}
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Download className="size-4" /> Exportar PDF
          </button>
  <button
    type="button"
    onClick={onExportDocx}
    disabled={isExporting}
    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
  >
    <FileText className="size-4" /> {isExporting ? "Gerando..." : "Exportar Word"}
  </button>
          <button
            type="button"
            onClick={onReset}
            className="ml-auto inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-4" /> Nova análise
          </button>
        </div>

        {/* Fine-tune with prompt */}
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Wand2 className="size-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">Ajustar com um comando</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder='Ex.: "Deixe mais conciso e focado em liderança"'
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:opacity-90"
            >
              <Wand2 className="size-4" /> Refinar
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {finetunePrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
