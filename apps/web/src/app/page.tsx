import { Nav } from '@/components/nav'
import { Terminal } from '@/components/terminal'
import { CopyBlock } from '@/components/copy-block'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 relative z-10">
        {/* Hero — Primary layer: Doto display, one strong statement */}
        <section className="px-6 pt-32 pb-24 max-w-6xl mx-auto clip-reveal">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="animate-stagger-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent mb-6">
                npm supply chain protection
              </p>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-text-display">
                Know what your dependencies are doing.
              </h1>
              <p className="mt-8 text-lg text-text-secondary max-w-xl leading-relaxed">
                dep-trust scans your npm dependency tree for supply chain attack indicators — freshly published packages, 
                typosquatting, obfuscated code payloads, malicious install scripts, and missing SLSA provenance.
                <br /><br />
                <span className="text-text-primary font-medium tracking-wide text-sm bg-accent-subtle text-accent px-2 py-1 rounded">100% Free forever. No credit card.</span>
              </p>
              <div className="mt-10 flex items-center gap-6 animate-stagger-2">
                <a
                  href={`${process.env['NEXT_PUBLIC_DASHBOARD_URL'] ?? 'https://dep-trust-dashboard.vercel.app'}/signup`}
                  className="hover-scale inline-flex font-mono text-[13px] uppercase tracking-[0.06em] px-8 py-3 bg-text-display text-black rounded-full hover:opacity-90"
                >
                  Start Using Free
                </a>
                <a
                  href="https://github.com/salarkhannn/dep-trust"
                  className="hover-scale inline-flex font-mono text-[13px] uppercase tracking-[0.06em] px-6 py-2.5 border border-border-visible text-text-primary rounded-full hover:text-text-display hover:border-text-display"
                >
                  View on GitHub
                </a>
              </div>
            </div>
            <div className="mt-16 lg:mt-0 w-full animate-stagger-3">
              <Terminal />
            </div>
          </div>
        </section>

        {/* Problem — Secondary layer: Space Grotesk body text */}
        <section className="px-6 py-32 border-t border-border animate-stagger-4 relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[50vw] h-[50vw] bg-accent opacity-5 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-3xl mx-auto relative z-10">
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
                dep-trust fills the gap. It flags freshly published dependencies, detects typosquatted packages, 
                deep-scans source code for obfuscated payloads, validates SLSA provenance, and tracks 
                maintainer changes—all before malicious code reaches production.
              </p>
            </div>
          </div>
        </section>

        {/* How it works — Three numbered steps, Space Mono numbers as accent */}
        <section className="px-6 py-32 border-t border-border relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-[40vw] h-[40vw] bg-interactive opacity-5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
          <div className="max-w-3xl mx-auto relative z-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary mb-4">
              How it works
            </p>
            <h2 className="font-body text-2xl font-medium tracking-tight text-text-display">
              Six checks. One command.
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
                  <p className="font-body font-medium text-text-display">Maintainer Change Detection</p>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    Diffs your dependency maintainers against a baseline snapshot. Automatically flags when a new, unknown maintainer publishes a patch to a package you rely on.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <span className="font-mono text-[11px] font-bold text-accent mt-1 tracking-[0.06em]">
                  03
                </span>
                <div>
                  <p className="font-body font-medium text-text-display">Typosquat Detection</p>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    Compares your dependency tree against a local corpus of the top 2,500 most popular npm packages using a highly-optimized Levenshtein distance algorithm.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <span className="font-mono text-[11px] font-bold text-accent mt-1 tracking-[0.06em]">
                  04
                </span>
                <div>
                  <p className="font-body font-medium text-text-display">Deep Static Analysis</p>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    Runs static analysis on suspicious dependencies, looking for obfuscated payloads, credential harvesting, dynamic execution (<code>eval</code>), and hidden HTTP requests.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <span className="font-mono text-[11px] font-bold text-accent mt-1 tracking-[0.06em]">
                  05
                </span>
                <div>
                  <p className="font-body font-medium text-text-display">Install Script Warnings</p>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    Scans every package in node_modules for preinstall, install, and postinstall
                    hooks. New scripts are highlighted. Allowlisted packages are de-emphasized.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <span className="font-mono text-[11px] font-bold text-accent mt-1 tracking-[0.06em]">
                  06
                </span>
                <div>
                  <p className="font-body font-medium text-text-display">SLSA Provenance Validation</p>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    Checks the npm registry for signed attestations, warning you when a flagged package lacks a verifiable build provenance.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Install — Code blocks with copy */}
        <section className="px-6 py-32 border-t border-border relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-[60vw] h-[30vw] bg-success opacity-5 rounded-full blur-[150px] pointer-events-none" />
          <div className="max-w-3xl mx-auto relative z-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary mb-4">
              Get started
            </p>
            <h2 className="font-body text-2xl font-medium tracking-tight text-text-display mb-10">
              One install. Zero configuration.
            </h2>
            <div className="space-y-6">
              <CopyBlock code="npm install -g dep-trust" label="Install" />
              <CopyBlock
                code={`dep-trust scan\ndep-trust scan --deep\ndep-trust scan --sbom\ndep-trust snapshot`}
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
