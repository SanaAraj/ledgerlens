import { ScanSearch } from "lucide-react";
import type { ReactNode } from "react";

export function Header({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-ink text-ink-foreground">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
            <ScanSearch className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </span>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold tracking-tight">LedgerLens</span>
              <span className="hidden rounded border border-white/15 px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-ink-muted sm:inline">
                Journal-entry audit
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </header>
  );
}
