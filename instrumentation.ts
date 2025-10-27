/**
 * Server Instrumentation
 * Runs once when the Next.js server starts
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Initializing server services...');

    // Import and initialize the scraping orchestrator
    const { initializeOrchestrator } = await import('@/lib/services/scrape-orchestrator');

    initializeOrchestrator();

    console.log('[Instrumentation] Server services initialized');
  }
}

/**
 * Server cleanup
 * Runs when the Next.js server is shutting down
 */
export async function unregister() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Shutting down server services...');

    const { stopOrchestrator } = await import('@/lib/services/scrape-orchestrator');

    stopOrchestrator();

    console.log('[Instrumentation] Server services stopped');
  }
}
