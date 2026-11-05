export function Brand({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-[11px] font-extrabold tracking-tight text-white shadow-sm shadow-primary/20">AEON</span>
      <span className="min-w-0 truncate text-sm font-medium text-foreground/75">{subtitle}</span>
    </div>
  )
}
