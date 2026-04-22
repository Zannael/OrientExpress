import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import { scrapeProductFromHtml } from './scraper/productScraper.js'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const pagesBase = process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}/` : '/'

function looksLikeBotProtection(html) {
  const lowered = (html || '').toLowerCase()
  return (
    lowered.includes('just a moment') ||
    lowered.includes('attention required') ||
    lowered.includes('cloudflare') ||
    lowered.includes('access denied') ||
    lowered.includes('403 forbidden') ||
    lowered.includes('/cdn-cgi/challenge-platform/') ||
    lowered.includes('__cf$cv$params') ||
    lowered.includes('cf-browser-verification') ||
    lowered.includes('checking your browser before accessing')
  )
}

async function fetchHtmlWithCurl(url) {
  const { stdout } = await execFileAsync(
    'curl',
    [
      '-L',
      '-s',
      '-A',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      '-H',
      'Accept-Language: en-US,en;q=0.9,it;q=0.8',
      '-w',
      '\n__STATUS__:%{http_code}',
      url,
    ],
    { maxBuffer: 5 * 1024 * 1024 },
  )

  const marker = '\n__STATUS__:'
  const markerIndex = stdout.lastIndexOf(marker)
  if (markerIndex === -1) {
    return { status: 0, html: stdout }
  }

  const html = stdout.slice(0, markerIndex)
  const statusRaw = stdout.slice(markerIndex + marker.length).trim()
  const status = Number(statusRaw) || 0
  return { status, html }
}

function productScraperApiPlugin() {
  const handleRequest = async (req, res) => {
    if (req.method !== 'GET') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Metodo non supportato' }))
      return
    }

    const requestUrl = new URL(req.url, 'http://localhost')
    const targetUrl = requestUrl.searchParams.get('url')

    if (!targetUrl) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Parametro url mancante' }))
      return
    }

    let normalizedUrl
    try {
      normalizedUrl = new URL(targetUrl)
    } catch {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'URL non valido' }))
      return
    }

    try {
      const response = await fetch(normalizedUrl.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
        },
      })

      let html = await response.text()
      let status = response.status

      const shouldTryCurl =
        !response.ok ||
        html.length < 2000 ||
        looksLikeBotProtection(html) ||
        normalizedUrl.hostname.includes('fromjapan.co.jp')

      if (shouldTryCurl) {
        try {
          const curlResult = await fetchHtmlWithCurl(normalizedUrl.toString())
          const curlLooksGood =
            curlResult.status >= 200 &&
            curlResult.status < 300 &&
            curlResult.html &&
            !looksLikeBotProtection(curlResult.html)

          if (curlLooksGood || (curlResult.html && curlResult.html.length > html.length)) {
            html = curlResult.html
            status = curlResult.status || status
          }
        } catch {
          // keep fetch result as fallback
        }
      }

      if (status < 200 || status >= 300 || looksLikeBotProtection(html)) {
        const host = normalizedUrl.hostname
        const blockedMessage =
          `Il sito ${host} sta bloccando la richiesta automatica (status ${status}). ` +
          'Per ZenMarket/FROM JAPAN questo e comune con anti-bot.'

        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: blockedMessage }))
        return
      }

      const data = scrapeProductFromHtml(html, normalizedUrl.toString())

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(data))
    } catch {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Errore interno durante lo scraping' }))
    }
  }

  return {
    name: 'product-scraper-api',
    configureServer(server) {
      server.middlewares.use('/api/scrape-product', handleRequest)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/scrape-product', handleRequest)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: pagesBase,
  plugins: [react(), tailwindcss(), productScraperApiPlugin()],
})
