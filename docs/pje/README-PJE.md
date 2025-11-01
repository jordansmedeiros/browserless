# 🏛️ Automação PJE - Processo Judicial Eletrônico

Sistema de automação de login no PJE com anti-detecção de bot.

## ✅ Status: FUNCIONANDO

Login testado e validado em **24/10/2025**:
- ✅ CloudFront não detecta como bot
- ✅ Login bem-sucedido
- ✅ Acesso ao painel do usuário

---

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

### 2. Executar

```bash
# Login TRT
node server/scripts/pje-trt/common/login.js

# Login TJMG
node server/scripts/pje-tj/tjmg/common/login.js
```

Veja a [documentação completa TRT](server/scripts/pje-trt/README.md) ou [documentação TJ](server/scripts/pje-tj/README.md) para mais detalhes.

---

## 📁 Estrutura do Projeto

```
browserless/
├── server/scripts/          # ✅ Scripts principais (USE ESTES)
│   ├── pje-trt/             # Scripts TRT (Tribunais Regionais do Trabalho)
│   │   ├── common/
│   │   │   └── login.js     # Script de login (VALIDADO)
│   │   ├── acervo/          # Scripts de acervo geral
│   │   ├── pendentes/       # Scripts de processos pendentes
│   │   ├── arquivados/      # Scripts de processos arquivados
│   │   └── pauta/           # Scripts de pauta/audiências
│   └── pje-tj/              # Scripts TJ (Tribunais de Justiça)
│       ├── tjmg/            # Tribunal de Justiça de Minas Gerais
│       ├── tjce/            # Tribunal de Justiça do Ceará
│       ├── tjdf/            # Tribunal de Justiça do DF
│       └── tjes/            # Tribunal de Justiça do Espírito Santo
│
├── docs/pje/                # Documentação técnica
│   ├── README-PJE.md        # Este arquivo
│   ├── ANTI-BOT-DETECTION.md
│   ├── APIs.md
│   └── ESTRUTURA.md
│
└── screenshots/             # Evidências
    └── pje-login-success.png
```

---

## 🎯 Funcionalidades

### ✅ O que está implementado:

1. **Login Automatizado Completo**
   - Clica no botão "Entrar com PDPJ"
   - Preenche CPF e senha automaticamente
   - Acessa o painel do usuário

2. **Anti-Detecção de Bot**
   - Puppeteer-Extra Stealth Plugin
   - Digitação caractere por caractere (humana)
   - Movimento gradual do mouse
   - Headers realistas do Chrome 131
   - Navigator.webdriver oculto

3. **State OAuth Dinâmico**
   - Não usa state hardcoded
   - Token gerado automaticamente
   - Sem erro HTTP 400

4. **Navegador Visível**
   - Abre Chromium com interface
   - Você vê cada ação em tempo real
   - Fica aberto para inspeção

5. **🧙 Wizard de Configuração de Scraping** *(Novo)*
   - Interface passo-a-passo para configurar scraping
   - **Etapa 1**: Seleção de tribunais com busca e filtros
   - **Etapa 2**: Configuração de tipo de scraping e subtipo
   - Validação em tempo real antes de avançar
   - Sem necessidade de scroll dentro do modal
   - Confirmação ao fechar com alterações não salvas

6. **📟 Monitor de Terminal em Tempo Real** *(Novo)*
   - Acompanhamento de logs de scraping em tempo real via SSE
   - Logs coloridos por nível (info, success, warn, error)
   - Auto-scroll inteligente com controle manual
   - Fallback automático para polling se SSE falhar
   - Reabrir terminal para jobs em andamento
   - Download completo de logs em formato .log
   - Resumo de conclusão com estatísticas

7. **📊 Visualizador de Resultados** *(Novo)*
   - Página dedicada para visualizar resultados de scraping
   - **Visualização em Tabela**:
     - Colunas dinâmicas baseadas nos dados coletados
     - Ordenação por qualquer coluna
     - Busca e filtros em tempo real
     - Paginação configurável (25/50/100/200 itens)
     - Seleção de múltiplos itens
   - **Visualização JSON**:
     - JSON formatado e com highlight
     - Busca dentro do JSON
     - Copiar para clipboard
     - Download do arquivo JSON
   - **Explorador de Arquivos**:
     - Estrutura hierárquica (Tribunal → Processos)
     - Expandir/colapsar nós
     - Filtro por termo de busca
     - Detalhes inline dos processos
   - **Exportação**:
     - Exportar para CSV
     - Exportar para JSON
     - Exportar para Excel (.xls)

---

## 📖 Guias de Uso das Novas Funcionalidades

### 🧙 Como Usar o Wizard de Scraping

1. Acesse a página de scraping: `/scrapes`
2. Clique em **"Novo Scraping"**
3. **Etapa 1 - Selecionar Tribunais**:
   - Use a busca para filtrar tribunais por nome ou código
   - Marque os tribunais desejados
   - Clique em **"Próximo"** (desabilitado se nenhum tribunal selecionado)
4. **Etapa 2 - Configurar Scraping**:
   - Selecione o tipo de scraping (Todos ou Pendentes)
   - Se "Pendentes", selecione os subtipos desejados
   - Revise o resumo da configuração
   - Clique em **"Iniciar Scraping"**
5. O terminal abrirá automaticamente mostrando o progresso

### 📟 Como Usar o Monitor de Terminal

**Durante o Scraping**:
- O terminal abre automaticamente após iniciar um job
- Logs aparecem em tempo real com cores:
  - **Verde**: Sucesso
  - **Vermelho**: Erros
  - **Amarelo**: Avisos
  - **Cinza**: Informações gerais
- Auto-scroll mantém você na última mensagem
- Clique em **"Rolar para baixo"** se desabilitar o auto-scroll

**Reabrir Terminal**:
- Na lista de jobs ativos, clique em **"Visualizar Terminal"**
- Todos os logs anteriores serão carregados
- Streaming continua se o job ainda estiver rodando

**Ao Concluir**:
- Resumo com estatísticas aparece automaticamente
- Download de logs completo disponível no rodapé
- Terminal pode ser fechado (dados permanecem salvos)

### 📊 Como Usar o Visualizador de Resultados

**Acessar Resultados**:
1. Vá para `/scrapes`
2. Clique em **"Ver Detalhes"** em um job concluído
3. Ou acesse diretamente: `/scrapes/[job-id]`

**Visualização em Tabela**:
- Clique em cabeçalhos de coluna para ordenar
- Use a caixa de busca para filtrar processos
- Ajuste itens por página (25/50/100/200)
- Selecione múltiplos itens com checkboxes
- Navegue entre páginas com os controles de paginação

**Visualização JSON**:
- Veja todos os dados em formato JSON estruturado
- Use a busca para encontrar campos específicos
- Clique em **"Copiar JSON"** para clipboard
- Clique em **"Download JSON"** para salvar arquivo

**Explorador de Arquivos**:
- Navegue pela estrutura hierárquica
- Clique em tribunais para expandir/colapsar
- Clique em processos para ver detalhes
- Use **"Expandir Tudo"** / **"Colapsar Tudo"** para controle rápido
- Filtro de busca funciona em toda a árvore

**Exportar Dados**:
- **CSV**: Compatível com Excel, Google Sheets
- **JSON**: Formato estruturado para programação
- **Excel**: Arquivo .xls direto para Microsoft Excel

---

## 📊 Resultado do Teste

**URL de login**: `https://pje.trt3.jus.br/primeirograu/login.seam`

**Fluxo executado**:
```
1. ✅ Página PJE carregada
2. ✅ Botão "Entrar com PDPJ" clicado
3. ✅ Redirecionado para SSO (state dinâmico)
4. ✅ CPF preenchido (digitação humana)
5. ✅ Senha preenchida (digitação humana)
6. ✅ Botão Entrar clicado
7. ✅ Login bem-sucedido
8. ✅ Painel do usuário carregado
```

**URL final**: `https://pje.trt3.jus.br/pjekz/painel/usuario-externo`

**Screenshot**: [pje-login-success.png](screenshots/pje-login-success.png)

---

## 📚 Documentação

- **[server/scripts/pje-trt/README.md](server/scripts/pje-trt/README.md)** - Documentação completa TRT
- **[server/scripts/pje-tj/README.md](server/scripts/pje-tj/README.md)** - Documentação completa TJ
- **[docs/pje/ANTI-BOT-DETECTION.md](ANTI-BOT-DETECTION.md)** - Técnicas de anti-detecção
- **[docs/pje/APIs.md](APIs.md)** - Referência de APIs

---

## 🆘 Suporte

### Problemas Comuns

**Erro 403 (CloudFront)**
- Aguarde 5-10 minutos entre tentativas
- Verifique as credenciais e tente novamente

**Módulo não encontrado**
```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

**Navegador não abre**
```bash
npm install puppeteer
```

### Mais ajuda

Veja a [documentação completa TRT](server/scripts/pje-trt/README.md) ou [documentação TJ](server/scripts/pje-tj/README.md) para mais soluções.

---

## 🔐 Segurança

⚠️ **Importante**:
- Nunca commite credenciais no Git
- Use variáveis de ambiente em produção
- Adicione `.env` no `.gitignore`
- Use apenas para fins autorizados

---

## 📝 Changelog

### v2.0.0 - 26/10/2025
- ✅ Wizard de configuração de scraping com 2 etapas
- ✅ Monitor de terminal em tempo real com SSE
- ✅ Visualizador de resultados com 3 modos de visualização
- ✅ Exportação de dados (CSV, JSON, Excel)
- ✅ Conexão PostgreSQL configurada
- ✅ Sistema de gerenciamento de credenciais completo

### v1.0.0 - 24/10/2025
- ✅ Login funcionando com sucesso
- ✅ Anti-detecção completo
- ✅ Estrutura de projeto organizada
- ✅ Documentação completa

---

**Última atualização**: 30 de Outubro de 2025
**Compatível com**: PJE TRT (todos), TJMG (1º Grau - Acervo), TJ, TRF

## 🆕 Suporte TJMG

O sistema agora suporta raspagem completa do TJMG (Tribunal de Justiça de Minas Gerais):

### Características do TJMG:
- ⚠️ **Sem API REST**: TJMG não fornece API - usa parsing de HTML
- 🗺️ **Múltiplas regiões**: Suporta todas as 35+ regiões/comarcas do TJMG
- 📋 **Campos específicos**:
  - Número do processo
  - Região/Comarca (único do TJMG)
  - Tipo de processo
  - Partes envolvidas
  - Vara
  - Data de distribuição (texto)
  - Último movimento (texto)
  - Texto completo extraído

### Comportamento específico do TJMG:
- Após login SSO, pode aparecer "Bad Request" - o sistema faz refresh automático
- Navegação manual pelos menus (Menu → Painel → Acervo)
- Processos extraídos região por região de forma sequencial
- Campos de data armazenados como texto (não parseados) para maior robustez

### Script disponível:
- [server/scripts/pje-tj/tjmg/1g/acervo/raspar-acervo-geral.js](server/scripts/pje-tj/tjmg/1g/acervo/raspar-acervo-geral.js)
