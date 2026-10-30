import { execSync } from 'child_process';
import 'dotenv/config';

try {
  let dbName = 'postgres';
  if (process.env.DATABASE_URL) {
    const parsed = new URL(process.env.DATABASE_URL);
    dbName = parsed.pathname.replace(/^\//, '') || 'postgres';
  }
  console.log(`[Startup] Running Prisma DB update for database: ${dbName}...`);
  execSync(`npx prisma db update --no-interactive --confirm ${dbName}`, { stdio: 'inherit' });
  console.log('[Startup] Prisma DB update completed.');
} catch (err) {
  console.warn('[Startup] Prisma db update warning/skipped:', err.message);
}
