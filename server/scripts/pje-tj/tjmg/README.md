# Scripts de Scraping - PJE TJMG (Tribunal de Justiça de Minas Gerais)

## Visão Geral

Scripts para raspagem de processos do PJE TJMG 1º Grau.

**⚠️ IMPORTANTE: Diferenças do PJE TRT**

O PJE TJMG funciona de maneira **fundamentalmente diferente** do PJE TRT:

| Característica | PJE TRT | PJE TJMG |
|---|---|---|
| **Dados** | API REST com JSON | HTML renderizado |
| **Requisições** | HTTP diretas para API | Navegação via Puppeteer |
| **Após login** | Funciona normal | "Bad Request" → precisa F5 |
| **Navegação** | Acesso direto via URL | Menu → Painel → Acervo |
| **Regiões** | API retorna tudo | Precisa expandir cada uma |
| **Extração** | Parse JSON | Parse HTML |

## Estrutura de Diretórios

```
pje-tj/tjmg/
├── README.md                          # Este arquivo
├── common/
│   ├── auth-helpers.js               # Helpers de autenticação
│   └── login.js                      # Script de teste de login
└── 1g/
    └── acervo/
        └── raspar-acervo-geral.js    # Raspagem do acervo geral
```

## Configuração

### 1. Credenciais (via Sistema Web)

⚠️ **IMPORTANTE**: Este script é integrado ao sistema principal que usa credenciais do **BANCO DE DADOS**.

**Para uso em produção:**
1. Acesse: `http://localhost:3000/pje/credentials`
2. Configure escritório/advogado
3. Adicione credenciais PJE e associe aos tribunais
4. O sistema passa credenciais automaticamente via variáveis de ambiente

**Para testes manuais standalone**, você pode configurar `.env`:
```bash
PJE_CPF=seu_cpf_sem_pontos
PJE_SENHA=sua_senha
```

⚠️ Note que `PJE_ID_ADVOGADO` não é usado para TJMG (apenas para TRT).

### 2. Dependências

As dependências já estão instaladas no projeto. Caso precise reinstalar:

```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

## Scripts Disponíveis

### 1. Login - Teste Manual

**Propósito**: Testar login no PJE TJMG e verificar o comportamento "Bad Request"

**Uso**:
```bash
node server/scripts/pje-tj/tjmg/common/login.js
```

**O que faz**:
- ✅ Faz login no SSO do PJE TJMG
- ✅ Detecta "Bad Request" e faz refresh automático
- ✅ Abre navegador visível para inspeção
- ✅ Tira screenshot do resultado
- ✅ Mantém navegador aberto para debug

**Saída**:
- `login-tjmg-resultado.png` - Screenshot após login

### 2. Raspagem do Acervo Geral

**Propósito**: Extrair TODOS os processos de TODAS as regiões do acervo

**Uso**:
```bash
node server/scripts/pje-tj/tjmg/1g/acervo/raspar-acervo-geral.js
```

**O que faz**:
1. ✅ Login automático no PJE TJMG
2. ✅ Lida com "Bad Request" automaticamente
3. ✅ Navega: Menu → Painel → Painel do Representante → ACERVO
4. ✅ Identifica todas as regiões/jurisdições disponíveis
5. ✅ Para cada região:
   - Expande a região
   - Clica em "Caixa de entrada"
   - Extrai todos os processos (com paginação)
   - Identifica a região de cada processo
6. ✅ Salva todos os dados em JSON

**Saída**:
- **stdout**: JSON com array de processos (para integração)
- **arquivo**: `data/pje/tjmg/acervo/acervo-geral-{timestamp}.json`

**Formato do JSON**:
```json
{
  "dataExtracao": "2025-10-30T...",
  "tribunal": "TJMG",
  "grau": "1g",
  "totalProcessos": 500,
  "totalRegioes": 35,
  "regioes": [
    { "nome": "Belo Horizonte", "quantidade": 107 },
    { "nome": "Betim", "quantidade": 3 }
  ],
  "processos": [
    {
      "numero": "ProceComCiv 5196751-57.2023.8.13.0024",
      "regiao": "Belo Horizonte",
      "tipo": "Serviços de Saúde",
      "partes": "AUTOR X RÉU",
      "vara": "20ª Vara Cível da Comarca de Belo Horizonte",
      "dataDistribuicao": "Distribuído em 31/08/2023",
      "ultimoMovimento": "Último movimento: 29/10/2025 10:48",
      "textoCompleto": "..."
    }
  ]
}
```

## Comportamento Específico do TJMG

### 1. "Bad Request" Após Login

**Problema**: Após fazer login com sucesso, a primeira página SEMPRE retorna "Bad Request" (400)

**Solução**: Os scripts fazem `page.reload()` automaticamente

**Código**:
```javascript
const pageContent = await page.content();
if (pageContent.toLowerCase().includes('bad request')) {
  console.log('Detectado Bad Request - fazendo refresh...');
  await page.reload({ waitUntil: 'networkidle2' });
}
```

### 2. Navegação Manual Obrigatória

O TJMG não aceita acesso direto via URL. **Precisa navegar pelos menus**:

```
Menu sanduíche → Painel → Painel do Representante → ACERVO
```

### 3. Múltiplas Regiões

O TJMG tem **dezenas de regiões diferentes** (Belo Horizonte, Betim, Contagem, etc.)

**Cada região tem sua própria caixa de processos** e deve ser raspada individualmente.

### 4. Extração de HTML

Os processos vêm no HTML da página, não em JSON. O script usa parsing de texto:

```javascript
const regex = /(ProceComCiv|ExTEx|PAP|MSCiv|ExFis)\s+([\d\-\.]+)/g;
```

## Troubleshooting

### Erro: "Iframe SSO não encontrado"

**Causa**: Página de login não carregou corretamente

**Solução**:
- Aumente o timeout em `waitUntil: 'networkidle2'`
- Verifique se o site está acessível

### Erro: "Login timeout"

**Causa**: Página SSO demorou muito para carregar

**Solução**: Configure timeouts maiores:
```bash
PJE_LOGIN_SELECTOR_TIMEOUT=30000
PJE_LOGIN_NAVIGATION_TIMEOUT=90000
```

### Nenhum processo extraído

**Causa**: Parsing do HTML falhou

**Solução**:
1. Execute o script de login para ver a estrutura HTML
2. Verifique se os seletores estão corretos
3. Tire screenshots durante a execução

### "Bad Request" não some

**Causa**: O refresh não está funcionando

**Solução**: Aumente o delay após o reload:
```javascript
await page.reload({ waitUntil: 'networkidle2' });
await delay(5000); // Aumentar este valor
```

## Logs e Debug

### Modo Verbose

Os scripts usam `console.error` para logs e `console.log` para dados.

Para ver apenas dados (JSON):
```bash
node server/scripts/pje-tj/tjmg/1g/acervo/raspar-acervo-geral.js 2>/dev/null
```

Para ver apenas logs:
```bash
node server/scripts/pje-tj/tjmg/1g/acervo/raspar-acervo-geral.js > /dev/null
```

### Screenshots de Debug

Para habilitar screenshots durante execução, mude `headless: false` no código.

## Performance

### Tempo Esperado

- Login: ~10-15 segundos
- Navegação até Acervo: ~10 segundos
- Por região (com 100 processos): ~30-60 segundos
- **Total (35 regiões, 500 processos)**: ~30-60 minutos

### Otimizações

O script já implementa:
- ✅ Navegação sequencial (necessária)
- ✅ Delays mínimos entre ações
- ✅ Extração em lote (página inteira)
- ✅ Paginação automática

**NÃO é possível paralelizar** pois é necessário navegar sequencialmente.

## Integração com o Sistema

Para integrar com o sistema principal de scraping, veja:
- `lib/services/scrape-executor.ts` - Executor principal
- `lib/api/pje-adapter.ts` - Adaptador PJE

Os dados no formato JSON do stdout podem ser consumidos diretamente pelo sistema.

## Contato

Para problemas ou dúvidas sobre estes scripts, consulte:
- Documentação geral: `docs/SCRAPING-TROUBLESHOOTING.md`
- Issues: GitHub do projeto
