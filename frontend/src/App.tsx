import { useEffect, useRef, useState } from "react"
import { useResumeAnalysis } from "./hooks/useResumeAnalysis"
import { SiteHeader } from "./components/site-header"
import { InputSection } from "./components/input-sections"
import { ResultsDashboard } from "./components/results-dashboard"

export default function App() {
  const { state, submitAnalysis, handleExportDocx, reset } = useResumeAnalysis()
  const [isDark, setIsDark] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  // State lifted from InputSection so the Hook can use it
  const [jobText, setJobText] = useState("")
  const [file, setFile] = useState<File | undefined>()
  const [resumeText, setResumeText] = useState("")

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  useEffect(() => {
    if (state.status === "success") {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [state.status])

  const isExporting = state.status === "exporting"

  const handleAnalyze = () => {
    // MVP Constraint: Backend only parses files (PDF/DOCX). 
    // If user pasted text, we alert them to use a file instead.
    if (file) {
      submitAnalysis(jobText, file)
    } else if (resumeText.trim()) {
      alert("No MVP atual, a análise via texto colado ainda não é suportada. Por favor, faça o upload de um arquivo PDF ou DOCX.")
    }
  }

  return (
    <div className="min-h-screen bg-background" aria-live="polite">
      <SiteHeader isDark={isDark} onToggleTheme={() => setIsDark((v) => !v)} />

      <main>
        <InputSection
          isAnalyzing={state.status === "analyzing" || state.status === "rate_limited"} 
          onAnalyze={handleAnalyze}
          jobText={jobText}
          setJobText={setJobText}
          file={file}
          setFile={setFile}
          resumeText={resumeText}
          setResumeText={setResumeText}
        />

        {state.status === "error" && (
          <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              <strong>Erro:</strong> {state.error?.message || "Ocorreu um erro inesperado."}
              <button onClick={reset} className="ml-4 underline">Tentar novamente</button>
            </div>
          </div>
        )}

        {state.status === "rate_limited" && (
          <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-warning/50 bg-warning/10 p-4 text-warning-foreground">
              Muitas requisições. Aguarde {state.retryAfter}s ou tente novamente.
              <button onClick={reset} className="ml-4 underline">Voltar</button>
            </div>
          </div>
        )}

        {state.status === "success" && state.data && (
          <div ref={resultsRef}>
            <ResultsDashboard 
              analysis={state.data} 
              onReset={reset}
              onExportDocx={handleExportDocx}
              isExporting={isExporting}
              rawBackendData={state.rawBackendData}
            />
          </div>
        )}
      </main>
    </div>
  )
}