// One small interface over Postgres. Online it is Netlify DB (Neon); for local work, tests and school
// servers it is PGlite, the same Postgres engine embedded in the app, so there is one SQL dialect everywhere.
import { config } from './config'
import { MIGRATIONS } from './schema'

export type Row = Record<string, unknown>
export type Db = {
  query: <T = Row>(text: string, params?: unknown[]) => Promise<T[]>
  close: () => Promise<void>
}

// Brings a database up to date. Each migration is a list of single statements, because the online driver
// sends one statement per request.
export async function migrate(db: Db, migrations: string[][] = MIGRATIONS) {
  await db.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (id integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  )
  const done = new Set(
    (await db.query<{ id: number }>('SELECT id FROM schema_migrations')).map(
      (r) => Number(r.id),
    ),
  )
  for (const [i, statements] of migrations.entries()) {
    if (done.has(i + 1)) continue
    for (const statement of statements) await db.query(statement)
    await db.query('INSERT INTO schema_migrations (id) VALUES ($1)', [i + 1])
  }
  return db
}

async function embedded(dataDir?: string): Promise<Db> {
  const { PGlite } = await import('@electric-sql/pglite')
  const pg = new PGlite(dataDir)
  return {
    query: async <T = Row>(text: string, params: unknown[] = []) =>
      (await pg.query<T>(text, params)).rows,
    close: () => pg.close(),
  }
}

async function online(url: string): Promise<Db> {
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(url)
  return {
    query: async <T = Row>(text: string, params: unknown[] = []) =>
      (await sql.query(text, params)) as T[],
    close: async () => {},
  }
}

// A fresh, empty, in-memory database for tests.
export const memoryDb = async (migrations: string[][] = MIGRATIONS) =>
  migrate(await embedded(), migrations)

let shared: Promise<Db> | null = null
export function getDb() {
  shared ??= (async () => {
    const url = config.databaseUrl()
    if (url) return migrate(await online(url))
    // Online hosting has no disk that lasts, so the embedded database would lose everything.
    if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)
      throw new Error(
        'DATABASE_URL is not set, so the console has nowhere to keep its data.',
      )
    const { mkdirSync } = await import('node:fs')
    const dir = config.dataDir() + '/pg'
    mkdirSync(dir, { recursive: true })
    // A school server keeps its own tables (accounts, classes), never the control service's.
    if (process.env.APP_MODE === 'campus') {
      const { SCHOOL_MIGRATIONS } = await import('../school/schema')
      return migrate(await embedded(dir), SCHOOL_MIGRATIONS)
    }
    return migrate(await embedded(dir))
  })()
  return shared
}

// Timestamps come back as Date from one driver and as text from the other.
export const iso = (value: unknown) =>
  value == null ? null : new Date(value as string | Date).toISOString()
