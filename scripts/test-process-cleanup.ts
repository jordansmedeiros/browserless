import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync, spawn } from 'child_process';
import { tmpdir } from 'os';

const IS_WINDOWS = process.platform === 'win32';

// Test scripts
const SCRIPT_SUCCESS = `
console.log(JSON.stringify({ success: true, message: "Test completed" }));
process.exit(0);
`;

const SCRIPT_TIMEOUT = `
console.log("Starting infinite loop...");
setInterval(() => {
  console.log("Still running...");
}, 1000);
`;

const SCRIPT_ERROR = `
console.error("Simulated error");
throw new Error("Test error");
`;

const SCRIPT_IGNORE_SIGTERM = `
process.on('SIGTERM', () => {
  console.log("Ignoring SIGTERM...");
});
console.log("Started - ignoring SIGTERM");
setInterval(() => {
  console.log("Still alive...");
}, 500);
`;

function createTestScript(name: string, content: string): string {
  const path = join(tmpdir(), name);
  writeFileSync(path, content, 'utf-8');
  return path;
}

function deleteTestScript(path: string) {
  if (existsSync(path)) {
    unlinkSync(path);
  }
}

function isProcessRunning(pid: number): boolean {
  try {
    if (IS_WINDOWS) {
      const result = execSync(`tasklist /FI "PID eq ${pid}" /FO LIST`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return result.includes(`PID: ${pid}`);
    } else {
      execSync(`ps -p ${pid}`, { stdio: ['pipe', 'pipe', 'pipe'] });
      return true;
    }
  } catch {
    return false;
  }
}

function killProcess(pid: number, signal: 'SIGTERM' | 'SIGKILL' = 'SIGTERM') {
  try {
    if (IS_WINDOWS) {
      execSync(`taskkill ${signal === 'SIGKILL' ? '/F' : ''} /PID ${pid}`, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } else {
      process.kill(pid, signal);
    }
    return true;
  } catch {
    return false;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testCleanupOnSuccess(): Promise<boolean> {
  console.log('\n--- Test 1: Cleanup on Success ---');

  const scriptPath = createTestScript('test-script-success.js', SCRIPT_SUCCESS);

  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath], { stdio: 'pipe' });
    const pid = child.pid!;

    console.log(`Started process ${pid}`);

    child.on('exit', async (code) => {
      console.log(`Process exited with code ${code}`);

      // Wait a bit for OS cleanup
      await wait(500);

      const isRunning = isProcessRunning(pid);
      console.log(`Process still running: ${isRunning ? '❌' : '✅'}`);

      deleteTestScript(scriptPath);
      resolve(!isRunning);
    });
  });
}

async function testCleanupOnTimeout(): Promise<boolean> {
  console.log('\n--- Test 2: Cleanup on Timeout ---');

  const scriptPath = createTestScript('test-script-timeout.js', SCRIPT_TIMEOUT);

  return new Promise(async (resolve) => {
    const child = spawn('node', [scriptPath], { stdio: 'pipe' });
    const pid = child.pid!;

    console.log(`Started process ${pid}`);

    // Simulate timeout by killing after 2s
    await wait(2000);

    console.log('Simulating timeout - sending SIGTERM...');
    killProcess(pid, 'SIGTERM');

    await wait(500);
    let isRunning = isProcessRunning(pid);
    console.log(`After SIGTERM: ${isRunning ? 'still running' : 'terminated'}`);

    if (isRunning) {
      console.log('Escalating to SIGKILL...');
      await wait(2000); // Wait for escalation timeout
      killProcess(pid, 'SIGKILL');
      await wait(500);
      isRunning = isProcessRunning(pid);
      console.log(`After SIGKILL: ${isRunning ? '❌' : '✅'}`);
    }

    deleteTestScript(scriptPath);
    resolve(!isRunning);
  });
}

async function testCleanupOnError(): Promise<boolean> {
  console.log('\n--- Test 3: Cleanup on Error ---');

  const scriptPath = createTestScript('test-script-error.js', SCRIPT_ERROR);

  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath], { stdio: 'pipe' });
    const pid = child.pid!;

    console.log(`Started process ${pid}`);

    child.on('exit', async (code) => {
      console.log(`Process exited with code ${code}`);

      await wait(500);
      const isRunning = isProcessRunning(pid);
      console.log(`Process still running: ${isRunning ? '❌' : '✅'}`);

      deleteTestScript(scriptPath);
      resolve(!isRunning);
    });
  });
}

async function testParallelCleanup(): Promise<boolean> {
  console.log('\n--- Test 4: Parallel Process Cleanup ---');

  const scripts = [
    createTestScript('test-parallel-1.js', SCRIPT_SUCCESS),
    createTestScript('test-parallel-2.js', SCRIPT_TIMEOUT),
    createTestScript('test-parallel-3.js', SCRIPT_ERROR),
  ];

  const children = scripts.map((script) => {
    const child = spawn('node', [script], { stdio: 'pipe' });
    return { child, pid: child.pid!, script };
  });

  console.log(`Started ${children.length} processes: ${children.map((c) => c.pid).join(', ')}`);

  // Wait for natural exits and force kill timeouts
  await wait(1000);

  console.log('Cleaning up all processes...');
  children.forEach(({ pid }) => {
    if (isProcessRunning(pid)) {
      killProcess(pid, 'SIGKILL');
    }
  });

  await wait(500);

  let allCleaned = true;
  children.forEach(({ pid, script }) => {
    const isRunning = isProcessRunning(pid);
    console.log(`Process ${pid}: ${isRunning ? '❌ still running' : '✅ cleaned'}`);
    if (isRunning) allCleaned = false;
    deleteTestScript(script);
  });

  return allCleaned;
}

async function testSIGKILLEscalation(): Promise<boolean> {
  console.log('\n--- Test 5: SIGKILL Escalation ---');

  const scriptPath = createTestScript('test-ignore-sigterm.js', SCRIPT_IGNORE_SIGTERM);

  return new Promise(async (resolve) => {
    const child = spawn('node', [scriptPath], { stdio: 'pipe' });
    const pid = child.pid!;

    console.log(`Started process ${pid} (ignores SIGTERM)`);

    await wait(1000);

    console.log('Sending SIGTERM (will be ignored)...');
    killProcess(pid, 'SIGTERM');

    await wait(1000);
    let isRunning = isProcessRunning(pid);
    console.log(`After SIGTERM: ${isRunning ? 'still running (expected)' : 'terminated'}`);

    if (!isRunning) {
      console.log('⚠️  Process terminated on SIGTERM (unexpected)');
      deleteTestScript(scriptPath);
      resolve(false);
      return;
    }

    console.log('Waiting 2s for escalation timeout...');
    await wait(2000);

    console.log('Escalating to SIGKILL...');
    killProcess(pid, 'SIGKILL');

    await wait(500);
    isRunning = isProcessRunning(pid);
    console.log(`After SIGKILL: ${isRunning ? '❌' : '✅'}`);

    deleteTestScript(scriptPath);
    resolve(!isRunning);
  });
}

async function main() {
  console.log('=================================================');
  console.log('Process Cleanup Test');
  console.log('=================================================');
  console.log(`Platform: ${process.platform}`);

  const results = {
    success: false,
    timeout: false,
    error: false,
    parallel: false,
    escalation: false,
  };

  try {
    results.success = await testCleanupOnSuccess();
    results.timeout = await testCleanupOnTimeout();
    results.error = await testCleanupOnError();
    results.parallel = await testParallelCleanup();
    results.escalation = await testSIGKILLEscalation();

    // Summary
    console.log('\n=================================================');
    console.log('Summary');
    console.log('=================================================\n');
    console.log(`Cleanup on success:       ${results.success ? '✅' : '❌'}`);
    console.log(`Cleanup on timeout:       ${results.timeout ? '✅' : '❌'}`);
    console.log(`Cleanup on error:         ${results.error ? '✅' : '❌'}`);
    console.log(`Parallel cleanup:         ${results.parallel ? '✅' : '❌'}`);
    console.log(`SIGKILL escalation:       ${results.escalation ? '✅' : '❌'}`);

    const allPassed = Object.values(results).every((r) => r);

    if (allPassed) {
      console.log('\n=================================================');
      console.log('All process cleanup tests PASSED ✅');
      console.log('=================================================\n');
      process.exit(0);
    } else {
      console.log('\n=================================================');
      console.log('Some tests FAILED ❌');
      console.log('=================================================\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
