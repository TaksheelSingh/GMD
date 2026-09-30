# GitHub CI/CD Observability & Alert Dashboard

## 1. Project Overview
A real-time, passive monitoring system and alerting dashboard for GitHub repositories and organizations. The system consumes incoming GitHub Actions webhook events, detects workflow build failures, pulls read-only raw logs via the GitHub REST API to isolate the root cause, formats a clean, actionable error summary, and broadcasts the status to a live dashboard and external notification channels (Slack, Discord, Telegram).

This system operates strictly in **read-only / monitoring mode**—it does not trigger builds, re-run actions, or dispatch commands back to GitHub.

---

## 2. Architecture & Data Flow

```
                      +-----------------------------+
                      |   GitHub Repos / Org Webhook|
                      |   (workflow_run: completed) |
                      +--------------+--------------+
                                     |
                                     v
                 +---------------------------------------+
                 |       Webhook Ingestion Layer         |
                 | - Validates HMAC Signature            |
                 | - Extracts: Repo, Branch, Commit,     |
                 |   Workflow Name, Run ID, Conclusion   |
                 +-------------------+-------------------+
                                     |
                     +---------------+---------------+
                     |                               |
          [Conclusion == "success"]       [Conclusion == "failure"]
                     |                               |
                     v                               v
             Record "Healthy"            +-----------------------+
                     |                   | Failed Job Resolver   |
                     |                   | GET /runs/{id}/jobs   |
                     |                   | (Finds failed step)   |
                     |                   +-----------+-----------+
                     |                               |
                     |                               v
                     |                   +-----------------------+
                     |                   | Raw Log Fetcher       |
                     |                   | GET /jobs/{id}/logs   |
                     |                   +-----------+-----------+
                     |                               |
                     |                               v
                     |                   +-----------------------+
                     |                   | Clean Log Extractor   |
                     |                   | - Strips ANSI codes   |
                     |                   | - Trims timestamps    |
                     |                   | - Extracts 10-25 line |
                     |                   |   root error window   |
                     |                   +-----------+-----------+
                     |                               |
                     +---------------+---------------+
                                     |
                                     v
                       +---------------------------+
                       |    Persistent Store       |
                       | (Redis / SQLite / Postgres)
                       +-------------+-------------+
                                     |
                     +---------------+---------------+
                     |                               |
                     v                               v
         +-----------------------+       +-----------------------+
         | Real-Time Dashboard   |       | Notification Engine   |
         | (SSE / WebSocket)     |       | (Slack/Discord Webhook|
         | - Status Feed         |       | - Direct Ping with    |
         | - Error Modal Drawer  |       |   Repo + Clean Error  |
         +-----------------------+       +-----------------------+
```

---

## 3. Tech Stack

| Component | Selected Technology | Purpose |
| :--- | :--- | :--- |
| **Ingestion Engine** | Node.js (Fastify/Express) or Python (FastAPI) | Lightweight, non-blocking webhook processing. |
| **GitHub Integration** | `@octokit/rest` or PyGithub | Read-only API calls to fetch job status and step logs. |
| **State Store** | SQLite / Redis | Stores latest build status per repo and recent failure history. |
| **Real-Time Transport**| Server-Sent Events (SSE) or WebSockets | Pushes instant status updates to the monitoring UI. |
| **Dashboard UI** | Next.js / Vite + React + Tailwind CSS | Minimalist, read-only dark-themed operational monitor. |
| **Notifications** | HTTP Webhooks (Slack Incoming Webhook, Discord Bot, Telegram) | Instant alert dispatch when a build transitions or fails. |

---

## 4. GitHub Configuration

### 4.1. Webhook Setup
* **Target:** GitHub Organization Settings or Individual Repository Settings $\rightarrow$ **Webhooks** $\rightarrow$ **Add webhook**.
* **Payload URL:** `https://your-server-domain.com/api/webhooks/github`
* **Content type:** `application/json`
* **Secret:** A secure shared secret string used to verify `X-Hub-Signature-256`.
* **Events to Subscribe:**
  * `Workflow runs` (Triggers on workflow completion)

### 4.2. GitHub Permissions (Read-Only)
Only a read-only GitHub Personal Access Token (PAT) or GitHub App is needed:
* `actions:read` — View workflow run steps and download step logs.
* `contents:read` — Read commit metadata and repository details.

---

## 5. Clean Error Parsing Logic

Raw CI/CD logs typically span thousands of lines containing environment setup, package installations, and runner teardown. The extractor targets only the actionable failure lines.

### Extraction Pipeline:
1. **Identify the Broken Step:**
   Call `GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs`. Iterate through the returned jobs and find the job where `conclusion === "failure"`. Within that job, locate the step where `step.conclusion === "failure"`.
2. **Fetch Logs:**
   Call `GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs` to stream the plain-text output.
3. **Clean Terminal Noise:**
   * Remove ANSI color/style escape codes: `/\x1B\[[0-?]*[ -/]*[@-~]/g`
   * Strip runner timestamp headers: `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s*/gm`
4. **Pattern Match for Failure Signatures:**
   Search for lines starting with or containing:
   * GitHub error markers: `##[error]`, `::error::`
   * Test runner failures: `FAIL `, `AssertionError:`, `Expected:`, `Received:`, `FAILED tests/`
   * Build & syntax errors: `SyntaxError:`, `TypeScript error`, `Module not found:`, `Cannot find module`
   * Generic fatal markers: `FATAL`, `Error:`, `panic:`, `exit status 1`
5. **Output Windowing:**
   Extract a window of 10 to 20 lines starting from the first matched failure signature, or the last 20 lines of the step log if no specific signature is detected.

---

## 6. Notification Payload Schema

When a build fails, the dispatcher transmits a structured message directly to your alert channel:

### Normalized Data Model:
```json
{
  "repository": "org-name/repo-name",
  "branch": "main",
  "commit_sha": "7e3b9a1",
  "author": "octocat",
  "workflow_name": "Test & Deploy",
  "status": "failure",
  "run_url": "https://github.com/org-name/repo-name/actions/runs/987654321",
  "failed_job": "run-unit-tests",
  "failed_step": "Execute Jest Suite",
  "clean_error": "FAIL src/auth/token.test.ts\n  ● verifyToken › should reject expired tokens\n    AssertionError: expected 'VALID' to equal 'EXPIRED'\n      at src/auth/token.test.ts:45:12",
  "timestamp": "2026-09-30T14:00:00Z"
}
```

### Discord / Slack Alert Layout:
* **Header:** 🔴 **Build Broken:** `{repository}` on branch `{branch}`
* **Workflow:** `{workflow_name}` (Step: `{failed_step}`)
* **Commit:** `{commit_sha}` by `@{author}`
* **Error Trace:** Code-formatted snippet containing `clean_error`
* **Direct Action Link:** Direct URL link to the GitHub Actions run

---

## 7. Dashboard Interface Specification

The dashboard operates as a persistent, real-time read-only monitoring wall:

### Core Visual Components:
1. **Org Status Overview Bar:**
   * Total Monitored Repositories
   * Pass/Fail percentage ratio
   * Real-time SSE connection indicator
2. **Repository Status Grid / Feed:**
   * Repository Name & Org Badge
   * Default branch current health status (`PASSED` / `FAILED`)
   * Duration and relative completion timestamp (e.g., "3m ago")
3. **Error Inspector Drawer / Modal:**
   * Clicking a failed repository card opens a monospace view of the parsed error snippet without redirecting to GitHub.
   * Direct "View on GitHub" external link for deep log inspection if required.

---

## 8. Implementation Milestones

- [ ] **Milestone 1:** Implement webhook endpoint with GitHub HMAC SHA-256 signature verification.
- [ ] **Milestone 2:** Implement Octokit log fetcher and the ANSI/regex clean error parser.
- [ ] **Milestone 3:** Configure outbound webhook notifications for Discord/Slack.
- [ ] **Milestone 4:** Set up SQLite/Redis storage for tracking the latest state per repo.
- [ ] **Milestone 5:** Build read-only frontend dashboard with SSE/WebSocket live feed.