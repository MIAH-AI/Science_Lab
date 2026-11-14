// Tables for the control service: platform admins, schools, campuses, licences and the audit trail.
// Add a new migration at the end; never edit one that has shipped. Dates of a licence are kept as
// YYYY-MM-DD text so both database drivers return the same thing. A campus's current licence is simply the
// one issued last (highest seq, a running number, because two can share a timestamp); earlier ones are kept as history.
export const MIGRATIONS: string[][] = [
  [
    `CREATE TABLE platform_admins (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      name text NOT NULL,
      password_hash text,
      totp_secret text,
      totp_confirmed_at timestamptz,
      last_totp_step bigint,
      failed_count integer NOT NULL DEFAULT 0,
      locked_until timestamptz,
      disabled_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE admin_invites (
      token_hash text PRIMARY KEY,
      admin_id uuid NOT NULL REFERENCES platform_admins(id),
      expires_at timestamptz NOT NULL,
      used_at timestamptz
    )`,
    `CREATE TABLE admin_sessions (
      token_hash text PRIMARY KEY,
      admin_id uuid NOT NULL REFERENCES platform_admins(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL,
      ip text,
      user_agent text
    )`,
    `CREATE TABLE schools (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      term_months integer NOT NULL DEFAULT 3 CHECK (term_months BETWEEN 1 AND 12),
      grace_days integer NOT NULL DEFAULT 14 CHECK (grace_days BETWEEN 0 AND 90),
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE UNIQUE INDEX schools_name ON schools (lower(name))`,
    `CREATE TABLE campuses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id uuid NOT NULL REFERENCES schools(id),
      name text NOT NULL,
      suspended_at timestamptz,
      suspended_reason text,
      machine text,
      secret_hash text,
      last_heartbeat timestamptz,
      version text,
      seats_used integer,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE UNIQUE INDEX campuses_name ON campuses (school_id, lower(name))`,
    `CREATE TABLE licences (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      seq bigserial NOT NULL,
      campus_id uuid NOT NULL REFERENCES campuses(id),
      kind text NOT NULL CHECK (kind IN ('trial', 'active')),
      starts text NOT NULL CHECK (starts ~ '^\\d{4}-\\d{2}-\\d{2}$'),
      ends text NOT NULL CHECK (ends ~ '^\\d{4}-\\d{2}-\\d{2}$'),
      grace_days integer NOT NULL,
      seats integer NOT NULL CHECK (seats > 0),
      token text NOT NULL,
      note text,
      issued_at timestamptz NOT NULL DEFAULT now(),
      issued_by uuid REFERENCES platform_admins(id)
    )`,
    `CREATE INDEX licences_latest ON licences (campus_id, seq DESC)`,
    `CREATE TABLE enrol_tokens (
      token_hash text PRIMARY KEY,
      campus_id uuid NOT NULL REFERENCES campuses(id),
      expires_at timestamptz NOT NULL,
      used_at timestamptz
    )`,
    `CREATE TABLE audit (
      id bigserial PRIMARY KEY,
      at timestamptz NOT NULL DEFAULT now(),
      admin_id uuid REFERENCES platform_admins(id),
      action text NOT NULL,
      target text,
      detail text
    )`,
  ],
]
