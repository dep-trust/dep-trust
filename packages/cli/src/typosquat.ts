export interface TyposquatResult {
  name: string
  similarTo: string
  distance: number
  confidence: 'high' | 'medium'
}

export function detectTyposquats(
  deps: string[],
  topPackages: Set<string>,
): TyposquatResult[] {
  const results: TyposquatResult[] = []

  for (const dep of deps) {
    if (topPackages.has(dep)) continue

    let bestMatch: string | null = null
    let bestDistance = Infinity

    for (const top of topPackages) {
      if (Math.abs(top.length - dep.length) > 2) continue

      const d = levenshtein(dep, top)
      if (d < bestDistance) {
        bestDistance = d
        bestMatch = top
      }
      if (bestDistance === 1) break // can't get better
    }

    if (bestMatch && bestDistance <= 2) {
      let confidence: 'high' | 'medium' = 'medium'
      if (bestDistance === 1) confidence = 'high'
      else if (bestDistance === 2 && dep.length > 5) confidence = 'medium'
      else continue // Ignore distance 2 for short strings

      results.push({
        name: dep,
        similarTo: bestMatch,
        distance: bestDistance,
        confidence,
      })
    } else {
      // Check common substitutions if Levenshtein distance > 2
      // e.g., missing '-js', swapping '-' and '_'
      for (const top of topPackages) {
        if (dep === top.replace('-', '_') || dep === top.replace('_', '-')) {
          results.push({
            name: dep,
            similarTo: top,
            distance: 1, // artificial
            confidence: 'high',
          })
          break
        }
        if (dep + '-js' === top || dep + 'js' === top) {
          results.push({
            name: dep,
            similarTo: top,
            distance: 2, // artificial
            confidence: 'medium',
          })
          break
        }
      }
    }
  }

  return results
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[a.length][b.length]
}
