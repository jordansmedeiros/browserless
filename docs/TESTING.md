# Guia de Testes - Browserless PJE

Este documento descreve a estratégia de testes implementada para o projeto, especialmente para as funcionalidades da proposta `improve-scrape-ux`.

## 📋 Índice

- [Tipos de Testes](#tipos-de-testes)
- [Testes Unitários](#testes-unitários)
- [Testes de Performance](#testes-de-performance)
- [Testes de Acessibilidade](#testes-de-acessibilidade)
- [Testes de Responsividade](#testes-de-responsividade)
- [Como Executar](#como-executar)
- [CI/CD](#cicd)

---

## Tipos de Testes

### ✅ Implementados

1. **Testes Unitários** - Componentes individuais e serviços
2. **Testes de Performance** - Volume de dados e latência
3. **Testes de Acessibilidade** - WCAG e usabilidade
4. **Testes de Responsividade** - Múltiplos dispositivos

### ⏭️ Deferred (não críticos)

- **Testes de Integração E2E** - Fluxos completos (requerem servidor rodando)
- **Testes Visuais de Regressão** - Screenshots (opcional)

---

## Testes Unitários

### Logger Service

**Arquivo**: `lib/services/scrape-logger.test.ts`

Testa o serviço de logging estruturado usado pelo terminal monitor:

```bash
# Executar
npm test
```

**Cobertura**:
- ✅ Criação de logger por job
- ✅ Níveis de log (info, success, warn, error)
- ✅ Contexto adicional em logs
- ✅ Buffer limiting (máximo 1000 logs)
- ✅ Event emission para SSE streaming
- ✅ Isolamento entre jobs
- ✅ Timestamps
- ✅ Casos extremos (mensagens vazias, grandes, caracteres especiais)

### Wizard Components

**Arquivo**: `components/ui/wizard-container.test.tsx`

Testa componentes do wizard de configuração de scraping:

```bash
# Executar (requer setup adicional)
npm test
```

**Cobertura**:
- ✅ Navegação entre steps
- ✅ Validação de cada step
- ✅ Indicadores de progresso
- ✅ Submit no último step
- ✅ Estados de loading

---

## Testes de Performance

**Arquivo**: `__tests__/performance/terminal-performance.test.ts`

### Cenários Testados

#### 1. High Volume Logging
- 1.000 logs em < 1 segundo
- 10.000 logs mantendo buffer limitado
- 500 logs grandes (1KB cada) em < 2 segundos

#### 2. Event Emission
- 1.000 eventos emitidos sem degradação
- Múltiplos listeners simultaneamente (5 listeners x 500 eventos)

#### 3. Memory Management
- Logs contínuos sem vazamento de memória
- Limpeza correta de buffers

#### 4. Concurrent Jobs
- 10 jobs simultâneos com 500 logs cada

#### 5. Realistic Scenario
- Simulação: 50 tribunais, 20 processos cada
- Total: ~1000 logs com contexto realista

### Como Executar

```bash
# Executar todos os testes de performance
npm test -- __tests__/performance/

# Ou executar mocha diretamente
npx mocha __tests__/performance/*.test.ts
```

### Critérios de Sucesso

✅ **1000 logs** processados em < 1s
✅ **10000 logs** com buffer limitado a 1000
✅ **Eventos SSE** sem degradação
✅ **Memória** estável com múltiplas iterações

---

## Testes de Acessibilidade

**Arquivo**: `scripts/test-accessibility.ts`

### O que é Testado

#### Estrutura Semântica
- ✅ Hierarquia de headings (h1 → h2 → h3)
- ✅ Landmarks HTML5 (main, nav, aside)
- ✅ ARIA roles corretos

#### Elementos Interativos
- ✅ Buttons com labels descritivos
- ✅ Links distinguíveis
- ✅ Inputs com labels associados
- ✅ Formulários com marcação semântica

#### Conteúdo Visual
- ✅ Imagens com alt text
- ✅ Contraste de cores (básico)
- ✅ Tamanho mínimo de touch targets

### Como Executar

```bash
# Executar auditoria de acessibilidade
npm run test:accessibility

# Requer servidor rodando em http://localhost:3000
# Ou configurar NEXT_PUBLIC_APP_URL
```

### Páginas Testadas

1. **Wizard de Scraping** - `/pje/scrapes`
2. **Results Viewer** - `/pje/scrapes/[id]`
3. **Credentials Management** - `/pje/credentials`

### Checklist Manual

Após executar o script automatizado, verificar manualmente:

**KEYBOARD**:
- ☐ Navegação por Tab funciona corretamente
- ☐ Foco visível em elementos interativos
- ☐ Modais podem ser fechados com Escape
- ☐ Formulários podem ser submetidos com Enter

**SCREEN READER**:
- ☐ Elementos têm labels descritivos
- ☐ ARIA roles estão corretos
- ☐ Landmarks estão presentes
- ☐ Headings estão em ordem hierárquica

**VISUAL**:
- ☐ Contraste de texto atende WCAG AA (4.5:1)
- ☐ Botões têm tamanho mínimo de 44x44px
- ☐ Links são distinguíveis de texto normal
- ☐ Estados de foco são visíveis

**FORMS**:
- ☐ Inputs têm labels associados
- ☐ Erros de validação são anunciados
- ☐ Campos required são marcados
- ☐ Autocomplete está configurado

---

## Testes de Responsividade

**Arquivo**: `scripts/test-responsiveness.ts`

### Viewports Testados

1. **Mobile Small** - 375x667px (iPhone SE)
2. **Mobile Medium** - 390x844px (iPhone 12)
3. **Mobile Large** - 428x926px (iPhone 12 Pro Max)
4. **Tablet Portrait** - 768x1024px (iPad)
5. **Tablet Landscape** - 1024x768px (iPad)
6. **Desktop Small** - 1366x768px
7. **Desktop Large** - 1920x1080px

### O que é Testado

#### Layout
- ✅ Sem scroll horizontal
- ✅ Elementos críticos visíveis
- ✅ Modal/dialogs responsivos

#### Touch Targets
- ✅ Botões >= 44x44px em mobile
- ✅ Links com área de toque adequada

#### Conteúdo
- ✅ Texto não cortado
- ✅ Font-size legível (>= 16px)
- ✅ Espaçamento adequado

### Como Executar

```bash
# Testar responsividade
npm run test:responsiveness

# Testar acessibilidade + responsividade
npm run test:ux

# Requer servidor rodando
```

### Páginas Testadas

1. **Wizard de Scraping** - Modal e lista de tribunais
2. **Credentials Management** - Tabelas e formulários

### Checklist Manual

- ☐ Testar no DevTools mobile simulator
- ☐ Testar em dispositivos reais (se possível)
- ☐ Verificar orientação portrait e landscape
- ☐ Testar gestos touch (scroll, tap, swipe)

---

## Como Executar

### Todos os Testes

```bash
# Testes unitários (Mocha + Chai)
npm test

# Testes de UX (acessibilidade + responsividade)
npm run test:ux
```

### Testes Individuais

```bash
# Performance
npm test -- __tests__/performance/

# Acessibilidade
npm run test:accessibility

# Responsividade
npm run test:responsiveness
```

### Pré-requisitos

1. **Servidor rodando** (para testes de acessibilidade e responsividade):
   ```bash
   npm run dev
   ```

2. **Dependências instaladas**:
   ```bash
   npm install
   ```

3. **Playwright/Chromium instalado**:
   ```bash
   npm run install:browsers
   ```

---

## CI/CD

### Recomendações para Pipeline

```yaml
# Exemplo: GitHub Actions
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '24'

    # Testes unitários
    - run: npm test

    # Testes de performance (opcional em CI)
    - run: npm test -- __tests__/performance/

    # Testes de UX (requer servidor)
    - run: npm run dev &
    - run: sleep 10  # Aguardar servidor iniciar
    - run: npm run test:accessibility
    - run: npm run test:responsiveness
```

### Configuração de Ambiente

```bash
# .env.test
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="file:./test.db"
```

---

## Relatórios e Métricas

### Performance

Após executar testes de performance, verificar:
- **Tempo de processamento** por log < 5ms
- **Buffer** limitado a 1000 logs
- **Eventos SSE** sem atraso perceptível

### Acessibilidade

**Score mínimo**: 90/100
- < 90: Melhorias necessárias
- >= 90: Aprovado

### Responsividade

**Critério de aprovação**:
- 0 erros críticos
- < 5 avisos

---

## Troubleshooting

### Testes não executam

```bash
# Verificar instalação
npm install

# Recompilar TypeScript
npm run server:build

# Limpar cache
rm -rf node_modules/.cache
```

### Servidor não inicia para testes de UX

```bash
# Verificar porta
lsof -i :3000

# Iniciar manualmente
npm run dev
```

### Playwright/Chromium não encontrado

```bash
# Instalar navegadores
npm run install:browsers

# Ou instalar apenas Chromium
npx playwright install chromium
```

---

## Contribuindo

Ao adicionar novos recursos:

1. **Escrever testes unitários** para lógica de negócio
2. **Adicionar casos** aos testes de performance (se relevante)
3. **Atualizar checklist** de acessibilidade (se UI nova)
4. **Testar responsividade** em viewports mobile

---

**Última atualização**: 26 de Outubro de 2025
**Mantido por**: Time Browserless PJE
