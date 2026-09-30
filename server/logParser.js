/**
 * Clean Error Parsing Engine
 * Strips ANSI terminal codes, timestamp headers, and isolates root cause error windows.
 */

export function stripAnsi(text) {
  if (!text) return '';
  return text
    // eslint-disable-next-line no-control-regex
    .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\r\n/g, '\n');
}

export function stripTimestamps(text) {
  if (!text) return '';
  // Removes lines starting with GitHub Actions timestamps like: 2026-09-30T14:00:00.1234567Z
  return text.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s*/gm, '');
}

export const FAILURE_SIGNATURES = [
  { pattern: /##\[error\]/i, label: 'GitHub Runner Error' },
  { pattern: /::error::/i, label: 'Workflow Action Error' },
  { pattern: /FAIL\s+[^\n]+/i, label: 'Test Suite Failure (Jest/Vitest)' },
  { pattern: /AssertionError:/i, label: 'Assertion Failure' },
  { pattern: /Expected:.*Received:/s, label: 'Value Mismatch' },
  { pattern: /FAILED tests\//i, label: 'Pytest Suite Failure' },
  { pattern: /SyntaxError:/i, label: 'Syntax Error' },
  { pattern: /TypeError:/i, label: 'Type Error' },
  { pattern: /TypeScript error in/i, label: 'TypeScript Compilation Error' },
  { pattern: /error TS\d+:/i, label: 'TypeScript Compiler Error' },
  { pattern: /Module not found:/i, label: 'Module Import Failure' },
  { pattern: /Cannot find module/i, label: 'Missing Module' },
  { pattern: /panic:/i, label: 'Go Panic / Runtime Crash' },
  { pattern: /exit status 1/i, label: 'Process Crash' },
  { pattern: /npm ERR!/i, label: 'NPM Package Manager Error' },
  { pattern: /docker build failed/i, label: 'Docker Container Build Failure' },
  { pattern: /FATAL/i, label: 'Fatal System Error' },
  { pattern: /Error:\s+[^\n]+/i, label: 'Runtime Error' }
];

export function extractCleanErrorWindow(rawLogs, contextWindowSize = 25) {
  if (!rawLogs) {
    return {
      cleanError: 'No log output available for this step.',
      matchedPattern: null,
      lineCount: 0,
      totalRawLines: 0
    };
  }

  // 1. Strip ANSI and Timestamps
  const cleanLogs = stripTimestamps(stripAnsi(rawLogs));
  const lines = cleanLogs.split('\n');
  const totalRawLines = lines.length;

  if (totalRawLines === 0) {
    return {
      cleanError: 'Empty log stream.',
      matchedPattern: null,
      lineCount: 0,
      totalRawLines: 0
    };
  }

  // 2. Pattern Match for Root Cause Failure Signatures
  let matchIndex = -1;
  let detectedSignature = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const sig of FAILURE_SIGNATURES) {
      if (sig.pattern.test(line)) {
        matchIndex = i;
        detectedSignature = sig.label;
        break;
      }
    }
    if (matchIndex !== -1) break;
  }

  let extractedLines = [];

  if (matchIndex !== -1) {
    // Take 3 lines before match if available for context, and contextWindowSize lines after match
    const start = Math.max(0, matchIndex - 3);
    const end = Math.min(lines.length, start + contextWindowSize);
    extractedLines = lines.slice(start, end);
  } else {
    // Fallback to the last 20 lines of log output
    const start = Math.max(0, lines.length - 20);
    extractedLines = lines.slice(start);
    detectedSignature = 'End-of-Log Failure (Fallback)';
  }

  return {
    cleanError: extractedLines.join('\n').trim(),
    matchedPattern: detectedSignature,
    lineCount: extractedLines.length,
    totalRawLines
  };
}
