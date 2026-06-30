import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const OUT_PATH = join(__dirname, '../src/data/top-packages.json')

interface NpmSearchResult {
  objects: Array<{
    package: { name: string }
  }>
}

async function fetchTopPackages() {
  console.log('Fetching top npm packages...')
  const topPackages = new Set<string>()

  // Fetch top 5000 packages (20 pages of 250)
  for (let i = 0; i < 20; i++) {
    const from = i * 250
    const url = `https://registry.npmjs.org/-/v1/search?text=boost-exact:true&size=250&from=${from}`
    console.log(`Fetching page ${i + 1}/20...`)
    
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      const data = (await res.json()) as NpmSearchResult
      for (const obj of data.objects) {
        topPackages.add(obj.package.name)
      }
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      console.error(`Failed to fetch page ${i + 1}:`, err)
      break
    }
  }

  const sorted = [...topPackages].sort()
  writeFileSync(OUT_PATH, JSON.stringify(sorted, null, 2))
  console.log(`Saved ${sorted.length} packages to ${OUT_PATH}`)
}

fetchTopPackages().catch(console.error)
