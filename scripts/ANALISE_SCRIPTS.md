# Análise da Pasta de Scripts

Análise realizada em: `$(date)`

## 📊 Resumo Executivo

- **Total de arquivos**: 37
- **Testes temporários (excluir)**: ~20 arquivos
- **Scripts de desenvolvimento (manter)**: ~12 arquivos
- **Scripts problemáticos (revisar)**: ~5 arquivos

---

## ❌ TESTES TEMPORÁRIOS - RECOMENDAÇÃO: EXCLUIR

Estes arquivos são testes manuais ou temporários que não devem fazer parte do repositório permanente. Testes devem estar em uma estrutura de testes adequada (`__tests__`, `tests/`, etc.) ou ser executados via ferramentas de teste.

### Testes Unitários (mover para estrutura de testes adequada)
- `test-hooks.ts` - Testes de custom hooks (usar vitest/jest)
- `test-stores.ts` - Testes de Zustand stores (usar vitest/jest)
- `test-sanitization.ts` - Testes de sanitização (usar vitest/jest)

### Testes E2E/Integração
- `test-e2e-scraping.ts` - Teste E2E manual com Playwright
- `test-all-trts-scraping.ts` - Teste automatizado de scraping em todos TRTs
- `test-all-trts-2g-scraping.ts` - Teste de scraping 2º grau
- `test-scrape-pendentes-trt3.ts` - Teste específico TRT3
- `test-multi-trt.ts` - Teste multi-TRT
- `test-failed-trts.ts` - Teste de TRTs que falharam

### Testes de Performance
- `test-compression-performance.ts` - Benchmark de compressão
- `test-batching.ts` - Teste de batching
- `test-process-cleanup.ts` - Teste de cleanup de processos

### Testes de UI/UX
- `test-responsiveness.ts` - Teste de responsividade
- `test-accessibility.ts` - Teste de acessibilidade

### Testes Diversos
- `test-all-regex.ts` - Teste de regex patterns
- `test-list-tribunais.ts` - Teste de listagem de tribunais
- `test-server-action.mjs` - Teste de Server Actions
- `test-import.mjs` - Teste de importação
- `test-db.mjs` / `test-db.js` - Testes de banco de dados

### Scripts de Debug Temporários
- `get-pedro-credential.ts` - Script específico para debug de credenciais do Pedro

---

## ✅ SCRIPTS DE DESENVOLVIMENTO ÚTEIS - RECOMENDAÇÃO: MANTER

Estes scripts são utilitários reutilizáveis para desenvolvimento, migração de dados e manutenção do sistema.

### Gestão de Credenciais
- ✅ **`import-credentials.ts`** - Importação em massa de credenciais de múltiplos tribunais
  - **Uso**: Popular banco com credenciais de teste/desenvolvimento
  - **Mantém**: Sim - muito útil para setup inicial

- ✅ **`seed-credentials.ts`** - Seed de credenciais no banco
  - **Uso**: Popular banco com dados de credenciais
  - **Mantém**: Sim - útil para desenvolvimento

### Migrações de Dados
- ✅ **`migrate-solo-lawyers-to-firms.ts`** - Migra advogados autônomos para escritórios
  - **Uso**: Migração de dados estrutural
  - **Mantém**: Sim - importante para histórico de migrações

- ✅ **`rollback-solo-lawyers-migration.ts`** - Rollback da migração acima
  - **Uso**: Reverter migração se necessário
  - **Mantém**: Sim - importante ter rollback

### Verificação e Diagnóstico
- ✅ **`check-database.ts`** - Verifica estado do banco de dados
  - **Uso**: Diagnóstico rápido do banco
  - **Mantém**: Sim - muito útil para debug

- ✅ **`check-job-errors.ts`** - Analisa erros de um job específico
  - **Uso**: Debug de jobs que falharam
  - **Mantém**: Sim - útil para diagnóstico

- ✅ **`check-tribunais.ts`** - Verifica configuração de tribunais
  - **Uso**: Validação de configuração
  - **Mantém**: Sim

- ✅ **`check-tribunal-config-schema.ts`** - Valida schema de configuração
  - **Uso**: Validação de schema
  - **Mantém**: Sim

### Análise e Relatórios
- ✅ **`analyze-multi-trt-job.ts`** - Análise detalhada de jobs multi-TRT
  - **Uso**: Gerar relatórios de jobs complexos
  - **Mantém**: Sim - útil para análise

- ✅ **`inv-job.ts`** - Script de investigação de jobs (parece incompleto, mas útil)
  - **Uso**: Debug rápido de jobs
  - **Mantém**: Sim (mas revisar se está completo)

### Validação e Qualidade
- ✅ **`validate-audit-changes.ts`** - Validação de auditorias (Audits 001-006)
  - **Uso**: Executar suite completa de validações
  - **Mantém**: Sim - importante para garantir qualidade

### Utilitários
- ✅ **`clean-next-lock.js`** - Limpa lock do Next.js e libera porta 3000
  - **Uso**: Resolver problemas com dev server travado
  - **Mantém**: Sim - muito útil no dia a dia

---

## ⚠️ SCRIPTS PROBLEMÁTICOS - RECOMENDAÇÃO: REVISAR

Estes scripts têm problemas de segurança, estão incompletos ou são one-off que provavelmente não serão mais usados.

### Segurança
- ⚠️ **`create-database.js`** - Cria banco PostgreSQL
  - **Problema**: Tem credenciais hardcoded no código
  - **Ação**: 
    1. Mover credenciais para variáveis de ambiente
    2. Ou documentar que é apenas para desenvolvimento local
    3. Ou remover se não for mais necessário

### One-off / Migrações Únicas
- ⚠️ **`update-trt-constants.cjs`** - Atualiza constants de TRTs
  - **Problema**: Parece ser uma migração one-off já executada
  - **Ação**: 
    1. Se já foi executada, documentar e arquivar
    2. Ou manter como referência histórica
    3. Verificar se ainda é necessária

### Scripts Incompletos
- ⚠️ **`inv-job.ts`** - Parece ter código incompleto (linha 32 com `prisma.()`)
  - **Ação**: Revisar e completar ou remover

### Loaders/Helpers
- ⚠️ **`ts-loader.mjs`** - Loader para TypeScript
  - **Ação**: Verificar se ainda é necessário ou se há alternativa melhor

---

## 📋 RECOMENDAÇÕES FINAIS

### Ações Imediatas

1. **Excluir testes temporários** (~20 arquivos)
   - Mover testes unitários para estrutura adequada
   - Remover testes E2E manuais
   - Remover scripts de debug específicos

2. **Revisar scripts problemáticos**
   - Corrigir `create-database.js` (remover credenciais hardcoded)
   - Completar ou remover `inv-job.ts`
   - Decidir sobre `update-trt-constants.cjs`

3. **Organizar scripts mantidos**
   - Considerar criar subpastas:
     - `scripts/dev/` - Scripts de desenvolvimento
     - `scripts/db/` - Scripts de banco de dados
     - `scripts/migration/` - Scripts de migração
     - `scripts/utils/` - Utilitários diversos

### Estrutura Sugerida (Opcional)

```
scripts/
├── dev/
│   ├── check-database.ts
│   ├── check-job-errors.ts
│   ├── analyze-multi-trt-job.ts
│   └── clean-next-lock.js
├── db/
│   ├── import-credentials.ts
│   ├── seed-credentials.ts
│   └── check-database.ts
├── migration/
│   ├── migrate-solo-lawyers-to-firms.ts
│   └── rollback-solo-lawyers-migration.ts
└── utils/
    ├── validate-audit-changes.ts
    └── check-tribunais.ts
```

### Arquivos a Manter (Lista Final)

1. ✅ `import-credentials.ts`
2. ✅ `seed-credentials.ts`
3. ✅ `migrate-solo-lawyers-to-firms.ts`
4. ✅ `rollback-solo-lawyers-migration.ts`
5. ✅ `check-database.ts`
6. ✅ `check-job-errors.ts`
7. ✅ `check-tribunais.ts`
8. ✅ `check-tribunal-config-schema.ts`
9. ✅ `analyze-multi-trt-job.ts`
10. ✅ `validate-audit-changes.ts`
11. ✅ `clean-next-lock.js`
12. ⚠️ `inv-job.ts` (revisar e completar)
13. ⚠️ `create-database.js` (remover credenciais hardcoded)
14. ⚠️ `update-trt-constants.cjs` (verificar se ainda necessário)

---

## 📝 Notas

- Scripts de teste devem estar em estrutura de testes adequada ou ser executados via ferramentas de teste
- Scripts one-off executados devem ser documentados ou removidos
- Scripts com credenciais hardcoded são risco de segurança e devem ser corrigidos
- Scripts de migração devem ser mantidos para histórico, mesmo após execução

