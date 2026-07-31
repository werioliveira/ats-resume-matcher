import { Briefcase, FileText, Loader2, Sparkles, Type, Upload } from "lucide-react"
import { useRef, useState } from "react"

type InputSectionProps = {
  isAnalyzing: boolean
  onAnalyze: () => void
  jobText: string
  setJobText: (val: string) => void
  file: File | undefined
  setFile: (val: File | undefined) => void
  resumeText: string
  setResumeText: (val: string) => void
}

type ResumeTab = "upload" | "paste"

export function InputSection({ isAnalyzing, onAnalyze, jobText, setJobText, file, setFile, resumeText, setResumeText }: InputSectionProps) {
  const [activeTab, setActiveTab] = useState<ResumeTab>("upload")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileName = file?.name ?? null

  const wordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0

  function handleFile(newFile: File | undefined) {
    if (newFile) setFile(newFile)
  }

 const canAnalyze =
    (activeTab === "upload" ? Boolean(file) : resumeText.trim().length > 0) && jobText.trim().length > 0
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      {/* Value proposition */}
      <div className="mx-auto max-w-3xl pb-10 pt-14 text-center sm:pt-20">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
          Otimização de currículo com IA
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Adapte seu currículo a qualquer vaga em segundos
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          Envie seu currículo e cole a descrição da vaga. A CVFit analisa a compatibilidade, aponta as palavras-chave que
          faltam e reescreve seu currículo sob medida para a posição.
        </p>
      </div>

      {/* Dual-pane editor */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — Resume input */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <h2 className="font-semibold text-card-foreground">Seu currículo</h2>
          </div>

          {/* Tabs */}
          <div className="mb-4 inline-flex rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "upload" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Upload className="size-4" /> Enviar arquivo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "paste" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Type className="size-4" /> Colar texto
            </button>
          </div>

          {activeTab === "upload" ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                handleFile(e.dataTransfer.files?.[0])
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex min-h-[240px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                isDragging ? "border-primary bg-accent/50" : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
              />
              <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Upload className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-medium text-foreground">Arraste seu currículo aqui</p>
                <p className="text-sm text-muted-foreground">ou clique para procurar — PDF ou DOCX</p>
              </div>
              {fileName && (
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
                  <FileText className="size-3.5" /> {fileName} · 248 KB
                </span>
              )}
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Cole o texto do seu currículo aqui..."
                className="min-h-[240px] w-full resize-none rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
              <span className="absolute bottom-3 right-3 rounded-full bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
                {wordCount} palavras
              </span>
            </div>
          )}
        </div>

        {/* Right — Job description input */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Briefcase className="size-4" aria-hidden="true" />
            </span>
            <h2 className="font-semibold text-card-foreground">Descrição da vaga</h2>
          </div>

          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Cole aqui a descrição completa da vaga..."
            className="mb-4 min-h-[164px] w-full resize-none rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
          />

          <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="job-meta">
            Cargo / Empresa / URL do LinkedIn (opcional)
          </label>
          <input
            id="job-meta"
            type="text"
            placeholder="Ex.: Front-end Sr · Acme Inc · linkedin.com/jobs/..."
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      {/* Primary CTA */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing || !canAnalyze}
          className="group inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:-translate-y-0.5"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="size-5 transition-transform group-hover:scale-110" aria-hidden="true" />
              Analisar e otimizar currículo
            </>
          )}
        </button>
        {!canAnalyze && !isAnalyzing && (
          <p className="text-xs text-muted-foreground">Adicione seu currículo e a descrição da vaga para começar</p>
        )}
      </div>
    </section>
  )
}
