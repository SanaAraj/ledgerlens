import { Moon, ScanSearch, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useTheme } from "@/lib/theme";

export function Header({ right }: { right?: ReactNode }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-20 border-b border-ink-border bg-ink text-ink-foreground">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.6)]">
            <ScanSearch className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold tracking-tight">LedgerLens</span>
            <span className="hidden rounded border border-white/15 px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-ink-muted sm:inline">
              Journal-entry audit
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {right}
          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-white/10 hover:text-ink-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
