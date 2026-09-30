export type BuildStatus = 'passed' | 'failed' | 'in_progress';

export interface Repository {
  id: string;
  name: string;
  description: string;
  current_status: BuildStatus;
  default_branch: string;
  last_run_timestamp: string;
  pass_rate: number;
  total_runs: number;
  last_run?: {
    id: string;
    workflow_name: string;
    author: string;
    commit_sha: string;
    commit_message?: string;
    failed_job?: string | null;
    failed_step?: string | null;
    duration_seconds: number;
  };
}

export interface WorkflowRun {
  id: string;
  run_id: string;
  repository: string;
  branch: string;
  commit_sha: string;
  author: string;
  workflow_name: string;
  status: BuildStatus;
  conclusion: 'success' | 'failure' | 'in_progress' | 'cancelled';
  run_url: string;
  failed_job: string | null;
  failed_step: string | null;
  raw_logs: string | null;
  clean_error: string | null;
  matched_pattern?: string | null;
  timestamp: string;
  duration_seconds: number;
}

export interface SiteAlert {
  id: string;
  type: 'build_failure' | 'build_recovery' | 'system_warning';
  severity: 'critical' | 'warning' | 'info';
  repository: string;
  branch: string;
  workflow_name: string;
  failed_job?: string | null;
  failed_step?: string | null;
  commit_sha?: string;
  author?: string;
  clean_error?: string | null;
  run_id: string;
  run_url: string;
  is_read: boolean;
  timestamp: string;
}

export interface MetricsSummary {
  totalRepos: number;
  passedRepos: number;
  failedRepos: number;
  healthPercentage: number;
  totalRuns: number;
  unreadAlertsCount: number;
  mttrMinutes: number;
}
