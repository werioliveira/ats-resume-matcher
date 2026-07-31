import { Bell, Menu, Moon, Sparkles, Sun, X } from "lucide-react"
import { useState } from "react"

const navLinks = ["Dashboard", "Histórico", "Modelos", "Preços"]

type SiteHeaderProps = {
  isDark: boolean
  onToggleTheme: () => void
}

export function SiteHeader({ isDark, onToggleTheme }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

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

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {navLinks.map((link, i) => (
            <a
              key={link}
              href="#"
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                i === 0 ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <span className="hidden items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground sm:inline-flex">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Pro
          </span>

          <button
            type="button"
            className="relative flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Notificações"
          >
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-background" />
          </button>

          {/* Fixed: Replaced broken image with a clean avatar placeholder */}
          <div className="flex size-9 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold text-muted-foreground">
            WO
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground md:hidden"
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border px-4 py-3 md:hidden" aria-label="Navegação mobile">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link}>
                <a href="#" className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}