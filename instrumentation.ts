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

    // Import and initialize the scheduled scrape service (se habilitado)
    const { SCHEDULED_SCRAPES_CONFIG } = await import('@/config/scraping');

    if (SCHEDULED_SCRAPES_CONFIG.enabled) {
      const { initializeScheduler } = await import('@/lib/services/scheduled-scrape-service');

      await initializeScheduler();

      console.log('[Instrumentation] Scheduled scrape service initialized');
    } else {
      console.log('[Instrumentation] Scheduled scrape service disabled');
    }

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

    // Stop scheduler first (stops creating new jobs)
    const { stopScheduler } = await import('@/lib/services/scheduled-scrape-service');

    stopScheduler();

    console.log('[Instrumentation] Scheduled scrape service stopped');

    // Stop orchestrator (finishes running jobs)
    const { stopOrchestrator } = await import('@/lib/services/scrape-orchestrator');

    stopOrchestrator();

    console.log('[Instrumentation] Server services stopped');
  }
}
