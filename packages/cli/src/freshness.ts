import { pMap } from './concurrency'
import { fetchPackageInfo } from './registry'
import type { FreshnessResult, PackageMeta } from '@dep-trust/types/scan'

const REGISTRY_CONCURRENCY = 10

export async function checkFreshness(
  packages: PackageMeta[],
  maxAgeHours: number,
): Promise<FreshnessResult[]> {
  const settled = await pMap(
    packages,
    async (pkg) => {
      const info = await fetchPackageInfo(pkg.name, pkg.version)

      if (info.error || !info.publishedAt) {
        return {
          name: pkg.name,
          version: pkg.version,
          publishedAt: null,
          ageHours: null,
          flagged: false,
          maintainers: info.maintainers,
          hasProvenance: info.hasProvenance,
          error: info.error,
        } satisfies FreshnessResult
      }

      const ageMs = Date.now() - info.publishedAt.getTime()
      const ageHours = Math.round(ageMs / 3_600_000)

      return {
        name: pkg.name,
        version: pkg.version,
        publishedAt: info.publishedAt,
        ageHours,
        flagged: ageHours < maxAgeHours,
        maintainers: info.maintainers,
        hasProvenance: info.hasProvenance,
        error: null,
      } satisfies FreshnessResult
    },
    REGISTRY_CONCURRENCY,
  )

  const results: FreshnessResult[] = []
  for (const entry of settled) {
    if (entry.status === 'fulfilled') results.push(entry.value)
  }
  return results
}
