# 🧪 Teste Automatizado: Multi-TRT Scraping

## 📋 Visão Geral

Script de teste automatizado que valida o **login e raspagem** em **todos os 24 TRTs** (primeiro grau) para garantir que:

- ✅ Todas as URLs seguem o padrão esperado
- ✅ Login funciona em todos os TRTs
- ✅ Estrutura das páginas é consistente
- ✅ Raspagem de processos é bem-sucedida
- ✅ JSONs são salvos para auditoria

## 🎯 Objetivo

Validar que a implementação multi-TRT funciona corretamente em **todos os 24 tribunais**, identificando:

1. **TRTs com login bem-sucedido** ✅
2. **TRTs com falha de autenticação** 🔐
3. **TRTs com estrutura de página diferente** 🔍
4. **TRTs com problemas na raspagem** ⚠️

## 🚀 Como Usar

### Pré-requisitos

1. **Credenciais PJE configuradas** no arquivo `.env`:
   ```bash
   PJE_CPF=12345678901
   PJE_SENHA=sua_senha_aqui
   PJE_ID_ADVOGADO=123456
   ```

2. **Banco de dados populado** com os 24 TRTs:
   ```bash
   node --loader ts-node/esm prisma/seed.ts
   ```

### Execução

```bash
# Método 1: Via NPM (recomendado)
npm run test:multi-trt

# Método 2: Direto
node --loader ts-node/esm scripts/test-all-trts-scraping.ts
```

## 📊 O Que o Script Faz

### 1. **Validação de Credenciais**
- Verifica se `PJE_CPF`, `PJE_SENHA` e `PJE_ID_ADVOGADO` estão configurados
- Exibe erro se alguma credencial estiver faltando

### 2. **Iteração por Todos os TRTs**
Para cada um dos 24 TRTs, o script:

1. **Obtém configuração do banco de dados**
   - URL de login gerada: `https://pje.trt{N}.jus.br/primeirograu/login.seam`

2. **Testa login**
   - Navega para página de login
   - Verifica se estrutura da página está correta
   - Preenche CPF e senha
   - Submete formulário de autenticação

3. **Verifica resultado**
   - ✅ Login bem-sucedido: URL contém domínio do TRT
   - ❌ CloudFront bloqueou: Status 403
   - ❌ Credenciais incorretas: Redirect para SSO
   - ⚠️ Estrutura diferente: Elementos da página não encontrados

4. **Raspa processos (se login bem-sucedido)**
   - Acessa API `/pje-comum-api/api/paineladvogado/{id}/processos`
   - Filtra por pendentes de manifestação
   - Baixa todas as páginas de processos

5. **Salva JSON de auditoria**
   - Diretório: `data/test-multi-trt/{trt}/1g/pendentes/`
   - Formato: `test-pendentes-{timestamp}.json`

### 3. **Geração de Relatório**
Ao final, gera relatório consolidado em:
- **Console**: Resumo visual com estatísticas
- **JSON**: `data/test-multi-trt/reports/test-report-{timestamp}.json`

## 📄 Estrutura de Saída

```
data/test-multi-trt/
├── reports/
│   └── test-report-20251024-143055.json
├── trt1/
│   └── 1g/
│       └── pendentes/
│           └── test-pendentes-20251024-143100.json
├── trt2/
│   └── 1g/
│       └── pendentes/
│           └── test-pendentes-20251024-143205.json
├── trt3/
│   └── 1g/
│       └── pendentes/
│           └── test-pendentes-20251024-143310.json
...
└── trt24/
    └── 1g/
        └── pendentes/
            └── test-pendentes-20251024-145520.json
```

## 📊 Exemplo de Relatório

```
═══════════════════════════════════════════════════════════════════
📊 RELATÓRIO FINAL - TESTE MULTI-TRT
═══════════════════════════════════════════════════════════════════

🕒 Timestamp: 2025-10-24T14:55:20.123Z
📋 Total de TRTs testados: 24
✅ Sucessos: 22 (91.7%)
❌ Falhas: 2 (8.3%)

📊 RESUMO POR CATEGORIA:
───────────────────────────────────────────────────────────────────

✅ Login Bem-Sucedido (22):
   TRT1, TRT2, TRT3, TRT4, TRT5, TRT6, TRT7, TRT8, TRT9, TRT10,
   TRT11, TRT12, TRT13, TRT14, TRT15, TRT16, TRT17, TRT18, TRT19,
   TRT20, TRT21, TRT24

❌ Login Falhado (2):
   TRT22, TRT23

📊 Raspagem Bem-Sucedida (22):
   TRT1, TRT2, TRT3, ... (mesma lista acima)

⚠️  Raspagem Falhada (0):
   Nenhum

🔍 Estrutura de Página Diferente (1):
   TRT22

🔐 Problemas de Autenticação (1):
   TRT23

📝 DETALHES POR TRT:
───────────────────────────────────────────────────────────────────
✅ TRT1: TRT da 1ª Região (15 processos)
✅ TRT2: TRT da 2ª Região (32 processos)
✅ TRT3: TRT da 3ª Região (8 processos)
...
❌ TRT22: TRT da 22ª Região
   └─ Erro: PAGE_STRUCTURE_DIFFERENT - Botão #btnSsoPdpj não encontrado
❌ TRT23: TRT da 23ª Região
   └─ Erro: AUTHENTICATION_FAILED - Credenciais incorretas
...
═══════════════════════════════════════════════════════════════════
```

## 🔍 Tipos de Erros Identificados

### 1. `PAGE_STRUCTURE_DIFFERENT`
**Significado**: A estrutura da página de login é diferente do esperado

**Exemplos**:
- Botão `#btnSsoPdpj` não encontrado
- Layout da página completamente diferente

**Solução**: Investigar manualmente a URL desse TRT e adaptar o código

---

### 2. `SSO_STRUCTURE_DIFFERENT`
**Significado**: A página do SSO (login) tem estrutura diferente

**Exemplos**:
- Campo `#username` não encontrado
- Campo `#password` não encontrado

**Solução**: Verificar se o SSO desse TRT usa outra plataforma

---

### 3. `AUTHENTICATION_FAILED`
**Significado**: As credenciais foram rejeitadas

**Possíveis Causas**:
- Credenciais incorretas
- Usuário não tem acesso a esse TRT específico
- Necessário cadastro prévio nesse TRT

**Solução**: Verificar se o advogado está habilitado nesse TRT

---

### 4. `BLOCKED_BY_CLOUDFRONT`
**Significado**: CloudFront WAF detectou e bloqueou a automação

**Solução**:
- Aumentar delays entre ações
- Rotacionar User-Agents
- Adicionar mais técnicas de anti-detecção

---

### 5. `SCRAPE_ERROR`
**Significado**: Login bem-sucedido mas erro ao raspar processos

**Possíveis Causas**:
- API retornou erro
- Estrutura do JSON diferente
- Timeout na requisição

**Solução**: Investigar logs detalhados desse TRT

---

### 6. `UNEXPECTED_REDIRECT`
**Significado**: Redirecionado para URL inesperada após login

**Solução**: Verificar fluxo de autenticação desse TRT

## ⚙️ Configurações

### Timeout e Delays

```typescript
// Timeout de navegação (padrão: 60s)
timeout: 60000

// Delay entre ações (padrão: variável)
- Após carregar página: 1500ms
- Após preencher CPF: 1000ms
- Após preencher senha: 1500ms
- Após login: 5000ms
- Entre testes de TRTs: 3000ms
```

### Parâmetros da Raspagem

```typescript
// API de processos pendentes
tipoPainelAdvogado: 2
idPainelAdvogadoEnum: 2
ordenacaoCrescente: false
tamanhoPagina: 100
```

## 🛠️ Personalização

### Testar Apenas Alguns TRTs

Edite o script `test-all-trts-scraping.ts`:

```typescript
// Filtra apenas TRTs específicos
const trtsFiltrados = tribunais.filter(t =>
  ['TRT3', 'TRT15', 'TRT2'].includes(t.codigo)
);

for (const tribunal of trtsFiltrados) {
  // ...
}
```

### Mudar Tipo de Raspagem

No lugar de "pendentes sem prazo", pode raspar outros agrupamentos:

```typescript
const params = {
  idAdvogado: ID_ADVOGADO,
  tipoPainelAdvogado: 1, // 1 = Acervo Geral, 2 = Pendentes
  idPainelAdvogadoEnum: 1, // ID do agrupamento
  // ...
};
```

## 📈 Performance

### Tempo Estimado

- **Login por TRT**: ~15-30 segundos
- **Raspagem por TRT**: ~5-15 segundos (depende do volume)
- **Total para 24 TRTs**: ~8-18 minutos

### Otimizações

1. **Modo Headless**: Navegador invisível (mais rápido)
2. **Cache em Memória**: Configurações de TRT cacheadas
3. **Delays Mínimos**: Apenas o necessário para estabilidade

## 🚨 Troubleshooting

### Erro: "Credenciais não configuradas"

```bash
❌ ERRO: Credenciais PJE não configuradas no .env
```

**Solução**: Adicione ao `.env`:
```bash
PJE_CPF=12345678901
PJE_SENHA=senha123
PJE_ID_ADVOGADO=123456
```

---

### Erro: "TRT não encontrado no banco de dados"

```bash
Error: TRT TRT3 não encontrado no banco de dados
```

**Solução**: Execute o seed:
```bash
node --loader ts-node/esm prisma/seed.ts
```

---

### Muitos bloqueios CloudFront (403)

**Solução**:
1. Aumentar delays no código
2. Executar em horários de menor tráfego
3. Testar poucos TRTs por vez

---

### Script trava em algum TRT

**Solução**:
- Timeout de 60s garante que não trava indefinidamente
- Verifique logs para ver em qual TRT parou
- Execute novamente - pode ser instabilidade temporária

## 📚 Referências

- **Script Principal**: [scripts/test-all-trts-scraping.ts](../scripts/test-all-trts-scraping.ts)
- **Service Layer**: [lib/services/tribunal.ts](../lib/services/tribunal.ts)
- **Documentação Multi-TRT**: [MULTI-TRT-SUPPORT.md](MULTI-TRT-SUPPORT.md)

## ✅ Checklist de Validação

Após executar o script, verifique:

- [ ] Relatório JSON foi gerado em `data/test-multi-trt/reports/`
- [ ] Pelo menos 20 TRTs tiveram login bem-sucedido
- [ ] JSONs de processos foram salvos para TRTs com sucesso
- [ ] TRTs com falha estão documentados no relatório
- [ ] Erros são compreensíveis e categorizados

## 🎯 Próximos Passos

1. **Analisar relatório** gerado
2. **Investigar TRTs com erro** manualmente
3. **Adaptar código** para TRTs com estrutura diferente
4. **Validar credenciais** em TRTs com falha de autenticação
5. **Executar novamente** para confirmar correções

---

**Criado em**: 24/10/2025
**Versão**: 1.0.0
