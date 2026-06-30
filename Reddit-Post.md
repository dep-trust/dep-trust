# I built dep-trust: An npm audit alternative that actually checks for active supply chain attacks

Hey everyone,

If you’ve run `npm install` recently, you’ve probably seen the dreaded `73 vulnerabilities (42 moderate, 31 high)` message. And if you’re like most of us, you probably ignored it because 99% of them are non-exploitable ReDoS bugs in some 4-levels-deep dev dependency like `terser` or `word-wrap`.

The problem is that while we are busy ignoring `npm audit`, **actual supply chain attacks are happening.** Attackers hijack a maintainer's account, push a malicious patch with an install script to a popular package, and compromise developer machines within hours. By the time a CVE is filed days later, the damage is already done.

I got tired of this gap in security tooling, so I built **[dep-trust](https://dep-trust.dev/)**.

It entirely ignores historical CVEs and instead looks for the behavioral markers of an active, ongoing supply chain attack right now.

Here is what it does when you run `dep-trust scan`:

1.  **Freshness checks:** The primary attack window for a compromised package is within the first 72 hours of publication (before it gets caught). `dep-trust` hits the npm registry and flags any dependency in your tree that was published very recently.
2.  **Install hook detection:** It scans `node_modules` for `preinstall`, `install`, and `postinstall` scripts. This is how 90% of malware payloads execute. It highlights new scripts you haven't seen before and lets you allowlist the ones you trust (like `esbuild` or `node-gyp`).
3.  **Lockfile diffing:** It takes a snapshot of your lockfile. The next time you run a scan, it diffs your current state against the known-good base, cleanly surfacing unexpected additions or silent version bumps.

It’s completely open-source (MIT), works instantly via npx, and runs line-by-line custom parsers for both `package-lock.json` and `pnpm-lock.yaml` so it’s fast and doesn't eat your RAM.

You can try it out globally or just run it via npx without installing:

```bash
npx dep-trust scan
```

The repo is at [https://github.com/salarkhannn/dep-trust](https://github.com/salarkhannn/dep-trust). Would love for you guys to tear it apart, try it on your monorepos, and let me know what you think.
