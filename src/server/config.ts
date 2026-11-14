// Settings read from the environment, in one place. Nothing here has a secret default.
//
//   CONSOLE_ENABLED=1        turns the platform admin console on (it is off unless set)
//   CONSOLE_SETUP_KEY        typed once by the first platform admin to create their account
//   LICENCE_SIGNING_KEY      Ed25519 private key (PEM, or base64 of the PEM). Control service only.
//   LICENCE_PUBLIC_KEY       the matching public key. Control service and every school server.
//   DATABASE_URL             Postgres (Netlify DB). Without it an embedded database is kept in DATA_DIR.
//   DATA_DIR                 folder for the embedded database (default .data)
const env = (name: string) => process.env[name]?.trim() || ''

const pem = (value: string) =>
  value.includes('-----BEGIN')
    ? value.replace(/\\n/g, '\n')
    : value
      ? Buffer.from(value, 'base64').toString('utf8')
      : ''

export const config = {
  consoleEnabled: () => env('CONSOLE_ENABLED') === '1',
  setupKey: () => env('CONSOLE_SETUP_KEY'),
  signingKey: () => pem(env('LICENCE_SIGNING_KEY')),
  publicKey: () => pem(env('LICENCE_PUBLIC_KEY')),
  databaseUrl: () => env('DATABASE_URL') || env('NETLIFY_DATABASE_URL'),
  dataDir: () => env('DATA_DIR') || '.data',
}
