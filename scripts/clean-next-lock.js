/**
 * Script para limpar lock do Next.js e liberar porta 3000
 *
 * Este script resolve problemas comuns com o Next.js dev server:
 * - Remove o arquivo de lock (.next/dev/lock)
 * - Mata processos que estão usando a porta 3000
 *
 * USO:
 * npm run clean:next
 *
 * OU diretamente:
 * node scripts/clean-next-lock.js
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const LOCK_FILE = '.next/dev/lock';
const PORT = 3000;

/**
 * Remove o arquivo de lock do Next.js
 */
function removeLockFile() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
      console.log('✅ Lock file removido:', LOCK_FILE);
      return true;
    } else {
      console.log('ℹ️  Lock file não existe:', LOCK_FILE);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao remover lock file:', error.message);
    return false;
  }
}

/**
 * Encontra e mata processos usando a porta especificada (Windows)
 */
async function killProcessOnPortWindows(port) {
  try {
    // Encontra o PID do processo usando a porta
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`, {
      windowsHide: true,
    });

    if (!stdout.trim()) {
      console.log(`ℹ️  Nenhum processo usando a porta ${port}`);
      return false;
    }

    // Extrai PIDs únicos da saída do netstat
    const lines = stdout.split('\n');
    const pids = new Set();

    for (const line of lines) {
      const match = line.trim().match(/LISTENING\s+(\d+)/);
      if (match) {
        pids.add(match[1]);
      }
    }

    if (pids.size === 0) {
      console.log(`ℹ️  Nenhum processo LISTENING na porta ${port}`);
      return false;
    }

    // Mata cada processo encontrado
    for (const pid of pids) {
      try {
        await execAsync(`taskkill /F /PID ${pid}`, { windowsHide: true });
        console.log(`✅ Processo ${pid} finalizado (porta ${port})`);
      } catch (error) {
        console.error(`❌ Erro ao finalizar processo ${pid}:`, error.message);
      }
    }

    return true;
  } catch (error) {
    // findstr retorna exit code 1 quando não encontra nada
    if (error.code === 1 || error.stderr === '') {
      console.log(`ℹ️  Nenhum processo usando a porta ${port}`);
      return false;
    }
    console.error('❌ Erro ao verificar porta:', error.message);
    return false;
  }
}

/**
 * Encontra e mata processos usando a porta especificada (Unix/Linux/Mac)
 */
async function killProcessOnPortUnix(port) {
  try {
    // Tenta usar lsof para encontrar o processo
    const { stdout } = await execAsync(`lsof -ti:${port}`);

    if (!stdout.trim()) {
      console.log(`ℹ️  Nenhum processo usando a porta ${port}`);
      return false;
    }

    const pids = stdout.trim().split('\n');

    for (const pid of pids) {
      try {
        await execAsync(`kill -9 ${pid}`);
        console.log(`✅ Processo ${pid} finalizado (porta ${port})`);
      } catch (error) {
        console.error(`❌ Erro ao finalizar processo ${pid}:`, error.message);
      }
    }

    return true;
  } catch (error) {
    if (error.code === 1) {
      // lsof retorna código 1 quando não encontra nada
      console.log(`ℹ️  Nenhum processo usando a porta ${port}`);
      return false;
    }
    console.error('❌ Erro ao verificar porta:', error.message);
    return false;
  }
}

/**
 * Mata processos na porta especificada (detecta plataforma automaticamente)
 */
async function killProcessOnPort(port) {
  const isWindows = process.platform === 'win32';

  if (isWindows) {
    return await killProcessOnPortWindows(port);
  } else {
    return await killProcessOnPortUnix(port);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          LIMPEZA DE LOCK DO NEXT.JS                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`🔍 Plataforma: ${process.platform}`);
  console.log(`📂 Diretório: ${process.cwd()}\n`);

  // Remove lock file
  console.log('1️⃣  Removendo lock file...');
  removeLockFile();

  console.log('\n2️⃣  Verificando porta 3000...');
  await killProcessOnPort(PORT);

  console.log('\n✅ Limpeza concluída!\n');
  console.log('🚀 Você pode executar "npm run dev" agora\n');
}

// Executa
main().catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
