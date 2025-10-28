# Arquitetura Multi-Grau (1º e 2º Grau)

## Visão Geral

O sistema de raspagem do PJE suporta **automaticamente** primeiro e segundo grau para todos os TRTs. Os scripts de raspagem são **genéricos** e funcionam para ambos os graus sem necessidade de alterações.

## Como Funciona

### 1. Seleção no Front-end

**Componente**: [`components/pje/tribunal-selector.tsx`](../components/pje/tribunal-selector.tsx)

```tsx
// Linhas 276-288
<div className="flex items-center gap-4 ml-auto">
  {grupo.configs.map((config) => (
    <div key={config.id} className="flex items-center gap-2">
      <Checkbox
        id={`tc-${config.id}`}
        checked={selectedIds.includes(config.id)}
        onCheckedChange={() => handleToggleGrau(config.id)}
      />
      <label htmlFor={`tc-${config.id}`}>
        {config.grau === '1g' ? '1º Grau' : '2º Grau'}
      </label>
    </div>
  ))}
</div>
```

**Comportamento**:
- Cada TRT tem 2 checkboxes: "1º Grau" e "2º Grau"
- Usuário pode selecionar um ou ambos
- IDs enviados no formato: `"TRT3-1g"`, `"TRT3-2g"`

### 2. Processamento no Backend

**Action**: [`app/actions/pje.ts`](../app/actions/pje.ts)

```typescript
// Linhas 1136-1141
const tribunalQueries = tribunalConfigIds.map(id => {
  const [codigo, grau] = id.split('-');
  if (!codigo || !grau) {
    throw new Error(`ID de tribunal inválido: ${id}`);
  }
  return { codigo, grau, originalId: id };
});
```

**Comportamento**:
- Parseia IDs: `"TRT3-1g"` → `{ codigo: "TRT3", grau: "1g" }`
- Busca `TribunalConfig` no banco usando código + grau
- Cria job com UUIDs corretos do banco

### 3. Configuração no Banco de Dados

**Seed**: [`prisma/seeds/tribunal-configs.ts`](../prisma/seeds/tribunal-configs.ts)

```typescript
// Linhas 22-29
export function generatePJEUrl(
  trtNum: number,
  grau: Grau,
  path: string = ''
): string {
  const grauPath = grau === '1g' ? 'primeirograu' : 'segundograu';
  return `https://pje.trt${trtNum}.jus.br/${grauPath}${path}`;
}
```

**Estrutura do Banco**:
- 48 configurações: 24 TRTs × 2 graus
- Cada config tem URLs específicas:

| Campo | Exemplo 1º Grau | Exemplo 2º Grau |
|-------|----------------|-----------------|
| `urlBase` | `https://pje.trt3.jus.br` | `https://pje.trt3.jus.br` |
| `urlLoginSeam` | `https://pje.trt3.jus.br/primeirograu/login.seam` | `https://pje.trt3.jus.br/segundograu/login.seam` |
| `urlApi` | `https://pje.trt3.jus.br/pje-comum-api/api` | `https://pje.trt3.jus.br/pje-comum-api/api` |

### 4. Orquestração da Execução

**Orchestrator**: [`lib/services/scrape-orchestrator.ts`](../lib/services/scrape-orchestrator.ts)

```typescript
// Linhas 308-313
const tribunalConfigForScraping: TribunalConfigParaRaspagem = {
  urlBase: tribunalConfig.urlBase,
  urlLoginSeam: tribunalConfig.urlLoginSeam,
  urlApi: tribunalConfig.urlApi,
  codigo: tribunalCodigo, // "TRT3-1g" ou "TRT3-2g"
};
```

**Comportamento**:
- Busca `TribunalConfig` do banco (que já tem grau)
- Passa URLs completas com grau embutido para o executor

### 5. Execução do Script

**Executor**: [`lib/services/scrape-executor.ts`](../lib/services/scrape-executor.ts)

```typescript
// Linhas 98-108
const env = {
  ...process.env,
  PJE_CPF: options.credentials.cpf,
  PJE_SENHA: options.credentials.senha,
  PJE_ID_ADVOGADO: options.credentials.idAdvogado,
  PJE_BASE_URL: options.tribunalConfig.urlBase,
  PJE_LOGIN_URL: options.tribunalConfig.urlLoginSeam,  // ← Já inclui grau!
  PJE_API_URL: options.tribunalConfig.urlApi,
};
```

**Comportamento**:
- Define variáveis de ambiente para o script
- `PJE_LOGIN_URL` já inclui `/primeirograu/` ou `/segundograu/`
- Scripts não precisam saber qual é o grau

### 6. Scripts Genéricos

**Exemplo**: [`server/scripts/pje-trt/pendentes/raspar-pendentes-dada-ciencia.js`](../server/scripts/pje-trt/pendentes/raspar-pendentes-dada-ciencia.js)

```javascript
// Linhas 63-64
const PJE_LOGIN_URL = process.env.PJE_LOGIN_URL || 'https://pje.trt3.jus.br/primeirograu/login.seam';
const PJE_BASE_URL = process.env.PJE_BASE_URL || 'https://pje.trt3.jus.br';
```

**Comportamento**:
- Scripts usam variáveis de ambiente
- Não sabem/não precisam saber qual é o grau
- Funcionam automaticamente para 1º ou 2º grau

## Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. FRONT-END (TribunalSelector)                            │
│    Usuário seleciona: TRT3 - 2º Grau                       │
│    Envia: ["TRT3-2g"]                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ACTION (createScrapeJobAction)                          │
│    Parseia: "TRT3-2g" → { codigo: "TRT3", grau: "2g" }     │
│    Busca no banco: TribunalConfig(TRT3, 2g)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. BANCO DE DADOS                                           │
│    Retorna config com:                                      │
│    - urlLoginSeam: .../segundograu/login.seam               │
│    - urlBase: https://pje.trt3.jus.br                       │
│    - urlApi: .../pje-comum-api/api                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ORCHESTRATOR (executeTribunalScraping)                  │
│    Prepara config para raspagem:                            │
│    - tribunalConfigForScraping.urlLoginSeam                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. EXECUTOR (executeScript)                                 │
│    Define variáveis de ambiente:                            │
│    - PJE_LOGIN_URL=.../segundograu/login.seam               │
│    - PJE_BASE_URL=https://pje.trt3.jus.br                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. SCRIPT (raspar-pendentes-dada-ciencia.js)                │
│    Usa process.env.PJE_LOGIN_URL                            │
│    Acessa: https://pje.trt3.jus.br/segundograu/login.seam   │
│    Raspa processos do 2º grau ✅                            │
└─────────────────────────────────────────────────────────────┘
```

## Validação

### Teste Automatizado

O script [`scripts/test-all-trts-2g-scraping.ts`](../scripts/test-all-trts-2g-scraping.ts) valida o funcionamento do segundo grau:

```bash
npm run test:multi-trt-2g
```

**Resultados** (validado em 2025-10-28):
- ✅ 20 de 24 TRTs com login e raspagem bem-sucedidos no 2º grau
- ✅ Mesma estrutura HTML entre 1º e 2º grau
- ✅ Mesma API de raspagem
- ✅ Scripts funcionam identicamente

### Testes Manuais

1. **Testar no front-end**:
   - Acesse a página de raspagem
   - Selecione um TRT e marque "2º Grau"
   - Selecione tipo de raspagem (ex: Pendentes - Com Dado Ciência)
   - Inicie a raspagem
   - Verifique logs e resultados

2. **Verificar no banco**:
   ```sql
   -- Ver TribunalConfigs disponíveis
   SELECT t.codigo, tc.grau, tc.urlLoginSeam
   FROM "TribunalConfig" tc
   JOIN "Tribunal" t ON tc."tribunalId" = t.id
   ORDER BY t.codigo, tc.grau;

   -- Ver execuções por grau
   SELECT
     t.codigo,
     tc.grau,
     se.status,
     se."processosCount"
   FROM "ScrapeExecution" se
   JOIN "TribunalConfig" tc ON se."tribunalConfigId" = tc.id
   JOIN "Tribunal" t ON tc."tribunalId" = t.id
   ORDER BY se."createdAt" DESC;
   ```

## Tipos de Raspagem Suportados

Todos os scripts funcionam para ambos os graus:

| Tipo | Script | 1º Grau | 2º Grau |
|------|--------|---------|---------|
| Pendentes - Com Dado Ciência | `raspar-pendentes-dada-ciencia.js` | ✅ | ✅ |
| Pendentes - Sem Prazo | `raspar-pendentes-sem-prazo.js` | ✅ | ✅ |
| Acervo Geral | `raspar-acervo-geral.js` | ✅ | ✅ |
| Arquivados | `raspar-arquivados.js` | ✅ | ✅ |
| Minha Pauta | `raspar-minha-pauta.js` | ✅ | ✅ |

## Diferenças Entre Graus

### Diferenças de URL

A **única** diferença entre primeiro e segundo grau está no caminho da URL:

```
1º Grau: https://pje.trt{N}.jus.br/primeirograu/*
2º Grau: https://pje.trt{N}.jus.br/segundograu/*
```

### Estrutura Idêntica

Todo o resto é **exatamente igual**:
- ✅ Mesma página de login
- ✅ Mesmo botão SSO PDPJ
- ✅ Mesmos campos de credenciais
- ✅ Mesma API de processos (`/pje-comum-api/api/paineladvogado`)
- ✅ Mesma estrutura de dados retornada
- ✅ Mesmos parâmetros de paginação

## Conclusão

**Todos os scripts de raspagem desenvolvidos são válidos para primeiro e segundo grau de todos os TRTs.**

A arquitetura do sistema foi projetada para ser **independente de grau**, delegando a responsabilidade de URLs para a configuração do banco de dados. Isso torna o sistema:

1. **Flexível**: Adicionar novos graus (se necessário) é trivial
2. **Manutenível**: Scripts não precisam conhecer detalhes de URL
3. **Testável**: Fácil validar cada grau separadamente
4. **Escalável**: Não há duplicação de código

## Próximos Passos

Se precisar adicionar funcionalidade específica por grau no futuro:

1. **Não modifique os scripts** - eles devem permanecer genéricos
2. **Adicione lógica no banco** - crie campos ou tabelas específicas
3. **Passe via variáveis de ambiente** - mantenha scripts desacoplados
4. **Teste ambos os graus** - use `test:multi-trt` e `test:multi-trt-2g`
