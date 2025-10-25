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
