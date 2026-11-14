// Tables on a school server. They never leave the school: this database is separate from the control
// service's (C-4). Add a new migration at the end; never edit one that has shipped.
export const SCHOOL_MIGRATIONS: string[][] = [
  [
    `CREATE TABLE school_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      seq bigserial NOT NULL,
      role text NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'principal')),
      name text NOT NULL,
      class text NOT NULL DEFAULT '',
      username text UNIQUE,
      password_hash text,
      -- invited: has a code, has not joined. pending: joined, waiting for approval.
      -- active: approved, uses a seat. disabled: cannot sign in; their work is kept.
      status text NOT NULL CHECK (status IN ('invited', 'pending', 'active', 'disabled')),
      invite_code text UNIQUE,
      invite_expires timestamptz,
      failed_count integer NOT NULL DEFAULT 0,
      locked_until timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      approved_at timestamptz,
      disabled_at timestamptz
    )`,
    `CREATE TABLE school_sessions (
      token_hash text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES school_users(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL
    )`,
    `CREATE TABLE school_audit (
      id bigserial PRIMARY KEY,
      at timestamptz NOT NULL DEFAULT now(),
      user_id uuid REFERENCES school_users(id),
      action text NOT NULL,
      target text,
      detail text
    )`,
  ],
]
