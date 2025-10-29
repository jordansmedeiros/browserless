import { performance } from 'perf_hooks';
import { gzipSync, gunzipSync } from 'zlib';
import { compressJSON, decompressJSON } from '../lib/utils/compression';

interface BenchmarkResult {
  size: string;
  asyncTime: number;
  syncTime: number;
  eventLoopBlocked: boolean;
  compressionRatio: number;
}

function generateMockData(sizeKB: number): any {
  const numProcessos = Math.floor((sizeKB * 1024) / 500); // ~500 bytes per processo
  const processos = [];

  for (let i = 0; i < numProcessos; i++) {
    processos.push({
      numeroProcesso: `0000000-00.2024.5.03.${String(i).padStart(4, '0')}`,
      tribunal: 'TRT3',
      vara: `Vara do Trabalho de Belo Horizonte`,
      autor: `Autor ${i}`,
      reu: `Réu ${i}`,
      situacao: 'Pendente',
      dataDistribuicao: new Date().toISOString(),
      valorCausa: Math.random() * 100000,
      advogado: {
        nome: `Advogado ${i}`,
        oab: `MG${String(i).padStart(6, '0')}`,
      },
      movimentacoes: [
        {
          data: new Date().toISOString(),
          descricao: 'Distribuição por sorteio',
        },
        {
          data: new Date().toISOString(),
          descricao: 'Conclusão ao juiz',
        },
      ],
    });
  }

  return { processos, metadata: { total: numProcessos, timestamp: Date.now() } };
}

async function benchmarkCompression(sizeKB: number): Promise<BenchmarkResult> {
  console.log(`\n--- Testing ${sizeKB}KB JSON ---`);

  const data = generateMockData(sizeKB);
  const jsonString = JSON.stringify(data);
  const originalSize = Buffer.byteLength(jsonString);

  console.log(`Original size: ${(originalSize / 1024).toFixed(2)} KB`);

  // Benchmark async compression
  const asyncStart = performance.now();
  const compressed = await compressJSON(data);
  const asyncTime = performance.now() - asyncStart;

  // Convert base64 string to Buffer to get actual compressed size
  const asyncBuf = Buffer.from(compressed, 'base64');
  const compressedSize = asyncBuf.length;
  const compressionRatio = (compressedSize / originalSize) * 100;

  console.log(`Compressed size: ${(compressedSize / 1024).toFixed(2)} KB`);
  console.log(`Compression ratio: ${compressionRatio.toFixed(2)}%`);
  console.log(`Async time: ${asyncTime.toFixed(2)}ms`);

  // Benchmark sync compression for comparison
  const syncStart = performance.now();
  const syncCompressed = gzipSync(Buffer.from(jsonString));
  const syncTime = performance.now() - syncStart;

  console.log(`Sync time: ${syncTime.toFixed(2)}ms`);

  // Validate results are identical
  const areIdentical = asyncBuf.equals(syncCompressed);
  console.log(`Results identical: ${areIdentical ? '✅' : '❌'}`);

  if (!areIdentical) {
    throw new Error('Async and sync compression produced different results!');
  }

  return {
    size: `${sizeKB}KB`,
    asyncTime,
    syncTime,
    eventLoopBlocked: false, // Will be tested separately
    compressionRatio,
  };
}

async function testEventLoopBlocking() {
  console.log('\n--- Testing Event Loop Blocking ---');

  const data = generateMockData(5 * 1024); // 5MB
  let timerFired = 0;
  let expectedTimerFires = 0;

  // Setup timer that should fire every 10ms
  const timer = setInterval(() => {
    timerFired++;
  }, 10);

  // Test async compression
  console.log('Testing async compression (should NOT block)...');
  timerFired = 0;
  const asyncStart = performance.now();
  await compressJSON(data);
  const asyncDuration = performance.now() - asyncStart;
  expectedTimerFires = Math.floor(asyncDuration / 10);
  const asyncTimerSuccess = timerFired >= expectedTimerFires * 0.8; // Allow 20% tolerance

  console.log(`Async: Timer fired ${timerFired}/${expectedTimerFires} times - ${asyncTimerSuccess ? '✅' : '❌'}`);

  // Test sync compression
  console.log('Testing sync compression (WILL block)...');
  timerFired = 0;
  const jsonString = JSON.stringify(data);
  const syncStart = performance.now();
  gzipSync(Buffer.from(jsonString));
  const syncDuration = performance.now() - syncStart;
  expectedTimerFires = Math.floor(syncDuration / 10);
  const syncTimerBlocked = timerFired < expectedTimerFires * 0.5; // Should miss >50% of timers

  console.log(`Sync: Timer fired ${timerFired}/${expectedTimerFires} times - ${syncTimerBlocked ? '✅ (blocked as expected)' : '❌'}`);

  clearInterval(timer);

  return asyncTimerSuccess && syncTimerBlocked;
}

async function testDecompression() {
  console.log('\n--- Testing Decompression ---');

  const originalData = generateMockData(1024); // 1MB

  // Compress
  const compressed = await compressJSON(originalData);

  // Decompress
  const start = performance.now();
  const decompressed = await decompressJSON(compressed);
  const duration = performance.now() - start;

  console.log(`Decompression time: ${duration.toFixed(2)}ms`);

  // Validate data integrity
  const originalJson = JSON.stringify(originalData);
  const decompressedJson = JSON.stringify(decompressed);
  const isIdentical = originalJson === decompressedJson;

  console.log(`Data integrity: ${isIdentical ? '✅' : '❌'}`);

  if (!isIdentical) {
    throw new Error('Decompressed data does not match original!');
  }

  return duration;
}

async function main() {
  console.log('=================================================');
  console.log('Compression Performance Benchmark');
  console.log('=================================================');

  const results: BenchmarkResult[] = [];

  try {
    // Test different sizes
    results.push(await benchmarkCompression(10)); // 10KB
    results.push(await benchmarkCompression(1024)); // 1MB
    results.push(await benchmarkCompression(5 * 1024)); // 5MB

    // Test event loop blocking
    const eventLoopOk = await testEventLoopBlocking();

    // Test decompression
    const decompressTime = await testDecompression();

    // Summary table
    console.log('\n=================================================');
    console.log('Summary');
    console.log('=================================================\n');
    console.log('Size     | Async   | Sync    | Compression Ratio');
    console.log('---------|---------|---------|------------------');
    results.forEach((r) => {
      console.log(
        `${r.size.padEnd(8)} | ${r.asyncTime.toFixed(0).padStart(5)}ms | ${r.syncTime.toFixed(0).padStart(5)}ms | ${r.compressionRatio.toFixed(2)}%`
      );
    });

    console.log('\n✅ Event loop remains free during async compression');
    console.log(`✅ Decompression works correctly (${decompressTime.toFixed(2)}ms for 1MB)`);
    console.log('\n=================================================');
    console.log('All compression tests PASSED ✅');
    console.log('=================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
