import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer'
import type { ScanRecord } from '@dep-trust/types/scan'

Font.register({
  family: 'SpaceMono',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRUEZ2RFq7AwU.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/spacemono/v13/i7dMIFZifjKcF5UAWdDRYER8QHi-EwWMbg.ttf', fontWeight: 700 },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#1A1A1A',
    padding: 48,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    paddingBottom: 16,
  },
  wordmark: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: '#666666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: '#F5F5F5',
    fontWeight: 700,
  },
  col1: { width: '40%' },
  col2: { width: '30%' },
  col3: { width: '30%' },
  cell: {
    fontSize: 9,
    color: '#1A1A1A',
  },
  dimCell: {
    fontSize: 9,
    color: '#666666',
  },
  flagCell: {
    fontSize: 9,
    color: '#D71921',
  },
  statRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyNote: {
    fontSize: 9,
    color: '#999999',
    fontStyle: 'italic',
  },
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  })
}

function ScanReport({ scan }: { scan: ScanRecord }) {
  const { summary, findings } = scan
  const flaggedFreshness = findings.freshness.filter((f) => f.flagged)
  const newScripts = findings.scripts.filter((s) => s.status === 'new')
  const diff = findings.diff

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>dep-trust</Text>
          <Text style={styles.subtitle}>
            Scan report · {scan.project_name} · {formatDate(scan.created_at)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{summary.total_packages}</Text>
              <Text style={styles.statLabel}>Packages</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{summary.freshness_flags}</Text>
              <Text style={styles.statLabel}>Freshness Flags</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{summary.script_flags}</Text>
              <Text style={styles.statLabel}>Script Flags</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{summary.lockfile_changes}</Text>
              <Text style={styles.statLabel}>Lockfile Changes</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Freshness Findings</Text>
          {flaggedFreshness.length === 0 ? (
            <Text style={styles.emptyNote}>No freshness flags detected.</Text>
          ) : (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={styles.col1}><Text style={styles.cell}>Package</Text></View>
                <View style={styles.col2}><Text style={styles.cell}>Version</Text></View>
                <View style={styles.col3}><Text style={styles.cell}>Age</Text></View>
              </View>
              {flaggedFreshness.map((f) => (
                <View key={f.name} style={styles.tableRow}>
                  <View style={styles.col1}><Text style={styles.flagCell}>{f.name}</Text></View>
                  <View style={styles.col2}><Text style={styles.cell}>{f.version}</Text></View>
                  <View style={styles.col3}>
                    <Text style={styles.cell}>{f.ageHours !== null ? `${f.ageHours}h ago` : 'unknown'}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Install Script Findings</Text>
          {newScripts.length === 0 ? (
            <Text style={styles.emptyNote}>No new install scripts detected.</Text>
          ) : (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={styles.col1}><Text style={styles.cell}>Package</Text></View>
                <View style={styles.col3}><Text style={styles.cell}>Scripts</Text></View>
              </View>
              {newScripts.map((s) => (
                <View key={s.name} style={styles.tableRow}>
                  <View style={styles.col1}><Text style={styles.flagCell}>{s.name}</Text></View>
                  <View style={styles.col3}><Text style={styles.cell}>{s.scripts.join(', ')}</Text></View>
                </View>
              ))}
            </View>
          )}
        </View>

        {diff && (diff.added.length > 0 || diff.removed.length > 0 || diff.bumped.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lockfile Changes</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={styles.col1}><Text style={styles.cell}>Package</Text></View>
                <View style={styles.col2}><Text style={styles.cell}>Change</Text></View>
                <View style={styles.col3}><Text style={styles.cell}>Version</Text></View>
              </View>
              {diff.added.map((d) => (
                <View key={`added-${d.name}`} style={styles.tableRow}>
                  <View style={styles.col1}><Text style={styles.cell}>{d.name}</Text></View>
                  <View style={styles.col2}><Text style={styles.cell}>added</Text></View>
                  <View style={styles.col3}><Text style={styles.cell}>{d.version}</Text></View>
                </View>
              ))}
              {diff.removed.map((d) => (
                <View key={`removed-${d.name}`} style={styles.tableRow}>
                  <View style={styles.col1}><Text style={styles.cell}>{d.name}</Text></View>
                  <View style={styles.col2}><Text style={styles.cell}>removed</Text></View>
                  <View style={styles.col3}><Text style={styles.cell}>{d.version}</Text></View>
                </View>
              ))}
              {diff.bumped.map((d) => (
                <View key={`bumped-${d.name}`} style={styles.tableRow}>
                  <View style={styles.col1}><Text style={styles.cell}>{d.name}</Text></View>
                  <View style={styles.col2}><Text style={styles.cell}>bumped</Text></View>
                  <View style={styles.col3}><Text style={styles.cell}>{d.from} → {d.to}</Text></View>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  )
}

export async function generateScanReport(scan: ScanRecord): Promise<Buffer> {
  return renderToBuffer(<ScanReport scan={scan} />)
}
