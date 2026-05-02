export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-disabled">
          © {new Date().getFullYear()} dep-trust
        </span>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/salarkhannn/dep-trust"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/dep-trust"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            npm
          </a>
          <a
            href="https://dep-trust.vercel.app"
            className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            Dashboard
          </a>
        </div>
      </div>
    </footer>
  )
}
