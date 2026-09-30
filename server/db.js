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

    // Seed initial data if tables are empty
    const checkRepos = await db.execute('SELECT COUNT(*) as count FROM repositories');
    const repoCount = Number(checkRepos.rows[0].count);

    if (repoCount === 0) {
      console.log('[Turso DB] Seeding initial repository telemetry...');
      await seedInitialData();
    }
  } catch (err) {
    console.error('[Turso DB Error] Migration failed:', err);
  }
}

async function seedInitialData() {
  const repo1 = {
    name: 'octocat/auth-microservice',
    description: 'OAuth2 & JWT authentication service',
    current_status: 'failed',
    default_branch: 'main',
    last_run_timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    pass_rate: 84.5,
    total_runs: 142,
    last_run_json: JSON.stringify({
      id: 'run_101',
      workflow_name: 'Test & Validate',
      author: 'alex-dev',
      commit_sha: '7e3b9a1',
      failed_job: 'unit-tests-jwt',
      failed_step: 'Execute Jest Security Suite',
      duration_seconds: 114
    })
  };

  const repo2 = {
    name: 'octocat/payment-gateway',
    description: 'Stripe & PayPal transaction handler',
    current_status: 'passed',
    default_branch: 'main',
    last_run_timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    pass_rate: 98.2,
    total_runs: 310,
    last_run_json: JSON.stringify({
      id: 'run_102',
      workflow_name: 'CI/CD Pipeline',
      author: 'sarah-ops',
      commit_sha: '9c4f1e0',
      duration_seconds: 240
    })
  };

  await db.execute({
    sql: `INSERT OR REPLACE INTO repositories (name, description, current_status, default_branch, last_run_timestamp, pass_rate, total_runs, last_run_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [repo1.name, repo1.description, repo1.current_status, repo1.default_branch, repo1.last_run_timestamp, repo1.pass_rate, repo1.total_runs, repo1.last_run_json]
  });

  await db.execute({
    sql: `INSERT OR REPLACE INTO repositories (name, description, current_status, default_branch, last_run_timestamp, pass_rate, total_runs, last_run_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [repo2.name, repo2.description, repo2.current_status, repo2.default_branch, repo2.last_run_timestamp, repo2.pass_rate, repo2.total_runs, repo2.last_run_json]
  });

  const run1 = {
    id: 'run_101',
    run_id: '987654321',
    repository: 'octocat/auth-microservice',
    branch: 'main',
    commit_sha: '7e3b9a1',
    author: 'alex-dev',
    workflow_name: 'Test & Validate',
    status: 'failed',
    conclusion: 'failure',
    run_url: 'https://github.com/octocat/auth-microservice/actions/runs/987654321',
    failed_job: 'unit-tests-jwt',
    failed_step: 'Execute Jest Security Suite',
    raw_logs: 'FAIL src/auth/token.test.ts\n  ● verifyToken › should reject expired tokens\n    AssertionError: expected VALID_200 to equal EXPIRED_401',
    clean_error: 'FAIL src/auth/token.test.ts\n  ● verifyToken › should reject expired tokens\n    AssertionError: expected VALID_200 to equal EXPIRED_401',
    matched_pattern: 'Test Suite Failure (Jest/Vitest)',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    duration_seconds: 114
  };

  await db.execute({
    sql: `INSERT OR REPLACE INTO workflow_runs (id, run_id, repository, branch, commit_sha, author, workflow_name, status, conclusion, run_url, failed_job, failed_step, raw_logs, clean_error, matched_pattern, timestamp, duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [run1.id, run1.run_id, run1.repository, run1.branch, run1.commit_sha, run1.author, run1.workflow_name, run1.status, run1.conclusion, run1.run_url, run1.failed_job, run1.failed_step, run1.raw_logs, run1.clean_error, run1.matched_pattern, run1.timestamp, run1.duration_seconds]
  });

  const alert1 = {
    id: 'alert_1',
    type: 'build_failure',
    severity: 'critical',
    repository: 'octocat/auth-microservice',
    branch: 'main',
    workflow_name: 'Test & Validate',
    failed_job: 'unit-tests-jwt',
    failed_step: 'Execute Jest Security Suite',
    commit_sha: '7e3b9a1',
    author: 'alex-dev',
    clean_error: 'AssertionError: expected VALID_200 to equal EXPIRED_401',
    run_id: '987654321',
    run_url: 'https://github.com/octocat/auth-microservice/actions/runs/987654321',
    is_read: 0,
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString()
  };

  await db.execute({
    sql: `INSERT OR REPLACE INTO site_alerts (id, type, severity, repository, branch, workflow_name, failed_job, failed_step, commit_sha, author, clean_error, run_id, run_url, is_read, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [alert1.id, alert1.type, alert1.severity, alert1.repository, alert1.branch, alert1.workflow_name, alert1.failed_job, alert1.failed_step, alert1.commit_sha, alert1.author, alert1.clean_error, alert1.run_id, alert1.run_url, alert1.is_read, alert1.timestamp]
  });
}
