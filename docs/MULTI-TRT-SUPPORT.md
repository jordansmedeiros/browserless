# 🏛️ Suporte Multi-TRT - Documentação Completa

## 📋 Visão Geral

O sistema agora suporta **todos os 24 Tribunais Regionais do Trabalho (TRTs)** do Brasil com suas respectivas instâncias (1º e 2º grau), totalizando **48 configurações de URL** gerenciadas dinamicamente via banco de dados.

### ✅ Status da Implementação

- **24 TRTs** cadastrados com metadados completos
- **48 configurações** de URL (24 TRTs × 2 graus)
- **Type-safe** com TypeScript para validação em tempo de compilação
- **Backward compatible** - código existente continua funcionando
- **Cache em memória** para otimização de performance
- **URLs configuráveis** via banco de dados para edge cases

---

## 🗺️ Mapeamento Regional

### Região Sudeste (5 TRTs)
- **TRT1** - Rio de Janeiro (RJ)
- **TRT2** - São Paulo (SP)
- **TRT3** - Minas Gerais (MG) ⭐ *Default*
- **TRT15** - Campinas (SP)
- **TRT17** - Espírito Santo (ES)

### Região Sul (3 TRTs)
- **TRT4** - Rio Grande do Sul (RS)
- **TRT9** - Paraná (PR)
- **TRT12** - Santa Catarina (SC)

### Região Nordeste (9 TRTs)
- **TRT5** - Bahia (BA)
- **TRT6** - Pernambuco (PE)
- **TRT7** - Ceará (CE)
- **TRT13** - Paraíba (PB)
- **TRT16** - Maranhão (MA)
- **TRT19** - Alagoas (AL)
- **TRT20** - Sergipe (SE)
- **TRT21** - Rio Grande do Norte (RN)
- **TRT22** - Piauí (PI)

### Região Norte (3 TRTs)
- **TRT8** - Pará/Amapá (PA/AP)
- **TRT11** - Amazonas/Roraima (AM/RR)
- **TRT14** - Rondônia/Acre (RO/AC)

### Região Centro-Oeste (4 TRTs)
- **TRT10** - Distrito Federal/Tocantins (DF/TO)
- **TRT18** - Goiás (GO)
- **TRT23** - Mato Grosso (MT)
- **TRT24** - Mato Grosso do Sul (MS)

---

## 🚀 Como Usar

### 1. Uso Básico (Backward Compatible)

```typescript
import { executarLoginPJE, rasparProcessosPJE } from '@/lib/api/pje-adapter';

// Usa TRT3 e 1º grau por padrão
const resultado = await executarLoginPJE(cpf, senha);

// Também usa defaults
const processos = await rasparProcessosPJE(cpf, senha, idAdvogado);
```

### 2. Especificar TRT e Grau

```typescript
// Login no TRT15 primeiro grau
const resultadoTRT15 = await executarLoginPJE(cpf, senha, 'TRT15', '1g');

// Login no TRT2 segundo grau (instância recursal)
const resultadoTRT2 = await executarLoginPJE(cpf, senha, 'TRT2', '2g');

// Raspar processos do TRT4 primeiro grau
const processos = await rasparProcessosPJE(
  cpf,
  senha,
  idAdvogado,
  'TRT4',  // TRT
  '1g',    // Grau
  1        // ID Agrupamento (opcional)
);
```

### 3. Listar TRTs Disponíveis

```typescript
import { listAllTRTs, listTRTsByRegion } from '@/lib/services/tribunal';

// Lista todos os 24 TRTs
const todosTRTs = await listAllTRTs();
console.log(todosTRTs); // Array com 24 tribunais

// Lista TRTs de uma região específica
const trtsSudeste = await listTRTsByRegion('Sudeste');
console.log(trtsSudeste); // [TRT1, TRT2, TRT3, TRT15, TRT17]
```

### 4. Obter Configuração de URL

```typescript
import { getTribunalConfig } from '@/lib/services/tribunal';

// Busca configuração do TRT15 primeiro grau
const config = await getTribunalConfig('TRT15', '1g');
console.log(config.urlLoginSeam);
// "https://pje.trt15.jus.br/primeirograu/login.seam"
```

### 5. Validar e Normalizar Códigos TRT

```typescript
import { validateTRTCode, normalizeTRTCode } from '@/lib/services/tribunal';

// Normaliza diferentes formatos
const codigo1 = normalizeTRTCode('trt3');  // 'TRT3'
const codigo2 = normalizeTRTCode('15');    // 'TRT15'
const codigo3 = normalizeTRTCode(24);      // 'TRT24'

// Valida código TRT
try {
  const valido = validateTRTCode('TRT3');  // Não lança erro
  const invalido = validateTRTCode('TRT25'); // Lança erro
} catch (error) {
  console.error('Código TRT inválido');
}
```

---

## 🏗️ Arquitetura

### Estrutura do Banco de Dados

```prisma
model Tribunal {
  id         String   @id @default(uuid())
  codigo     String   @unique  // "TRT1", "TRT2", ..., "TRT24"
  nome       String              // "TRT da 3ª Região"
  regiao     String              // "Sudeste", "Sul", etc.
  uf         String              // "MG", "SP", "RJ", etc.
  cidadeSede String              // "Belo Horizonte", etc.
  ativo      Boolean  @default(true)
  configs    TribunalConfig[]
}

model TribunalConfig {
  id           String   @id @default(uuid())
  grau         String              // "1g" | "2g"
  urlBase      String              // "https://pje.trt3.jus.br"
  urlLoginSeam String              // ".../primeirograu/login.seam"
  urlApi       String              // ".../pje-comum-api/api"
  tribunal     Tribunal  @relation(...)
  tribunalId   String
}
```

### TypeScript Type System

```typescript
// União de todos os códigos TRT
type TRTCode = 'TRT1' | 'TRT2' | ... | 'TRT24';

// Graus judiciais
type Grau = '1g' | '2g';

// Regiões geográficas
type Regiao = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';

// Informações do tribunal
interface TribunalInfo {
  codigo: TRTCode;
  nome: string;
  regiao: Regiao;
  uf: string;
  cidadeSede: string;
  ativo: boolean;
}

// Configuração de URLs
interface TribunalConfig {
  grau: Grau;
  urlBase: string;
  urlLoginSeam: string;
  urlApi: string;
}
```

### Cache em Memória

```typescript
// Cache de 5 minutos para otimizar performance
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Invalida cache manualmente se necessário
import { invalidateTribunalCache } from '@/lib/services/tribunal';
invalidateTribunalCache();
```

---

## 📐 Padrão de URLs

### Geração Automática

As URLs seguem o padrão consistente:

```
https://pje.trt{N}.jus.br/{grau}/
```

Onde:
- `{N}` = número do TRT (1 a 24)
- `{grau}` = "primeirograu" ou "segundograu"

**Exemplos:**
- TRT3 1º grau: `https://pje.trt3.jus.br/primeirograu/login.seam`
- TRT3 2º grau: `https://pje.trt3.jus.br/segundograu/login.seam`
- TRT15 1º grau: `https://pje.trt15.jus.br/primeirograu/login.seam`

### Override para Casos Especiais

Se algum TRT usar URL diferente, você pode atualizar via banco:

```typescript
import { updateTribunalUrl } from '@/lib/services/tribunal';

// Atualiza URL de login do TRT10 1º grau
await updateTribunalUrl('TRT10', '1g', {
  urlLoginSeam: 'https://custom-url.trt10.jus.br/login.seam'
});
```

---

## 🧪 Testes e Validação

### Executar Suite de Testes

```bash
# Testa todas as funcionalidades multi-TRT
node --loader ts-node/esm scripts/test-multi-trt.ts
```

### Testes Incluídos

✅ **Integridade do Banco**: Verifica 24 TRTs e 48 configs
✅ **Geração de URLs**: Valida padrão para todos os TRTs
✅ **Validação de Códigos**: Testa códigos válidos e inválidos
✅ **Backward Compatibility**: Garante que TRT3 continua funcionando
✅ **Filtragem Regional**: Lista TRTs por região
✅ **Listagem Completa**: Retorna todos os 24 TRTs

### Resultado Esperado

```
✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!
```

---

## 🔧 Configuração e Manutenção

### Populando o Banco de Dados

```bash
# Executa seed para popular TRTs
node --loader ts-node/esm prisma/seed.ts
```

Isso cria:
- 24 registros na tabela `Tribunal`
- 48 registros na tabela `TribunalConfig`

### Migrações

```bash
# Aplicar migration (já executado)
npx prisma migrate dev --name add-tribunal-multi-trt-support

# Gerar Prisma Client
npx prisma generate
```

### Verificar Dados

```bash
# Abrir Prisma Studio
npx prisma studio
```

Navegue para as tabelas `Tribunal` e `TribunalConfig` para visualizar os dados.

---

## 🎯 Casos de Uso

### 1. Advogado Multi-Regional

Advogado que atua em processos em diferentes TRTs pode automatizar todos:

```typescript
const trts = ['TRT3', 'TRT15', 'TRT2'] as const;

for (const trt of trts) {
  const resultado = await executarLoginPJE(cpf, senha, trt, '1g');
  if (resultado.success) {
    const processos = await rasparProcessosPJE(
      cpf, senha, idAdvogado, trt, '1g'
    );
    console.log(`${trt}: ${processos.total} processos encontrados`);
  }
}
```

### 2. Instâncias Recursais

Acompanhar processos em segunda instância:

```typescript
// Login no segundo grau do TRT3
const resultado = await executarLoginPJE(cpf, senha, 'TRT3', '2g');

// Raspa processos da instância recursal
const recursos = await rasparProcessosPJE(
  cpf, senha, idAdvogado, 'TRT3', '2g'
);
```

### 3. Relatórios Regionais

Gerar estatísticas por região:

```typescript
import { listTRTsByRegion } from '@/lib/services/tribunal';

const regioes = ['Sudeste', 'Sul', 'Nordeste'] as const;

for (const regiao of regioes) {
  const trts = await listTRTsByRegion(regiao);
  console.log(`${regiao}: ${trts.length} TRTs`);
  // Processar cada TRT da região...
}
```

---

## 🚨 Troubleshooting

### Erro: TRT não encontrado

```
Error: TRT TRT25 não encontrado no banco de dados
```

**Solução**: Use apenas TRT1 a TRT24. Verifique com `normalizeTRTCode()`.

### Erro: Configuração não encontrada

```
Error: Configuração para TRT3 3g não encontrada
```

**Solução**: Use apenas '1g' ou '2g' como grau.

### Cache desatualizado

Se as URLs forem atualizadas no banco mas não refletem:

```typescript
import { invalidateTribunalCache } from '@/lib/services/tribunal';
invalidateTribunalCache();
```

### URLs incorretas

Alguns TRTs podem não seguir o padrão. Use `updateTribunalUrl()`:

```typescript
await updateTribunalUrl('TRT10', '1g', {
  urlLoginSeam: 'https://url-correta.trt10.jus.br/login.seam'
});
```

---

## 📊 Estatísticas

- **TRTs Suportados**: 24 (100% cobertura)
- **Configurações**: 48 (24 × 2 graus)
- **Regiões**: 5 (Norte, Nordeste, Centro-Oeste, Sudeste, Sul)
- **Cache TTL**: 5 minutos
- **Performance**: < 1ms para busca em cache

---

## 🔄 Migração de Código Existente

### Antes (Hardcoded TRT3)

```typescript
const resultado = await executarLoginPJE(cpf, senha);
```

### Depois (Flexível)

```typescript
// Mantém funcionamento idêntico (usa TRT3)
const resultado = await executarLoginPJE(cpf, senha);

// Ou especifica outro TRT
const resultado = await executarLoginPJE(cpf, senha, 'TRT15', '1g');
```

**Não é necessário alterar código existente!** Tudo continua funcionando com os defaults.

---

## 📚 Referências

- **Arquivo de Tipos**: [lib/types/tribunal.ts](../lib/types/tribunal.ts)
- **Service Layer**: [lib/services/tribunal.ts](../lib/services/tribunal.ts)
- **PJE Adapter**: [lib/api/pje-adapter.ts](../lib/api/pje-adapter.ts)
- **Schema Prisma**: [prisma/schema.prisma](../prisma/schema.prisma)
- **Seeds**: [prisma/seeds/](../prisma/seeds/)
- **Testes**: [scripts/test-multi-trt.ts](../scripts/test-multi-trt.ts)

---

## ✅ Próximos Passos

- [ ] Interface web para seleção de TRT
- [ ] Autenticação multi-TRT simultânea
- [ ] Sincronização automática de processos
- [ ] Notificações de atualizações por TRT
- [ ] Relatórios comparativos entre TRTs

---

**Criado em**: 24/10/2025
**Última Atualização**: 24/10/2025
**Versão**: 1.0.0
