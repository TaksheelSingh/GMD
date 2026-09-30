import { db, initDb } from './db.js';

class TursoStore {
  constructor() {
    this.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || 'gmd_secret_key_123';
    this.githubPat = process.env.GITHUB_PAT || '';
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await initDb();
    this.initialized = true;
  }

  async getMetrics() {
    await this.init();
    const reposRes = await db.execute("SELECT COUNT(*) as total, SUM(CASE WHEN current_status = 'passed' THEN 1 ELSE 0 END) as passed, SUM(CASE WHEN current_status = 'failed' THEN 1 ELSE 0 END) as failed FROM repositories");
    const runsRes = await db.execute("SELECT COUNT(*) as total FROM workflow_runs");
    const alertsRes = await db.execute("SELECT COUNT(*) as unread FROM site_alerts WHERE is_read = 0");

    const totalRepos = Number(reposRes.rows[0].total || 0);
    const passedRepos = Number(reposRes.rows[0].passed || 0);
    const failedRepos = Number(reposRes.rows[0].failed || 0);
    const totalRuns = Number(runsRes.rows[0].total || 0);
    const unreadAlertsCount = Number(alertsRes.rows[0].unread || 0);

    const healthPercentage = totalRepos > 0 ? Math.round((passedRepos / totalRepos) * 100) : 100;

    return {
      totalRepos,
      passedRepos,
      failedRepos,
      healthPercentage,
      totalRuns,
      unreadAlertsCount,
      mttrMinutes: 14.2
    };
  }

  async getRepositories() {
    await this.init();
    const res = await db.execute('SELECT * FROM repositories ORDER BY last_run_timestamp DESC');
    return res.rows.map(row => ({
      id: row.name,
      name: row.name,
      description: row.description,
      current_status: row.current_status,
      default_branch: row.default_branch,
      last_run_timestamp: row.last_run_timestamp,
      pass_rate: Number(row.pass_rate),
      total_runs: Number(row.total_runs),
      last_run: row.last_run_json ? JSON.parse(row.last_run_json) : null
    }));
  }

  async getWorkflowRuns() {
    await this.init();
    const res = await db.execute('SELECT * FROM workflow_runs ORDER BY timestamp DESC LIMIT 100');
    return res.rows.map(row => ({
      id: row.id,
      run_id: row.run_id,
      repository: row.repository,
      branch: row.branch,
      commit_sha: row.commit_sha,
      author: row.author,
      workflow_name: row.workflow_name,
      status: row.status,
      conclusion: row.conclusion,
      run_url: row.run_url,
      failed_job: row.failed_job,
      failed_step: row.failed_step,
      raw_logs: row.raw_logs,
      clean_error: row.clean_error,
      matched_pattern: row.matched_pattern,
      timestamp: row.timestamp,
      duration_seconds: Number(row.duration_seconds)
    }));
  }

  async getSiteAlerts() {
    await this.init();
    const res = await db.execute('SELECT * FROM site_alerts ORDER BY timestamp DESC LIMIT 50');
    return res.rows.map(row => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      repository: row.repository,
      branch: row.branch,
      workflow_name: row.workflow_name,
      failed_job: row.failed_job,
      failed_step: row.failed_step,
      commit_sha: row.commit_sha,
      author: row.author,
      clean_error: row.clean_error,
      run_id: row.run_id,
      run_url: row.run_url,
      is_read: row.is_read === 1,
      timestamp: row.timestamp
    }));
  }

  async recordWorkflowRun(normalizedRun) {
    await this.init();

    await db.execute({
      sql: `INSERT OR REPLACE INTO workflow_runs (id, run_id, repository, branch, commit_sha, author, workflow_name, status, conclusion, run_url, failed_job, failed_step, raw_logs, clean_error, matched_pattern, timestamp, duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        normalizedRun.id,
        normalizedRun.run_id,
        normalizedRun.repository,
        normalizedRun.branch,
        normalizedRun.commit_sha,
        normalizedRun.author,
        normalizedRun.workflow_name,
        normalizedRun.status,
        normalizedRun.conclusion,
        normalizedRun.run_url,
        normalizedRun.failed_job || null,
        normalizedRun.failed_step || null,
        normalizedRun.raw_logs || null,
        normalizedRun.clean_error || null,
        normalizedRun.matched_pattern || null,
        normalizedRun.timestamp,
        normalizedRun.duration_seconds
      ]
    });

    const repoRunsRes = await db.execute({
      sql: `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed FROM workflow_runs WHERE repository = ?`,
      args: [normalizedRun.repository]
    });
    const repoTotal = Number(repoRunsRes.rows[0].total || 1);
    const repoPassed = Number(repoRunsRes.rows[0].passed || 0);
    const passRate = Math.round((repoPassed / repoTotal) * 100);

    const lastRunJson = JSON.stringify({
      id: normalizedRun.id,
      workflow_name: normalizedRun.workflow_name,
      author: normalizedRun.author,
      commit_sha: normalizedRun.commit_sha,
      failed_job: normalizedRun.failed_job,
      failed_step: normalizedRun.failed_step,
      duration_seconds: normalizedRun.duration_seconds
    });

    await db.execute({
      sql: `INSERT INTO repositories (name, description, current_status, default_branch, last_run_timestamp, pass_rate, total_runs, last_run_json)
            VALUES (?, 'Monitored GitHub Repository', ?, ?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
              current_status = excluded.current_status,
              last_run_timestamp = excluded.last_run_timestamp,
              pass_rate = excluded.pass_rate,
              total_runs = total_runs + 1,
              last_run_json = excluded.last_run_json`,
      args: [
        normalizedRun.repository,
        normalizedRun.status,
        normalizedRun.branch || 'main',
        normalizedRun.timestamp,
        passRate,
        1,
        lastRunJson
      ]
    });

    let alert = null;
    if (normalizedRun.status === 'failed') {
      alert = {
        id: `alert_${Date.now()}`,
        type: 'build_failure',
        severity: 'critical',
        repository: normalizedRun.repository,
        branch: normalizedRun.branch,
        workflow_name: normalizedRun.workflow_name,
        failed_job: normalizedRun.failed_job || null,
        failed_step: normalizedRun.failed_step || null,
        commit_sha: normalizedRun.commit_sha,
        author: normalizedRun.author,
        clean_error: normalizedRun.clean_error || null,
        run_id: normalizedRun.run_id,
        run_url: normalizedRun.run_url,
        is_read: false,
        timestamp: normalizedRun.timestamp
      };

      await db.execute({
        sql: `INSERT INTO site_alerts (id, type, severity, repository, branch, workflow_name, failed_job, failed_step, commit_sha, author, clean_error, run_id, run_url, is_read, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        args: [
          alert.id, alert.type, alert.severity, alert.repository, alert.branch, alert.workflow_name,
          alert.failed_job, alert.failed_step, alert.commit_sha, alert.author, alert.clean_error,
          alert.run_id, alert.run_url, alert.timestamp
        ]
      });
    } else if (normalizedRun.status === 'passed') {
      alert = {
        id: `alert_${Date.now()}`,
        type: 'build_recovery',
        severity: 'info',
        repository: normalizedRun.repository,
        branch: normalizedRun.branch,
        workflow_name: normalizedRun.workflow_name,
        commit_sha: normalizedRun.commit_sha,
        author: normalizedRun.author,
        run_id: normalizedRun.run_id,
        run_url: normalizedRun.run_url,
        is_read: false,
        timestamp: normalizedRun.timestamp
      };

      await db.execute({
        sql: `INSERT INTO site_alerts (id, type, severity, repository, branch, workflow_name, commit_sha, author, run_id, run_url, is_read, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        args: [
          alert.id, alert.type, alert.severity, alert.repository, alert.branch, alert.workflow_name,
          alert.commit_sha, alert.author, alert.run_id, alert.run_url, alert.timestamp
        ]
      });
    }

    const repos = await this.getRepositories();
    const repoObj = repos.find(r => r.name.toLowerCase() === normalizedRun.repository.toLowerCase());

    return { repo: repoObj, run: normalizedRun, alert };
  }

  async markAlertsAsRead(alertIds = null) {
    await this.init();
    if (!alertIds || alertIds.length === 0) {
      await db.execute('UPDATE site_alerts SET is_read = 1');
    } else {
      for (const id of alertIds) {
        await db.execute({
          sql: 'UPDATE site_alerts SET is_read = 1 WHERE id = ?',
          args: [id]
        });
      }
    }
  }
}

export const store = new TursoStore();
