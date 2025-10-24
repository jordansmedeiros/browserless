# 🔍 Raspagem de Processos do PJE

Sistema completo de raspagem de dados do PJE TRT3.

## ✅ Status: FUNCIONANDO

**Testado em**: 24/10/2025
- ✅ APIs descobertas e documentadas
- ✅ Login funcionando
- ✅ Raspagem de processos validada
- ✅ 1279 processos capturados com sucesso

---

## 🚀 Scripts Disponíveis

### 1. login.js - Login Básico
Login no PJE com anti-detecção.

```bash
node scripts/pje/login.js
```

### 2. capturar-api.js - Captura de APIs
Intercepta e salva todas as chamadas de API.

```bash
node scripts/pje/capturar-api.js
```

### 3. raspar-processos.js - Raspagem Simples ⭐
**RECOMENDADO** para primeiro teste.

```bash
node scripts/pje/raspar-processos.js
```

**O que faz**:
- Login no PJE
- Busca primeirapágina de processos
- Salva em `data/pje/processos/processos-pendentes.json`

### 4. raspar-todos-processos.js - Raspagem Completa
Busca TODAS as páginas de TODAS as categorias.

```bash
node scripts/pje/raspar-todos-processos.js
```

**O que faz**:
- Acervo Geral (todas as páginas)
- Pendentes de Manifestação (todas as páginas)
- Arquivados (todas as páginas)
- Gera relatório completo

---

## 📊 Resultados Obtidos

### Estrutura de Arquivos Gerados:

```
data/pje/
├── processos/
│   ├── totalizadores.json              # Contagens por categoria
│   ├── processos-pendentes.json        # Lista de processos
│   ├── acervo_geral.json               # Todos do acervo
│   ├── pendentes_manifestacao.json     # Pendentes
│   ├── arquivados.json                 # Arquivados
│   └── relatorio.json                  # Relatório final
│
└── api-*.json                          # APIs capturadas
```

### Exemplo de Processo:

```json
{
  "id": 2887163,
  "numeroProcesso": "0010014-94.2025.5.03.0022",
  "classeJudicial": "ATOrd",
  "descricaoOrgaoJulgador": "22ª VARA DO TRABALHO DE BELO HORIZONTE",
  "codigoStatusProcesso": "DISTRIBUIDO",
  "nomeParteAutora": "DRIELLE TAMARA RAMOS DE OLIVEIRA PIRES",
  "nomeParteRe": "TIM S A",
  "dataAutuacao": "2025-01-10T13:03:15.862",
  "dataArquivamento": "2025-07-11T11:12:15.261",
  "segredoDeJustica": false,
  "juizoDigital": true
}
```

---

## 🔑 APIs Descobertas

Consulte [docs/pje/APIs.md](../../docs/pje/APIs.md) para documentação completa.

### API Principal:

```
GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos
    ?idAgrupamentoProcessoTarefa={id}
    &pagina={n}
    &tamanhoPagina={size}
```

**IDs dos Agrupamentos**:
- `1` = Acervo Geral
- `2` = Pendentes de Manifestação
- `5` = Arquivados

---

## ⚙️ Configuração

### 1. Instalar Dependências

Já instalado durante o projeto:
```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

### 2. Atualizar Credenciais

Edite o script desejado e atualize:
```javascript
const CPF = '07529294610';     // ← Seu CPF
const SENHA = '12345678A@';    // ← Sua senha
```

### 3. Executar

```bash
node scripts/pje/raspar-processos.js
```

---

## 📈 Fluxo de Raspagem

```
1. Login no PJE
   ├─> Clica em "Entrar com PDPJ"
   ├─> Preenche CPF e senha
   └─> Obtém cookies de sessão

2. Obtém ID do advogado
   └─> GET /pje-seguranca/api/token/perfis

3. Busca totalizadores
   └─> GET /pje-comum-api/api/paineladvogado/{id}/totalizadores

4. Para cada categoria:
   ├─> Página 1 (descobre total de páginas)
   ├─> Páginas 2...N (loop)
   └─> Salva todos em JSON

5. Gera relatório final
```

---

## 🎯 Dados Capturados

### Por Processo:

- ✅ Número do processo (CNJ)
- ✅ Classe judicial
- ✅ Órgão julgador (Vara)
- ✅ Status do processo
- ✅ Partes (autor e réu)
- ✅ Datas (autuação, arquivamento, audiências)
- ✅ Segredo de justiça
- ✅ Prioridade
- ✅ Juízo digital

### Metadados:

- Total de processos por categoria
- Total de páginas
- Data da raspagem
- ID do advogado

---

## ⚠️ Limitações e Boas Práticas

### Rate Limiting

❌ **NÃO FAÇA**:
```javascript
// Sem delay - vai ser bloqueado!
for (let i = 1; i <= 100; i++) {
  await buscarPagina(i);
}
```

✅ **FAÇA**:
```javascript
// Com delay de 500ms
for (let i = 1; i <= 100; i++) {
  await buscarPagina(i);
  await delay(500); // ← Rate limiting
}
```

### Paginação

- **Máximo por página**: 100 registros
- **Sempre use paginação** para grandes volumes
- **Não tente buscar mais de 100** por vez

### Sessão

- **Timeout**: ~30 minutos de inatividade
- **Re-login**: Necessário após timeout
- **Cookies**: Salvar para reutilização

---

## 🐛 Troubleshooting

### Erro: 0 processos capturados

**Causa**: ID do advogado incorreto

**Solução**:
1. Execute `node scripts/pje/capturar-api.js`
2. Veja no console a URL dos totalizadores
3. Extraia o ID da URL: `/paineladvogado/29203/...`
4. Atualize o ID fixo no script

### Erro: 403 Forbidden

**Causa**: CloudFront detectou bot

**Solução**:
- Use `headless: false` para desenvolvimento
- Adicione delays maiores (1-2 segundos)
- Aguarde alguns minutos entre tentativas

### Erro: 401 Unauthorized

**Causa**: Sessão expirou

**Solução**:
- Execute o script novamente (faz login automaticamente)
- Reduza o tempo entre requisições

---

## 📊 Exemplo de Uso Completo

```bash
# 1. Testar login
node scripts/pje/login.js

# 2. Capturar APIs (primeira vez)
node scripts/pje/capturar-api.js

# 3. Raspar processos (teste)
node scripts/pje/raspar-processos.js

# 4. Ver resultados
cat data/pje/processos/processos-pendentes.json

# 5. Raspagem completa (produção)
node scripts/pje/raspar-todos-processos.js
```

---

## 📚 Documentação Adicional

- **[APIs.md](../../docs/pje/APIs.md)** - Documentação completa das APIs
- **[ANTI-BOT-DETECTION.md](../../docs/pje/ANTI-BOT-DETECTION.md)** - Técnicas anti-detecção
- **[README.md](README.md)** - Documentação do login

---

## 🎉 Resultados Validados

### Teste Real (24/10/2025):

```
✅ Login realizado com sucesso
✅ 28 APIs capturadas
✅ 1279 processos do Acervo Geral
✅ 107 processos Pendentes de Manifestação
✅ 8769 processos Arquivados
✅ Total: 10,155 processos acessíveis
```

**Tempo de execução**:
- Login: ~10 segundos
- Primeira página: ~2 segundos
- Todas as páginas: ~1-2 minutos (depende da quantidade)

---

## 🔄 Próximos Passos

### Melhorias Futuras:

1. **Detalhes do Processo**
   - API para buscar movimentações
   - API para buscar documentos
   - API para buscar partes completas

2. **Automação**
   - Agendar raspagem periódica
   - Detectar novos processos
   - Notificações de alterações

3. **Armazenamento**
   - Salvar em banco de dados
   - Histórico de mudanças
   - Índices de busca

4. **Análise**
   - Estatísticas por vara
   - Tempo médio de processo
   - Análise de reclamadas frequentes

---

**Última atualização**: 24 de Outubro de 2025
**Status**: ✅ Funcionando e validado
**Compatível com**: PJE 2.15.2 - COPAÍBA (TRT3)
