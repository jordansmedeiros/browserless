/**
 * Script para atualizar constants de TRTs adicionando campo sistema
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/constants/tribunais.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Atualizar padrão: id: 'TRTN-Xg' para id: 'TRTN-PJE-Xg'
for (let i = 1; i <= 24; i++) {
  // Atualizar IDs
  content = content.replace(new RegExp(`id: 'TRT${i}-1g'`, 'g'), `id: 'TRT${i}-PJE-1g'`);
  content = content.replace(new RegExp(`id: 'TRT${i}-2g'`, 'g'), `id: 'TRT${i}-PJE-2g'`);

  // Adicionar campo sistema após codigo (se ainda não existe)
  // Padrão: codigo: 'TRTN',\n    grau:
  content = content.replace(
    new RegExp(`(codigo: 'TRT${i}',)\\s*\\n(\\s*grau:)`, 'g'),
    `$1\n    sistema: 'PJE',\n$2`
  );
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Arquivo atualizado com sucesso!');
console.log('   - Todos os IDs foram atualizados para incluir -PJE-');
console.log('   - Campo sistema adicionado a todos os TRTs');
