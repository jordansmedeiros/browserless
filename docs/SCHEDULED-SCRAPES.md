# Raspagens Programadas

Sistema de agendamento automático de raspagens do PJE.

## Visão Geral

O sistema de raspagens programadas permite configurar execuções automáticas de raspagens em horários específicos, usando expressões cron para flexibilidade máxima.

### Arquitetura

```
┌─────────────────────┐
│  ScheduledScrape    │ (Banco de Dados)
│  - Configuração     │
│  - Cron Expression  │
│  - Tribunais        │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Scheduler Service  │ (Node.js)
│  - node-cron        │
│  - Gerencia jobs    │
└──────────┬──────────┘
           │
           ↓ (cron dispara)
┌─────────────────────┐
│  createScrapeJob    │ (Server Action)
│  - Cria ScrapeJob   │
│  - Status: PENDING  │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Orchestrator       │ (Polling)
│  - Processa jobs    │
│  - Executa scripts  │
└─────────────────────┘
```

## Funcionalidades

### 1. Criação de Agendamentos

- **Nome e Descrição**: Identificação do agendamento
- **Credencial**: Qual credencial usar para autenticação
- **Tribunais**: Quais tribunais raspar (múltipla seleção)
- **Tipo de Raspagem**: Acervo Geral, Pendentes, Arquivados, Minha Pauta
- **Frequência**: Configuração de quando executar

### 2. Tipos de Frequência

#### Diariamente
- Executa todo dia em horário específico
- Exemplo: "Todo dia às 09:00"
- Cron: `0 9 * * *`

#### Semanalmente
- Executa em dias da semana específicos
- Exemplo: "Seg, Qua, Sex às 09:00"
- Cron: `0 9 * * 1,3,5`

#### Intervalo
- Executa a cada X horas
- Exemplo: "A cada 6 horas"
- Cron: `0 */6 * * *`

#### Personalizado
- Expressão cron customizada
- Para usuários avançados
- Validação em tempo real

### 3. Gerenciamento

- **Listar**: Ver todos os agendamentos
- **Editar**: Modificar configuração
- **Pausar/Ativar**: Desabilitar temporariamente
- **Deletar**: Remover agendamento
- **Histórico**: Ver jobs criados pelo agendamento

## Sintaxe Cron

Expressão cron tem 5 campos:

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── dia do mês (1 - 31)
│ │ │ ┌───────────── mês (1 - 12)
│ │ │ │ ┌───────────── dia da semana (0 - 6) (0 = domingo)
│ │ │ │ │
* * * * *
```

### Exemplos

| Cron | Descrição |
|------|----------|
| `0 9 * * *` | Todo dia às 9h |
| `0 9 * * 1-5` | Dias úteis às 9h |
| `0 */6 * * *` | A cada 6 horas |
| `30 8 * * 1` | Segundas às 8:30 |
| `0 0 1 * *` | Primeiro dia do mês à meia-noite |
| `0 12,18 * * *` | Meio-dia e 18h todo dia |

### Caracteres Especiais

- `*` : Qualquer valor
- `,` : Lista de valores (ex: `1,3,5`)
- `-` : Range de valores (ex: `1-5`)
- `/` : Incremento (ex: `*/6` = a cada 6)

## Configuração

### Variáveis de Ambiente

```env
# Habilitar/desabilitar scheduler
ENABLE_SCHEDULED_SCRAPES=true

# Timezone padrão
DEFAULT_SCHEDULE_TIMEZONE=America/Sao_Paulo

# Limites
MAX_SCHEDULES_PER_CREDENTIAL=10
MIN_SCHEDULE_INTERVAL_MINUTES=60
```

### Timezones Suportados

- `America/Sao_Paulo` (Brasília - UTC-3)
- `America/Fortaleza` (Fortaleza - UTC-3)
- `America/Manaus` (Manaus - UTC-4)
- `America/Rio_Branco` (Acre - UTC-5)
- `America/Noronha` (Fernando de Noronha - UTC-2)

## API

### Server Actions

#### `createScheduledScrapeAction(input)`

Cria novo agendamento.

```typescript
const result = await createScheduledScrapeAction({
  name: 'Raspagem Diária TRT3',
  description: 'Pendentes de manifestação',
  credencialId: 'uuid',
  tribunalConfigIds: ['TRT3-PJE-1g', 'TRT15-PJE-1g'],
  scrapeType: 'pendentes',
  scrapeSubType: 'com_dado_ciencia',
  cronExpression: '0 9 * * 1-5',
  timezone: 'America/Sao_Paulo',
  active: true,
});
```

#### `listScheduledScrapesAction(filters)`

Lista agendamentos com paginação.

```typescript
const result = await listScheduledScrapesAction({
  active: true,
  page: 1,
  pageSize: 20,
});
```

#### `updateScheduledScrapeAction(scheduleId, input)`

Atualiza agendamento existente.

#### `deleteScheduledScrapeAction(scheduleId)`

Deleta agendamento.

#### `toggleScheduledScrapeAction(scheduleId, active)`

Ativa/pausa agendamento.

## Componentes UI

### ScheduledScrapeForm

Formulário wizard com 4 steps para criar/editar agendamentos.

```tsx
<ScheduledScrapeForm
  tribunais={tribunais}
  scheduleId={editingScheduleId}
  onSuccess={(scheduleId) => console.log('Criado:', scheduleId)}
  onCancel={() => console.log('Cancelado')}
/>
```

### ScheduledScrapesList

Lista de agendamentos com ações de gerenciamento.

```tsx
<ScheduledScrapesList
  onEdit={(scheduleId) => setEditingScheduleId(scheduleId)}
  onViewJobs={(scheduleId) => console.log('Ver jobs de:', scheduleId)}
/>
```

### ScheduleFrequencySelector

Seletor de frequência com UI amigável.

```tsx
<ScheduleFrequencySelector
  value={frequency}
  onChange={setFrequency}
/>
```

## Troubleshooting

### Agendamento não está executando

1. Verificar se está ativo: `active = true`
2. Verificar cron expression: usar validador online
3. Verificar timezone: deve ser suportado
4. Verificar logs do servidor: `[ScheduledScrapeService]`
5. Verificar se scheduler está inicializado: `ENABLE_SCHEDULED_SCRAPES=true`

### Cron expression inválida

- Usar validador: https://crontab.guru/
- Verificar 5 campos (não 6 como alguns sistemas)
- Verificar ranges válidos (0-59, 0-23, etc)

### Jobs não aparecem no histórico

- Verificar campo `lastJobId` do agendamento
- Verificar se job foi criado com sucesso
- Verificar logs: `[ScheduledScrapeService] Executed schedule`

### Múltiplas execuções simultâneas

- Verificar se há múltiplas instâncias do servidor
- Scheduler deve rodar em single instance
- Considerar usar Redis para locking (futuro)

## Desenvolvimento

### Adicionar novo preset de cron

Em `lib/utils/cron-helpers.ts`:

```typescript
export const CRON_PRESETS = {
  // ... presets existentes
  MY_NEW_PRESET: '0 9 * * 1-5',
} as const;
```

### Adicionar nova validação

Em `app/actions/pje.ts`, no schema de validação:

```typescript
const createScheduledScrapeSchema = z.object({
  // ... campos existentes
  myNewField: z.string().min(1),
});
```

### Logs úteis

- `[ScheduledScrapeService] Initialized with X active schedules`
- `[ScheduledScrapeService] Scheduled job {id}: {name}`
- `[ScheduledScrapeService] Executing schedule {id}`
- `[ScheduledScrapeService] Created job {jobId} for schedule {id}`

## Futuras Melhorias

- [ ] Retry logic para falhas no createScrapeJob
- [ ] Notificações de falhas consecutivas
- [ ] Dashboard de estatísticas de agendamentos
- [ ] Filtro de histórico por scheduleId
- [ ] Suporte para múltiplas instâncias com Redis
- [ ] Webhooks para notificar conclusão de jobs
- [ ] Templates de agendamentos
- [ ] Clonagem de agendamentos
- [ ] Pausar temporariamente (com data de retomada)
- [ ] Logs de execução dedicados

## Referências

- [node-cron documentation](https://github.com/node-cron/node-cron)
- [Cron expression validator](https://crontab.guru/)
- [IANA Timezone Database](https://www.iana.org/time-zones)
