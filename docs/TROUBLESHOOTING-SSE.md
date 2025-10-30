# Troubleshooting: SSE Log Streaming

## Problema: Logs não aparecem no terminal

### Diagnóstico

1. **Verificar console do navegador (F12)**:
   - Abra o Developer Tools (F12) e vá para a aba Console
   - Procure por mensagens prefixadas com `[useJobLogs]`
   - Verifique se SSE está conectando: "SSE connection opened"
   - Verifique se logs estão sendo recebidos: "Received log"
   - Exemplo de logs esperados:
     ```
     [useJobLogs] Creating EventSource for job abc123
     [useJobLogs] SSE connection opened for job abc123
     [useJobLogs] Received log for job abc123: info Iniciando raspagem...
     ```

2. **Verificar console do servidor**:
   - Procure por mensagens prefixadas com `[Stream]`, `[ScrapeLogger]`, `[Executor]`
   - Verificar se logs estão sendo capturados do script:
     ```
     [Executor] Sent log to logger for job: Iniciando autenticação...
     [ScrapeLogger] Added log to buffer for job abc123, total: 1
     [ScrapeLogger] Emitted event for job abc123, listeners: 1
     ```
   - Verificar se listeners estão sendo anexados:
     ```
     [Stream] SSE connected for job abc123
     [Stream] Sending 5 logs from memory buffer for job abc123
     [ScrapeLogger] Attached listener for job abc123, total listeners: 1
     ```

3. **Verificar Network tab no navegador**:
   - Abra Developer Tools (F12) e vá para a aba Network
   - Procure por request para `/api/scrapes/[jobId]/logs/stream`
   - Verifique se status é 200 e tipo é `text/event-stream`
   - Verifique se eventos estão chegando (EventStream tab no Chrome/Edge)

### Soluções Comuns

**Problema**: SSE não conecta (status 404 ou 500)
- **Causa**: Rota não configurada ou erro no servidor
- **Solução**:
  - Verifique logs do servidor para erros
  - Reiniciar aplicação: `npm run dev`
  - Verificar se arquivo `app/api/scrapes/[jobId]/logs/stream/route.ts` existe

**Problema**: SSE conecta mas não recebe logs
- **Causa**: Race condition - SSE conectou depois dos logs serem emitidos (CORRIGIDO)
- **Solução**:
  - Correção implementada: SSE agora envia buffer em memória antes de anexar listener
  - Verificar se há mensagem `[Stream] Sending X logs from memory buffer` no servidor
  - Se não houver, verificar se `scrapeLoggerService.getJobLogs()` está retornando logs

**Problema**: Logs aparecem apenas após job completar
- **Causa**: SSE não está funcionando, usando apenas backfill do banco
- **Solução**:
  - Habilitar debug: `DEBUG_LOG_STREAMING=true` no `.env`
  - Verificar logs do servidor e navegador
  - Verificar se EventEmitter está emitindo eventos: procurar por `[ScrapeLogger] Emitted event`
  - Verificar se há listeners: `listeners: 1` ou superior

**Problema**: SSE desconecta frequentemente
- **Causa**: Proxy, firewall ou timeout de rede
- **Solução**:
  - Configurar `DISABLE_SSE=true` no `.env` para usar fallback visual
  - Verificar configurações de proxy/firewall
  - Verificar se heartbeat está sendo enviado (a cada 15s)

**Problema**: Logs aparecem duplicados
- **Causa**: Múltiplas conexões SSE ou backfill + streaming
- **Solução**:
  - Verificar se há múltiplas conexões no Network tab
  - Verificar se componente está sendo montado múltiplas vezes
  - Cleanup do SSE deveria prevenir isso

**Problema**: Erro "listeners: 0" no servidor
- **Causa**: Listener não foi anexado ou foi removido prematuramente
- **Solução**:
  - Verificar se `[ScrapeLogger] Attached listener` aparece no log
  - Verificar se SSE não está sendo fechado prematuramente
  - Verificar se job está em estado `RUNNING` quando SSE conecta

### Fallback Visual

Se SSE não for viável no seu ambiente, você pode usar o componente de fallback visual:

1. Configurar `DISABLE_SSE=true` no `.env`
2. Reiniciar servidor
3. Sistema usará componente `TerminalMonitorFallback`
4. Progresso baseado em stats do endpoint `/status`
5. Menos feedback em tempo real, mas funcional

### Habilitar Logs de Debug

Para habilitar logs de debug detalhados:

1. Adicionar ao `.env`:
   ```env
   DEBUG_LOG_STREAMING=true
   ```
2. Reiniciar servidor: `npm run dev`
3. Abrir console do navegador (F12)
4. Iniciar raspagem e observar logs em ambos consoles
5. Compartilhar logs para suporte se problema persistir

**Exemplo de saída esperada:**

**Servidor:**
```
[Executor] Starting script execution...
[Executor] Sent log to logger for job: Iniciando autenticação...
[ScrapeLogger] Added log to buffer for job abc123, total: 1
[ScrapeLogger] Emitted event for job abc123, listeners: 1
[Stream] SSE connected for job abc123
[Stream] Sending 1 logs from memory buffer for job abc123
[Stream] Listener attached for job abc123
```

**Cliente (navegador):**
```
[useJobLogs] Creating EventSource for job abc123
[useJobLogs] SSE connection opened for job abc123
[useJobLogs] Received log for job abc123: info Iniciando autenticação...
```

### Redis (Multi-instance)

Se usando múltiplas instâncias da aplicação:

1. Habilitar Redis: `ENABLE_REDIS_LOG_STREAMING=true`
2. Configurar `REDIS_URL` corretamente no `.env`
3. Verificar se Redis está acessível:
   ```bash
   redis-cli ping
   # Deve retornar: PONG
   ```
4. Logs serão transmitidos via pub/sub do Redis
5. Verificar logs do servidor para mensagens do Redis

**Diagnóstico Redis:**
- Se vir `[Stream] Using Redis subscription`, Redis está ativo
- Se vir `Redis subscription failed, falling back to in-memory`, Redis não está acessível
- Verificar conexão Redis: `redis-cli -u REDIS_URL ping`

## Fluxo de Logs (Para Desenvolvedores)

```
Script (stderr)
  → Executor (spawn stderr handler)
    → ScrapeLogger (addLog)
      → EventEmitter (emit)
        → SSE Listener
          → Cliente (EventSource)
            → Zustand Store
              → React Component
```

**Pontos de falha comuns:**
1. **Script não emite para stderr**: Logs não aparecem no executor
2. **Logger sem buffer**: Logs emitidos antes de SSE conectar são perdidos (CORRIGIDO)
3. **SSE sem listener**: Eventos são emitidos mas ninguém escuta (detectável via logs)
4. **Cliente não conecta**: EventSource falha ao criar conexão (erro CORS, 404, etc)

## Referências

### Arquivos do Código

- **SSE Route**: [app/api/scrapes/[jobId]/logs/stream/route.ts](../app/api/scrapes/[jobId]/logs/stream/route.ts)
  - Implementa endpoint SSE
  - Faz backfill do banco + buffer em memória
  - Anexa listener para novos logs

- **Hook Cliente**: [hooks/use-job-logs.ts](../hooks/use-job-logs.ts)
  - Gerencia conexão SSE no cliente
  - Fallback para polling após 3 falhas
  - Adiciona logs ao Zustand store

- **Logger Servidor**: [lib/services/scrape-logger.ts](../lib/services/scrape-logger.ts)
  - Mantém buffer em memória (últimos 1000 logs)
  - Emite eventos via EventEmitter ou Redis pub/sub
  - Gerencia listeners

- **Executor**: [lib/services/scrape-executor.ts](../lib/services/scrape-executor.ts)
  - Executa scripts como subprocessos
  - Captura stderr em tempo real
  - Envia logs ao logger com heurística de severidade

- **Componente UI**: [components/pje/terminal-monitor.tsx](../components/pje/terminal-monitor.tsx)
  - Renderiza logs em tempo real
  - Mostra status de conexão
  - Auto-scroll e download de logs

- **Fallback Component**: [components/pje/terminal-monitor-fallback.tsx](../components/pje/terminal-monitor-fallback.tsx)
  - Componente visual quando SSE não está disponível
  - Animações e progresso baseado em stats

### Variáveis de Ambiente

- `ENABLE_REDIS_LOG_STREAMING`: Habilita Redis pub/sub (padrão: `false`)
- `REDIS_URL`: URL de conexão do Redis
- `DEBUG_LOG_STREAMING`: Habilita logs de debug detalhados (padrão: `false`)
- `DISABLE_SSE`: Desabilita SSE e usa fallback visual (padrão: `false`)

## Suporte

Se o problema persistir após seguir este guia:

1. Coletar logs do servidor (últimos 50 linhas)
2. Coletar logs do navegador (console completo)
3. Coletar screenshot do Network tab mostrando request SSE
4. Criar issue no repositório com:
   - Descrição do problema
   - Logs coletados
   - Configuração do `.env` (sem credenciais sensíveis)
   - Versão do Node.js e navegador
