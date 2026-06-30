interface RegistryTime {
  [version: string]: string
  modified: string
  created: string
}

interface RegistryResponse {
  time?: RegistryTime
  maintainers?: Array<{ name: string; email: string }>
}

export interface PackagePublishInfo {
  name: string
  version: string
  publishedAt: Date | null
  maintainers: string[]
  error: string | null
}

export async function fetchPackageInfo(name: string, version: string): Promise<PackagePublishInfo> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      return { name, version, publishedAt: null, maintainers: [], error: `HTTP ${response.status}` }
    }

    const pkg = (await response.json()) as RegistryResponse
    const timestamp = pkg.time?.[version]

    if (!timestamp) {
      return { name, version, publishedAt: null, maintainers: [], error: 'version not found in registry' }
    }

    const maintainers = pkg.maintainers?.map((m) => m.name) ?? []

    return { name, version, publishedAt: new Date(timestamp), maintainers, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return { name, version, publishedAt: null, maintainers: [], error: `registry unreachable for ${name}: ${message}` }
  }
}
