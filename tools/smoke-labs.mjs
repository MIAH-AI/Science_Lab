// Smoke test for the six labs: opens every topic, mode and subtopic the way a student would,
// presses the first control in each simulation, opens Exam mode, and fails if any page error appears.
//
//   1. serve the labs:   python3 -m http.server 4802 --directory public
//   2. in another shell: npx -y -p playwright@1 node tools/smoke-labs.mjs [maths,physics,chemistry,biology,geography,agric]
//
// 3D scenes run in software rendering (SwiftShader), so this checks that scenes start, not how fast they are.
/* global process, console, document, window */
import { chromium } from 'playwright'

const BASE = process.env.LAB_ORIGIN || 'http://localhost:4802'
const only = (
  process.argv[2] || 'maths,physics,chemistry,biology,geography,agric'
).split(',')
const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})
const failures = []
const counts = {}

async function open(lab) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
  page.errs = []
  page.on('pageerror', (e) => page.errs.push(e.message.slice(0, 200)))
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text()))
      page.errs.push(m.text().slice(0, 200))
  })
  await page.route('**/*', (r) =>
    r.request().url().startsWith(BASE) ? r.continue() : r.abort(),
  )
  await page.goto(`${BASE}/labs/${lab}.html`)
  await page.waitForLoadState('load')
  return page
}
function check(page, subject, where) {
  counts[subject] = (counts[subject] || 0) + 1
  for (const e of page.errs.splice(0))
    failures.push(`${subject} | ${where} | ${e}`)
}
const text = async (loc) =>
  (await loc.innerText()).replace(/\s+/g, ' ').trim().slice(0, 60)

async function examMode(page, subject) {
  const entry = page.locator('#examBtn, [data-topic="EXAM"]').first()
  await entry.click()
  await page.waitForTimeout(400)
  const start = page.getByRole('button', { name: /^Start/ }).first()
  if (await start.count()) await start.click()
  await page.waitForTimeout(400)
  const paper = await page.evaluate(() =>
    /Question 1|QUESTION 1/i.test(document.body.innerText),
  )
  if (!paper)
    failures.push(`${subject} | exam mode | no questions appeared after Start`)
  check(page, subject, 'exam mode')
}

if (only.includes('physics')) {
  const p = await open('physics_lab_full')
  check(p, 'physics', 'load')
  for (let i = 0; i < 20; i++) {
    const closed = p.locator('.part-head:not(.open)')
    if (!(await closed.count())) break
    await closed.first().click()
  }
  const n = await p.locator('.topicbtn').count()
  for (let i = 0; i < n; i++) {
    const btn = p.locator('.topicbtn').nth(i)
    const title = await text(btn)
    await btn.click()
    await p.waitForTimeout(300)
    const modes = await p.locator('.modebtn').count()
    for (let m = 0; m < Math.max(modes, 1); m++) {
      if (modes) {
        await p.locator('.modebtn').nth(m).click()
        await p.waitForTimeout(400)
      }
      const slider = p.locator('#controls input[type=range]').first()
      if (await slider.count()) {
        await slider.focus()
        await p.keyboard.press('ArrowRight')
        await p.waitForTimeout(100)
      }
      check(p, 'physics', `${title} mode ${m + 1}`)
    }
  }
  await p.fill('#search', '<img src=x onerror=window.__xss=1>')
  await p.waitForTimeout(200)
  if (await p.evaluate(() => window.__xss === 1))
    failures.push('physics | search | typed HTML was run')
  await p.fill('#search', '')
  await examMode(p, 'physics')
  await p.close()
}

if (only.includes('chemistry')) {
  const p = await open('chemistry-simulations')
  check(p, 'chemistry', 'load')
  const tabs = await p.locator('.section-tab').count()
  for (let t = 0; t < tabs; t++) {
    await p.locator('.section-tab').nth(t).click()
    await p.waitForTimeout(150)
    const n = await p.locator('.topic-item').count()
    for (let i = 0; i < n; i++) {
      const item = p.locator('.topic-item').nth(i)
      const title = await text(item)
      await item.click()
      await p.waitForTimeout(250)
      const pills = await p.locator('.subpill').count()
      for (let s = 0; s < Math.max(pills, 1); s++) {
        if (pills) {
          await p.locator('.subpill').nth(s).click()
          await p.waitForTimeout(350)
        }
        // 3D scene files download the first time a subtopic opens; wait for that before pressing anything.
        await p
          .locator('.c3-loading')
          .waitFor({ state: 'detached', timeout: 15000 })
          .catch(() => failures.push(`chemistry | ${title} | 3D scene still loading after 15s`))
        const b = p.locator('.sim-btn').first()
        if (await b.count()) {
          await b.click({ timeout: 1500 }).catch(() => {})
          await p.waitForTimeout(250) // let a few frames run so a broken update() shows up here
        }
        check(p, 'chemistry', `${title} subtopic ${s + 1}`)
      }
    }
  }
  await examMode(p, 'chemistry')
  await p.close()
}

// Maths, Biology, Geography and Agriculture share one layout: a topic rail, accordion subtopics and a panel per subtopic.
for (const [subject, lab] of [
  ['maths', 'waec-maths-dashboard'],
  ['biology', 'waec-biology-lab'],
  ['geography', 'waec-geography-lab'],
  ['agric', 'waec-agric-lab'],
]) {
  if (!only.includes(subject)) continue
  const p = await open(lab)
  check(p, subject, 'load')
  // Every syllabus section (Core/Further, or Sections A, B and C), not just the one shown first.
  const courses = await p.$$eval('.course-tabs button[data-course]', (bs) =>
    bs.map((b) => b.dataset.course),
  )
  for (const course of courses.length ? courses : [null]) {
    if (course)
      await p.$eval(`.course-tabs button[data-course="${course}"]`, (b) =>
        b.click(),
      )
    await p.waitForTimeout(200)
    const topics = await p.locator('.tick-btn:not([data-topic="EXAM"])').count()
    for (let i = 0; i < topics; i++) {
      await p
        .locator('.tick-btn:not([data-topic="EXAM"])')
        .nth(i)
        .evaluate((b) => b.click())
      await p.waitForTimeout(150)
      const items = await p.locator('.item-head').count()
      for (let j = 0; j < items; j++) {
        const head = p.locator('.item-head').nth(j)
        const title = await text(head)
        await head.evaluate((h) => h.click())
        await p.waitForTimeout(200)
        // Only this subtopic's own "Launch 3D lab" button; a script click avoids sticky headers covering it.
        const launched = await head.evaluate((h) => {
          const item = h.parentElement
          const btn = [...item.querySelectorAll('button')].find((b) =>
            /Launch 3D lab/.test(b.textContent),
          )
          if (btn) btn.click()
          return !!btn
        })
        if (launched) await p.waitForTimeout(600)
        check(p, subject, `${course || ''} ${title}`.trim())
        await head.evaluate((h) => h.click()) // close it again so only one scene runs at a time
        await p.waitForTimeout(80)
      }
    }
  }
  await examMode(p, subject)
  await p.close()
}

await browser.close()
for (const [k, n] of Object.entries(counts))
  console.log(k.padEnd(10), n, 'views opened')
if (failures.length) {
  console.log(`\n${failures.length} problem(s):`)
  failures.forEach((f) => console.log('  ' + f))
  process.exit(1)
}
console.log('\nNo errors.')
