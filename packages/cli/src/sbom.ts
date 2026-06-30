import type { ScanResult } from '@dep-trust/types/scan'

export function generateSbom(result: ScanResult, projectName: string): string {
  const sbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.4',
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: result.timestamp,
      tools: [
        {
          vendor: 'dep-trust',
          name: 'dep-trust-cli',
          version: '0.1.3' // could be dynamic
        }
      ],
      component: {
        type: 'application',
        name: projectName
      }
    },
    components: result.freshness.map(dep => ({
      type: 'library',
      name: dep.name,
      version: dep.version,
      purl: `pkg:npm/${dep.name}@${dep.version}`,
      properties: [
        { name: 'dep-trust:ageHours', value: String(dep.ageHours) },
        { name: 'dep-trust:flagged', value: String(dep.flagged) },
        { name: 'dep-trust:hasProvenance', value: String(dep.hasProvenance) }
      ]
    }))
  }

  return JSON.stringify(sbom, null, 2)
}
