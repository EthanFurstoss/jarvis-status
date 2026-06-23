// Loads variables from a local .env file into process.env, if the file exists.
// Uses Node's built-in loader (Node >= 20.6) — no dependency required.
// Imported first by server.js so credentials are available before any module
// reads process.env. Running without a .env file is fine (mock mode).
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const envPath = join(dirname(fileURLToPath(import.meta.url)), '.env');
if (existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
  } catch (err) {
    console.warn(`Could not load .env: ${err.message}`);
  }
}
