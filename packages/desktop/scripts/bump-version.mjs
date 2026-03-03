import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

const env = readFileSync(envPath, 'utf8');
const match = env.match(/VITE_APP_VERSION=(\d+)\.(\d+)\.(\d+)/);

if (match) {
  const [, ma, mi, pa] = match;
  const next = `${ma}.${mi}.${+pa + 1}`;
  writeFileSync(envPath, env.replace(match[0], `VITE_APP_VERSION=${next}`));
  console.log(`Version bumped to v${next}`);
} else {
  console.error('VITE_APP_VERSION not found in .env');
  process.exit(1);
}
