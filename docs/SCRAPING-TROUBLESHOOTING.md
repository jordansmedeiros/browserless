# Guia de Troubleshooting - Interface de Scraping PJE

Este guia cobre os problemas mais comuns encontrados ao usar a interface de scraping e suas soluções.

---

## 📋 Índice

- [Problemas com Credenciais](#problemas-com-credenciais)
- [Erros de Execução](#erros-de-execução)
- [Problemas de Performance](#problemas-de-performance)
- [Erros de Rede](#erros-de-rede)
- [Problemas com o Banco de Dados](#problemas-com-o-banco-de-dados)
- [Problemas com a Interface](#problemas-com-a-interface)

---

## 🔐 Problemas com Credenciais

### ❌ Erro: "Credenciais não encontradas para este tribunal"

**Causa**: O sistema não encontrou credenciais válidas para o tribunal selecionado.

**Solução**:
1. Acesse http://localhost:3000/pje/credentials
2. Verifique se você tem credenciais cadastradas
3. Confirme que as credenciais estão associadas ao tribunal correto
4. Teste as credenciais clicando em "Testar Credenciais"

```bash
# Verificar credenciais no banco
npx prisma studio
# Navegue até: Credencial → TribunalConfigs
```

---

### ❌ Erro: "Autenticação falhou - CPF ou senha incorretos"

**Causa**: As credenciais estão incorretas ou a sessão expirou.

**Solução**:
1. Verifique se CPF e senha estão corretos
2. Teste as credenciais no próprio site do PJE
3. Atualize as credenciais no sistema:
   - Acesse `/pje/credentials`
   - Edite a credencial problemática
   - Salve e teste novamente

**Nota**: O PJE pode ter rate limiting. Aguarde 5-10 minutos entre tentativas de login falhadas.

---

### ❌ Erro: "ID do advogado não encontrado"

**Causa**: O sistema não conseguiu detectar automaticamente o `idAdvogado` no PJE.

**Solução**:
1. Faça login manualmente no PJE
2. Capture o `idAdvogado` dos requests de rede:
   - Abra DevTools (F12)
   - Vá para a aba Network
   - Procure por requests para `/api/processos`
   - Copie o valor do parâmetro `idAdvogado`
3. Adicione manualmente no cadastro do advogado

---

## 🚨 Erros de Execução

### ❌ Erro: "Timeout durante execução"

**Causa**: O script demorou mais de 10 minutos para executar.

**Solução**:
1. **Aumente o timeout** (em `.env`):
   ```bash
   SCRAPE_EXECUTION_TIMEOUT=1200000  # 20 minutos
   ```

2. **Reduza a carga**:
   - Divida jobs grandes em múltiplos jobs menores
   - Reduza a quantidade de tribunais por job

3. **Verifique a conexão**:
   - Problemas de rede podem causar lentidão
   - Teste a velocidade de conexão com o PJE

**Retry Automático**: Jobs com timeout são automaticamente retried até 3 vezes.

---

### ❌ Erro: "Script retornou código de saída não-zero"

**Causa**: O script de scraping travou ou encontrou um erro fatal.

**Possíveis Causas**:
- Mudança na estrutura HTML do PJE
- Erro no JavaScript do script
- Puppeteer/Chromium travou

**Solução**:
1. **Verifique os logs** da execução:
   - Abra os detalhes da execução
   - Leia os logs completos
   - Procure por stack traces

2. **Execute o script manualmente** para debug:
   ```bash
   node server/scripts/pje-trt/trt3/1g/acervo/raspar-acervo-geral.js
   ```

3. **Reporte o erro** se o problema persistir (pode ser mudança no PJE)

---

### ❌ Erro: "Processo já está em execução"

**Causa**: Puppeteer não conseguiu iniciar porque outra instância está rodando.

**Solução**:
1. **Verifique processos Chrome em execução**:
   ```bash
   # Windows
   tasklist | findstr chrome

   # Linux/Mac
   ps aux | grep chrome
   ```

2. **Mate processos órfãos**:
   ```bash
   # Windows
   taskkill /F /IM chrome.exe

   # Linux/Mac
   pkill chrome
   ```

3. **Reduza concorrência** (em `.env`):
   ```bash
   MAX_CONCURRENT_JOBS=1
   MAX_CONCURRENT_TRIBUNALS_PER_JOB=1
   ```

---

## ⚡ Problemas de Performance

### 🐌 Jobs estão muito lentos

**Possíveis Causas**:
- Muitos tribunais sendo processados
- Conexão lenta com o PJE
- Recursos insuficientes (CPU/RAM)

**Soluções**:

**1. Otimize a concorrência**:
```bash
# Para máquinas mais potentes (8GB+ RAM)
MAX_CONCURRENT_JOBS=3
MAX_CONCURRENT_TRIBUNALS_PER_JOB=1

# Para máquinas mais fracas (4GB RAM)
MAX_CONCURRENT_JOBS=1
MAX_CONCURRENT_TRIBUNALS_PER_JOB=1
```

**2. Monitore recursos**:
```bash
# Verificar uso de memória
# Windows: Gerenciador de Tarefas
# Linux/Mac: htop ou top
```

**3. Execute em horários de menor carga do PJE**:
- Evite horário comercial (9h-18h)
- Prefira madrugada ou finais de semana

---

### 💾 Banco de dados está crescendo muito

**Causa**: Logs e resultados de execuções antigas acumulados.

**Solução**:

**1. Limpeza manual de execuções antigas**:
```bash
npx prisma studio

# Ou via SQL direto:
sqlite3 prisma/dev.db
sqlite> DELETE FROM ScrapeExecution WHERE createdAt < datetime('now', '-30 days');
```

**2. Implemente rotina de limpeza automática** (TODO - em desenvolvimento)

**3. Use compressão** (já implementado):
- Resultados são comprimidos com gzip automaticamente
- Reduz tamanho em ~80%

---

## 🌐 Erros de Rede

### ❌ Erro: "CloudFront bloqueou o request (403)"

**Causa**: O WAF (Web Application Firewall) do CloudFront detectou comportamento suspeito.

**Solução**:
1. **Aguarde 5-10 minutos** antes de tentar novamente
2. **Reduza a frequência** de requests:
   ```bash
   # Adicione delay entre tribunais
   MAX_CONCURRENT_TRIBUNALS_PER_JOB=1
   ```
3. **Verifique o User-Agent** (deve ser Chrome moderno)
4. **Evite muitos logins seguidos** - use credenciais persistentes

**Nota**: Bloqueios temporários do CloudFront são comuns e se resolvem sozinhos.

---

### ❌ Erro: "ECONNREFUSED" ou "Connection timeout"

**Causa**: Não conseguiu conectar ao PJE.

**Solução**:
1. **Verifique conectividade**:
   ```bash
   ping pje.trt3.jus.br
   curl -I https://pje.trt3.jus.br
   ```

2. **Verifique firewall/proxy**:
   - Certifique-se que portas 80/443 estão abertas
   - Configure proxy se necessário

3. **Verifique se o PJE está no ar**:
   - Acesse manualmente pelo navegador
   - Verifique status em redes sociais do tribunal

---

## 💾 Problemas com o Banco de Dados

### ❌ Erro: "Prisma Client initialization failed"

**Causa**: Banco de dados não foi inicializado ou está corrompido.

**Solução**:
1. **Execute migrations**:
   ```bash
   npx prisma migrate dev
   ```

2. **Regenere o Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Em último caso, recrie o banco** (⚠️ perde dados):
   ```bash
   rm prisma/dev.db
   npx prisma migrate dev
   ```

---

### ❌ Erro: "Unique constraint failed"

**Causa**: Tentativa de inserir dados duplicados.

**Solução**:
- Geralmente é um bug no código
- Verifique se não está criando jobs duplicados
- Reporte o erro com logs completos

---

## 🖥️ Problemas com a Interface

### ❌ Jobs ativos não aparecem

**Causa**: Polling não está funcionando ou jobs não foram enfileirados.

**Solução**:
1. **Verifique o console do navegador** (F12):
   - Procure por erros de JavaScript
   - Verifique se requests estão sendo feitos

2. **Force refresh**:
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

3. **Verifique auto-refresh**:
   - Certifique-se que o toggle "Auto-atualizar" está ativado

4. **Verifique o servidor**:
   ```bash
   # Logs do servidor Next.js
   npm run dev
   # Procure por erros no terminal
   ```

---

### ❌ Filtros não funcionam

**Causa**: Estado do formulário desincronizado ou erro de validação.

**Solução**:
1. **Limpe os filtros** e tente novamente
2. **Refresh a página** (F5)
3. **Verifique o console** para erros de JavaScript
4. **Limpe o cache** do navegador

---

### ❌ Exportação JSON falha

**Causa**: Dados muito grandes ou erro de descompressão.

**Solução**:
1. **Verifique os logs** da execução:
   - Pode haver erro na compressão dos dados

2. **Acesse dados via Prisma Studio**:
   ```bash
   npx prisma studio
   # Navegue até ScrapeExecution
   # Copie manualmente o resultData
   ```

3. **Use query SQL direta**:
   ```bash
   sqlite3 prisma/dev.db
   sqlite> SELECT * FROM ScrapeExecution WHERE id='<execution-id>';
   ```

---

## 🔄 Retry Não Funciona

### ❌ Botão "Tentar Novamente" não aparece

**Causa**: Execução não está no status "failed".

**Solução**:
- Apenas execuções falhadas podem ser retried
- Verifique o status da execução
- Execuções "canceled" não podem ser retried

---

### ❌ Retry falha imediatamente

**Causa**: Problema persiste (credenciais, rede, etc).

**Solução**:
1. **Corrija a causa raiz** antes de retry:
   - Credenciais inválidas → atualize credenciais
   - Timeout → aumente timeout ou reduza carga
   - Erro de rede → verifique conectividade

2. **Aguarde intervalo de retry**:
   - Sistema usa exponential backoff
   - Retry manual ignora backoff

---

## 📊 Monitoramento e Logs

### Como acessar logs detalhados

**Logs da Execução (UI)**:
1. Acesse `/pje/scrapes`
2. Clique em um job no histórico
3. Visualize logs completos na seção "Logs de Execução"

**Logs do Servidor**:
```bash
# Terminal do npm run dev
# Procure por:
# - [ScrapeQueue] ...
# - [ScrapeOrchestrator] ...
# - [ScrapeExecutor] ...
```

**Logs do Banco (Prisma)**:
```bash
# Ative logs do Prisma em .env
DEBUG=prisma:*

# Ou edite app/actions/pje.ts:
log: ['query', 'info', 'warn', 'error']
```

---

## 🆘 Quando Reportar um Bug

Se nenhuma solução acima funcionou, reporte o bug com:

1. **Descrição do problema**
2. **Passos para reproduzir**
3. **Logs completos** (execução + servidor)
4. **Screenshots** (se aplicável)
5. **Ambiente**:
   - Versão do Node.js
   - Sistema operacional
   - Navegador (se relevante)
6. **Configuração**:
   - Valores de .env relevantes
   - Tribunal e tipo de scraping

---

## 📚 Recursos Adicionais

- [README Principal](../README.md)
- [Documentação de APIs PJE](pje/APIs.md)
- [Guia de Anti-Detecção](pje/ANTI-BOT-DETECTION.md)
- [Schema do Banco de Dados](../prisma/schema.prisma)

---

<div align="center">
  <p><strong>Não encontrou solução?</strong></p>
  <p>Abra uma issue no repositório com logs detalhados</p>
</div>
