import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const SOURCES = [
  { name: 'la1ere', url: 'https://la1ere.francetvinfo.fr/guadeloupe/' },
  { name: 'outremers360', url: 'https://outremers360.com/tag/guadeloupe' },
]

async function scrapeHeadlines(url: string): Promise<{ title: string; url: string }[]> {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    const res = await fetch(proxyUrl)
    const json = await res.json() as { contents: string }
    const html = json.contents

    // Extract <a> tags with href + text that look like article titles
    const titleRegex = /<a[^>]+href="([^"]+)"[^>]*>\s*([^<]{20,120})\s*<\/a>/gi
    const seen = new Set<string>()
    const results: { title: string; url: string }[] = []

    let match
    while ((match = titleRegex.exec(html)) !== null && results.length < 5) {
      const [, href, text] = match
      const title = text.trim().replace(/\s+/g, ' ')
      if (!seen.has(title) && title.length > 15) {
        seen.add(title)
        results.push({ title, url: href.startsWith('http') ? href : url })
      }
    }
    return results
  } catch {
    return []
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const inserted: string[] = []

  for (const source of SOURCES) {
    const headlines = await scrapeHeadlines(source.url)
    for (const h of headlines) {
      const { error } = await supabase.from('media_watch').insert({
        title: h.title,
        source: source.name,
        url: h.url,
      })
      if (!error) inserted.push(h.title)
    }
  }

  return res.status(200).json({ inserted: inserted.length, titles: inserted })
}
