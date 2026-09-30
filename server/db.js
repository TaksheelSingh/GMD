import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Determine Turso vs Local SQLite URL
const dbUrl = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), 'server', 'gmd.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log(`[Turso DB] Connecting to database target: ${process.env.TURSO_DATABASE_URL ? 'Turso Cloud' : 'Local SQLite (' + dbUrl + ')'}`);

export const db = createClient({
  url: dbUrl,
  authToken: authToken,
});

export async function initDb() {
  try {
    // Create Repositories table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS repositories (
        name TEXT PRIMARY KEY,
        description TEXT,
        current_status TEXT,
        default_branch TEXT,
        last_run_timestamp TEXT,
        pass_rate REAL,
        total_runs INTEGER,
        last_run_json TEXT
      );
    `);

    // Create Workflow Runs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS workflow_runs (
        id TEXT PRIMARY KEY,
        run_id TEXT,
        repository TEXT,
        branch TEXT,
        commit_sha TEXT,
        author TEXT,
        workflow_name TEXT,
        status TEXT,
        conclusion TEXT,
        run_url TEXT,
        failed_job TEXT,
        failed_step TEXT,
        raw_logs TEXT,
        clean_error TEXT,
        matched_pattern TEXT,
        timestamp TEXT,
        duration_seconds INTEGER
      );
    `);

    // Create Site Alerts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS site_alerts (
        id TEXT PRIMARY KEY,
        type TEXT,
        severity TEXT,
        repository TEXT,
        branch TEXT,
        workflow_name TEXT,
        failed_job TEXT,
        failed_step TEXT,
        commit_sha TEXT,
        author TEXT,
        clean_error TEXT,
        run_id TEXT,
        run_url TEXT,
        is_read INTEGER,
        timestamp TEXT
      );
    `);

    // Clear any existing dummy data so dashboard starts 100% clean
    await db.execute('DELETE FROM repositories');
    await db.execute('DELETE FROM workflow_runs');
    await db.execute('DELETE FROM site_alerts');
    console.log('[Turso DB] Database schema verified and clean (0 dummy records).');
  } catch (err) {
    console.error('[Turso DB Error] Migration failed:', err);
  }
}
