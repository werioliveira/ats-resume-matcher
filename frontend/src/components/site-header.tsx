import { Moon, Sparkles, Sun } from "lucide-react"


type SiteHeaderProps = {
  isDark: boolean
  onToggleTheme: () => void
}

export function SiteHeader({ isDark, onToggleTheme }: SiteHeaderProps) {

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center gap-2" aria-label="CVFit início">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            CV<span className="text-primary">Fit</span>
          </span>
        </a>


        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>


        </div>
      </div>

    </header>
  )
}