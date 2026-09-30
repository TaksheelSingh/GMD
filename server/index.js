import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { store } from './store.js';
import { verifySignature, normalizeWebhookPayload } from './webhookHandler.js';
import { extractCleanErrorWindow } from './logParser.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Capture raw body for HMAC signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Serve static frontend build files in production (for Render/GitHub deployments)
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(eventType, data) {
  const payload = JSON.stringify({ event: eventType, data });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// WebSocket Connection Handler
wss.on('connection', async (ws) => {
  console.log('[WebSocket] Client connected to live feed');
  
  try {
    const metrics = await store.getMetrics();
    const repositories = await store.getRepositories();
    const recentRuns = await store.getWorkflowRuns();
    const inSiteAlerts = await store.getSiteAlerts();

    ws.send(JSON.stringify({
      event: 'WS_INIT',
      data: {
        metrics,
        repositories,
        recentRuns,
        inSiteAlerts
      }
    }));
  } catch (err) {
    console.error('[WebSocket Init Error]', err);
  }

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });
});

// -------------------------------------------------------------
// 1. GitHub Webhook Ingestion Endpoint
// -------------------------------------------------------------
app.post('/api/webhooks/github', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const githubEvent = req.headers['x-github-event'] || 'workflow_run';

  const isValid = verifySignature(req.rawBody, signature, store.webhookSecret);
  if (!isValid) {
    console.warn('[Webhook] Rejected invalid HMAC signature');
    return res.status(401).json({ error: 'Invalid HMAC Signature' });
  }

  console.log(`[Webhook] Ingested GitHub Event: ${githubEvent}`);

  const normalizedRun = normalizeWebhookPayload(githubEvent, req.body);
  const result = await store.recordWorkflowRun(normalizedRun);
  const updatedMetrics = await store.getMetrics();

  broadcast('WS_NEW_RUN', result.run);
  broadcast('WS_METRICS_UPDATE', updatedMetrics);
  if (result.repo) broadcast('WS_REPO_UPDATE', result.repo);
  if (result.alert) broadcast('WS_SITE_ALERT', result.alert);

  return res.status(200).json({
    message: 'Webhook processed successfully',
    run_id: result.run.run_id,
    status: result.run.status,
    clean_error: result.run.clean_error
  });
});

// -------------------------------------------------------------
// 2. REST API Routes
// -------------------------------------------------------------

app.get('/api/status', async (req, res) => {
  const metrics = await store.getMetrics();
  res.json({
    metrics,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/repos', async (req, res) => {
  const repos = await store.getRepositories();
  res.json(repos);
});

app.get('/api/runs', async (req, res) => {
  const runs = await store.getWorkflowRuns();
  res.json(runs);
});

app.get('/api/runs/:id', async (req, res) => {
  const runs = await store.getWorkflowRuns();
  const run = runs.find(r => r.id === req.params.id || r.run_id === req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }
  res.json(run);
});

app.get('/api/alerts', async (req, res) => {
  const alerts = await store.getSiteAlerts();
  res.json(alerts);
});

app.post('/api/alerts/mark-read', async (req, res) => {
  const { alertIds } = req.body;
  await store.markAlertsAsRead(alertIds);
  const metrics = await store.getMetrics();
  const alerts = await store.getSiteAlerts();
  broadcast('WS_METRICS_UPDATE', metrics);
  broadcast('WS_ALERTS_UPDATED', alerts);
  res.json({ success: true });
});

app.post('/api/simulate', async (req, res) => {
  const { scenario, repository, branch, author } = req.body;
  
  const targetRepo = repository || 'octocat/auth-microservice';
  const targetBranch = branch || 'main';
  const targetAuthor = author || 'dev-octocat';
  const timestamp = new Date().toISOString();
  const runId = String(Math.floor(100000000 + Math.random() * 900000000));

  let mockLogs = '';
  let failedJob = null;
  let failedStep = null;
  let workflowName = 'CI/CD Automated Build & Test';
  let conclusion = 'failure';

  if (scenario === 'jest_failure') {
    workflowName = 'Jest Security & Unit Test Suite';
    failedJob = 'run-unit-tests';
    failedStep = 'Execute Jest Test Suite';
    mockLogs = `2026-09-30T14:10:01.000Z ##[group]Running Jest Test Suite
2026-09-30T14:10:02.100Z PASS src/auth/hash.test.ts
2026-09-30T14:10:03.400Z FAIL src/auth/permission.test.ts (2.1 s)
2026-09-30T14:10:03.401Z   ● checkUserPermissions › should deny admin access to restricted scope
2026-09-30T14:10:03.402Z 
2026-09-30T14:10:03.403Z     AssertionError: expected 'ALLOWED' to equal 'DENIED'
2026-09-30T14:10:03.404Z 
2026-09-30T14:10:03.405Z       28 |     const access = await checkUserPermissions(user, 'RESTRICTED');
2026-09-30T14:10:03.406Z     > 29 |     expect(access).toBe('DENIED');
2026-09-30T14:10:03.407Z          |                    ^
2026-09-30T14:10:03.408Z 
2026-09-30T14:10:04.000Z Test Suites: 1 failed, 1 passed, 2 total
2026-09-30T14:10:04.001Z ##[error]Process completed with exit code 1.`;
  } else if (scenario === 'typescript_error') {
    workflowName = 'Production Typecheck';
    failedJob = 'typecheck';
    failedStep = 'Run tsc --noEmit';
    mockLogs = `2026-09-30T14:10:01.000Z ##[group]Running TypeScript Compiler
2026-09-30T14:10:03.200Z src/services/api.ts(45,12): error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
2026-09-30T14:10:03.201Z src/services/api.ts(88,3): error TS2322: Type 'undefined' is not assignable to type 'UserContext'.
2026-09-30T14:10:03.500Z Found 2 errors in 1 file.
2026-09-30T14:10:03.501Z ##[error]Process completed with exit code 2.`;
  } else if (scenario === 'docker_error') {
    workflowName = 'Docker Container Release';
    failedJob = 'build-image';
    failedStep = 'Run Docker Build & Push';
    mockLogs = `2026-09-30T14:10:01.000Z ##[group]Building Dockerfile target: production
2026-09-30T14:10:05.100Z Step 8/14 : RUN npm run build
2026-09-30T14:10:07.400Z Module not found: Error: Can't resolve './missing-config' in '/app/src'
2026-09-30T14:10:07.401Z npm ERR! code ELIFECYCLE
2026-09-30T14:10:07.402Z npm ERR! errno 1
2026-09-30T14:10:07.403Z FATAL: docker build failed with status 1
2026-09-30T14:10:07.500Z ##[error]Process completed with exit code 1.`;
  } else if (scenario === 'pytest_error') {
    workflowName = 'Python Backend Integration';
    failedJob = 'pytest';
    failedStep = 'Run Pytest Framework';
    mockLogs = `2026-09-30T14:10:01.000Z ##[group]Running Pytest
2026-09-30T14:10:04.100Z FAILED tests/test_payments.py::test_stripe_webhook_idempotency - KeyError: 'event_id'
2026-09-30T14:10:04.101Z AssertionError: Expected HTTP status 200, got 500
2026-09-30T14:10:04.200Z === 1 failed, 24 passed in 3.12s ===
2026-09-30T14:10:04.201Z ##[error]Process completed with exit code 1.`;
  } else {
    workflowName = 'CI/CD Pipeline';
    conclusion = 'success';
    mockLogs = 'All checks passed cleanly!';
  }

  const cleanErrorObj = conclusion === 'failure' ? extractCleanErrorWindow(mockLogs) : null;

  const simulatedRun = {
    id: `run_${runId}_${Date.now()}`,
    run_id: runId,
    repository: targetRepo,
    branch: targetBranch,
    commit_sha: Math.random().toString(36).substring(2, 9),
    author: targetAuthor,
    workflow_name: workflowName,
    status: conclusion === 'success' ? 'passed' : 'failed',
    conclusion,
    run_url: `https://github.com/${targetRepo}/actions/runs/${runId}`,
    failed_job: failedJob,
    failed_step: failedStep,
    raw_logs: mockLogs,
    clean_error: cleanErrorObj ? cleanErrorObj.cleanError : null,
    matched_pattern: cleanErrorObj ? cleanErrorObj.matchedPattern : null,
    timestamp,
    duration_seconds: Math.floor(Math.random() * 120) + 30
  };

  const result = await store.recordWorkflowRun(simulatedRun);
  const updatedMetrics = await store.getMetrics();

  broadcast('WS_NEW_RUN', result.run);
  broadcast('WS_METRICS_UPDATE', updatedMetrics);
  if (result.repo) broadcast('WS_REPO_UPDATE', result.repo);
  if (result.alert) broadcast('WS_SITE_ALERT', result.alert);

  res.json({
    message: 'Simulation executed successfully',
    run: result.run,
    alert: result.alert
  });
});

app.post('/api/settings', (req, res) => {
  const { webhookSecret, githubPat } = req.body;
  if (webhookSecret !== undefined) store.webhookSecret = webhookSecret;
  if (githubPat !== undefined) store.githubPat = githubPat;
  res.json({ message: 'Settings saved successfully' });
});

// SPA Fallback for production build serving
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
server.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`⚡ GMD GitHub Observability Server running on port ${PORT}`);
  console.log(`  - Webhook Endpoint: http://localhost:${PORT}/api/webhooks/github`);
  console.log(`  - WebSocket Transport: ws://localhost:${PORT}/ws`);
  console.log(`====================================================`);
  await store.init();
});
