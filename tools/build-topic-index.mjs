// Rebuilds src/data/topic-index.json, the topic list that the home page search uses.
// It opens each lab in a headless browser and reads the syllabus data the lab already holds,
// so the index always matches what students see in the labs.
//
// Run it after changing any lab's topics:
//   1. serve the labs:   python3 -m http.server 4802 --directory public
//   2. in another shell: npx -y -p playwright@1 node tools/build-topic-index.mjs
/* global process, URL, console */
import fs from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.env.LAB_ORIGIN || 'http://localhost:4802'
const OUT = new URL('../src/data/topic-index.json', import.meta.url)

const decode = (s) =>
  String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

const browser = await chromium.launch()
const page = await browser.newPage()
await page.route('**/*', (r) =>
  r.request().url().startsWith(BASE) ? r.continue() : r.abort(),
)

async function read(lab, fn) {
  await page.goto(`${BASE}/labs/${lab}.html`)
  await page.waitForTimeout(1200)
  return page.evaluate(fn)
}

/* eslint-disable no-undef -- these globals live inside each lab page */
const raw = {
  maths: await read('waec-maths-dashboard', () => {
    const r = []
    for (const c of ['core', 'further']) {
      setCourse(c)
      for (const t of syl())
        r.push({ t: t.title, s: (t.subtopics || []).map((s) => s.title) })
    }
    return r
  }),
  physics: await read('physics_lab_full', () =>
    SYLLABUS.flatMap((part) =>
      part.topics.map((t) => ({
        t: t.title,
        s: (t.subs || []).map((s) =>
          typeof s === 'string' ? s : s.t || s.title,
        ),
      })),
    ),
  ),
  chemistry: await read('chemistry-simulations', () =>
    Object.values(SECTIONS).flatMap((sec) =>
      sec.topics.map((t) => ({
        t: t.title,
        s: (t.subs || []).map((s) => s.t),
      })),
    ),
  ),
  biology: await read('waec-biology-lab', () =>
    allTopics().map((t) => ({
      t: t.title,
      s: t.subtopics.map((s) => s.title),
    })),
  ),
  geography: await read('waec-geography-lab', () =>
    allTopics().map((t) => ({
      t: t.title,
      s: t.subtopics.map((s) => s.title),
    })),
  ),
}
/* eslint-enable no-undef */
await browser.close()

const index = Object.fromEntries(
  Object.entries(raw).map(([k, topics]) => [
    k,
    topics.map((t) => ({ t: decode(t.t), s: t.s.filter(Boolean).map(decode) })),
  ]),
)
fs.writeFileSync(OUT, JSON.stringify(index))
for (const [k, topics] of Object.entries(index))
  console.log(
    k.padEnd(10),
    topics.length,
    'topics',
    topics.reduce((n, t) => n + t.s.length, 0),
    'subtopics',
  )
