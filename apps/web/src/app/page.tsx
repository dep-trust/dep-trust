import { Nav } from '@/components/nav'
import { Terminal } from '@/components/terminal'
import { CopyBlock } from '@/components/copy-block'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1">
        {/* Hero — Primary layer: Doto display, one strong statement */}
        <section className="px-6 pt-32 pb-24 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary mb-6">
                npm supply chain protection
              </p>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-text-display">
                Know what your dependencies are doing.
              </h1>
              <p className="mt-8 text-lg text-text-secondary max-w-xl leading-relaxed">
                dep-trust scans your npm dependency tree for supply chain attack indicators — recently
                published packages, suspicious install scripts, and unexpected lockfile changes.
              </p>
              <div className="mt-10 flex items-center gap-6">
                <a
                  href="https://dep-trust.vercel.app/signup"
                  className="inline-flex font-mono text-[13px] uppercase tracking-[0.06em] px-8 py-3 bg-text-display text-black rounded-full hover:opacity-90 transition-opacity duration-200"
                >
                  Get Started
                </a>
                <a
                  href="https://github.com/salarkhannn/dep-trust"
                  className="inline-flex font-mono text-[13px] uppercase tracking-[0.06em] px-6 py-2.5 border border-border-visible text-text-primary rounded-full hover:text-text-display hover:border-text-display transition-colors duration-200"
                >
                  View on GitHub
                </a>
              </div>
            </div>
            <div className="mt-16 lg:mt-0 w-full">
              <Terminal />
            </div>
          </div>
        </section>

        {/* Problem — Secondary layer: Space Grotesk body text */}
        <section className="px-6 py-24 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary mb-4">
              The problem
            </p>
            <h2 className="font-body text-2xl font-medium tracking-tight text-text-display">
              npm audit checks for CVEs. It doesn&apos;t check for hijacked packages.
            </h2>
            <div className="mt-10 space-y-6 text-base leading-relaxed text-text-secondary">
              <p>
                Supply chain attacks work by publishing compromised versions of popular packages.
                The attacker gains access to a maintainer account, pushes a malicious patch, and
                every downstream project that installs or updates inherits the payload. The attack
                window is typically hours — not days.
              </p>
              <p>
                dep-trust fills the gap. It flags freshly published dependencies, detects install
                hook scripts that run arbitrary code during{' '}
                <code className="font-mono text-[13px] text-text-primary">npm install</code>, and
                diffs your lockfile against a known-good snapshot to surface unexpected changes
                before they reach production.
              </p>
            </div>
          </div>
        </section>

        {/* How it works — Three numbered steps, Space Mono numbers as accent */}
        <section className="px-6 py-24 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary mb-4">
              How it works
            </p>
            <h2 className="font-body text-2xl font-medium tracking-tight text-text-display">
              Three checks. One command.
            </h2>
            <ol className="mt-12 space-y-10">
              <li className="flex gap-6">
                <span className="font-mono text-[11px] font-bold text-accent mt-1 tracking-[0.06em]">
                  01
                </span>
                <div>
                  <p className="font-body font-medium text-text-display">Freshness check</p>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    Queries the npm registry for publish timestamps. Flags any dependency whose
                    latest version was pushed within the last 72 hours — the primary attack window.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <span className="font-mono text-[11px] font-bold text-accent mt-1 tracking-[0.06em]">
                  02
                </span>
                <div>
                  <p className="font-body font-medium text-text-display">Install script detection</p>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    Scans every package in node_modules for preinstall, install, and postinstall
                    hooks. New scripts are highlighted. Allowlisted packages are de-emphasized.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <span className="font-mono text-[11px] font-bold text-accent mt-1 tracking-[0.06em]">
                  03
                </span>
                <div>
                  <p className="font-body font-medium text-text-display">Lockfile diff</p>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    Snapshots your lockfile on first run. On subsequent runs, diffs the current state
                    against the baseline to surface added, removed, and bumped packages.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Install — Code blocks with copy */}
        <section className="px-6 py-24 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary mb-4">
              Get started
            </p>
            <h2 className="font-body text-2xl font-medium tracking-tight text-text-display mb-10">
              One install. Zero configuration.
            </h2>
            <div className="space-y-6">
              <CopyBlock code="npm install -g dep-trust" label="Install" />
              <CopyBlock
                code={`dep-trust scan\ndep-trust scan --age 24\ndep-trust snapshot`}
                label="Usage"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
