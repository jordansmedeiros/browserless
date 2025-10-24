# 📡 APIs do PJE TRT3

Documentação completa das APIs descobertas durante a raspagem de dados do PJE.

## 🔐 Autenticação

O PJE usa autenticação via SSO (Single Sign-On) com cookies de sessão.

**Fluxo de Login:**
1. Acesso: `https://pje.trt3.jus.br/primeirograu/login.seam`
2. Clique em "Entrar com PDPJ" (#btnSsoPdpj)
3. Redirecionamento para SSO: `https://sso.cloud.pje.jus.br/auth/realms/pje/...`
4. Preenchimento de CPF e senha
5. Redirecionamento de volta para PJE com cookies de sessão

---

## 📊 APIs Principais

### 1. Totalizadores do Painel

Retorna a contagem de processos por categoria.

**Endpoint:**
```
GET /pje-comum-api/api/paineladvogado/{idAdvogado}/totalizadores?tipoPainelAdvogado=0
```

**Parâmetros:**
- `idAdvogado`: ID do perfil do advogado (obtido da API de perfis)
- `tipoPainelAdvogado`: Tipo do painel (0 = padrão)

**Resposta:**
```json
[
  {
    "quantidadeProcessos": 1279,
    "idAgrupamentoProcessoTarefa": 1,
    "nomeAgrupamentoTarefa": "Acervo Geral",
    "ordem": 1,
    "destaque": false
  },
  {
    "quantidadeProcessos": 107,
    "idAgrupamentoProcessoTarefa": 2,
    "nomeAgrupamentoTarefa": "Pendentes de Manifestação",
    "ordem": 2,
    "destaque": false
  },
  {
    "quantidadeProcessos": 8769,
    "idAgrupamentoProcessoTarefa": 5,
    "nomeAgrupamentoTarefa": "Arquivados",
    "ordem": 3,
    "destaque": false
  }
]
```

---

### 2. Lista de Processos (Paginada)

Retorna lista paginada de processos de um agrupamento específico.

**Endpoint:**
```
GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos
    ?idAgrupamentoProcessoTarefa={idAgrupamento}
    &pagina={numeroPagina}
    &tamanhoPagina={registrosPorPagina}
```

**Parâmetros:**
- `idAdvogado`: ID do perfil do advogado
- `idAgrupamentoProcessoTarefa`: ID do agrupamento
  - `1` = Acervo Geral
  - `2` = Pendentes de Manifestação
  - `5` = Arquivados
- `pagina`: Número da página (começa em 1)
- `tamanhoPagina`: Registros por página (máximo: 100)

**Resposta:**
```json
{
  "pagina": 1,
  "tamanhoPagina": 100,
  "qtdPaginas": 13,
  "totalRegistros": 1279,
  "resultado": [
    {
      "id": 2887163,
      "descricaoOrgaoJulgador": "22ª VARA DO TRABALHO DE BELO HORIZONTE",
      "classeJudicial": "ATOrd",
      "numero": 10014,
      "numeroProcesso": "0010014-94.2025.5.03.0022",
      "segredoDeJustica": false,
      "codigoStatusProcesso": "DISTRIBUIDO",
      "prioridadeProcessual": 8,
      "nomeParteAutora": "DRIELLE TAMARA RAMOS DE OLIVEIRA PIRES",
      "qtdeParteAutora": 1,
      "nomeParteRe": "TIM S A",
      "qtdeParteRe": 1,
      "dataAutuacao": "2025-01-10T13:03:15.862",
      "juizoDigital": true,
      "dataArquivamento": "2025-07-11T11:12:15.261",
      "dataProximaAudiencia": null,
      "temAssociacao": false
    }
  ]
}
```

**Campos do Processo:**
- `id`: ID interno do processo
- `numeroProcesso`: Número oficial (formato CNJ)
- `classeJudicial`: Classe processual (ATOrd, ATSum, etc.)
- `descricaoOrgaoJulgador`: Vara responsável
- `codigoStatusProcesso`: Status atual
- `segredoDeJustica`: Boolean se processo é sigiloso
- `prioridadeProcessual`: Nível de prioridade
- `nomeParteAutora`: Nome do(s) autor(es)
- `nomeParteRe`: Nome do(s) réu(s)
- `qtdeParteAutora`: Quantidade de autores
- `qtdeParteRe`: Quantidade de réus
- `dataAutuacao`: Data de distribuição
- `dataArquivamento`: Data de arquivamento (se arquivado)
- `dataProximaAudiencia`: Data da próxima audiência (se houver)
- `juizoDigital`: Boolean se é juízo digital
- `temAssociacao`: Boolean se há associação

---

### 3. Perfis do Usuário

Retorna os perfis disponíveis para o usuário logado.

**Endpoint:**
```
GET /pje-seguranca/api/token/perfis
```

**Resposta:**
```json
[
  {
    "idPerfil": 29203,
    "papel": "Advogado",
    "identificadorPapel": "ADVOGADO",
    "identificadorPapelLegado": "ADVOGADO",
    "localizacao": "PEDRO ZATTAR EUGENIO (075.292.946-10)",
    "acessoKz": true,
    "favorito": false
  }
]
```

**Uso:**
- Obtenha o `idPerfil` para usar como `idAdvogado` nas outras APIs

---

### 4. Parâmetros do Sistema

Retorna configurações e parâmetros do sistema.

**Endpoint:**
```
GET /pje-comum-api/api/parametros/{nomeParametro}?opcional={boolean}
```

**Exemplos:**
```
/pje-comum-api/api/parametros/PARAMETRO_QTDE_REGISTROS_PAGINA?opcional=false
/pje-comum-api/api/parametros/sistema/producao
/pje-comum-api/api/parametros/PARAMETRO_HABILITA_MODULO_EXEPJEKZ?opcional=false
```

---

### 5. Quadro de Avisos

Retorna avisos para o usuário.

**Endpoint:**
```
GET /pje-comum-api/api/quadroavisos/
    ?pagina={n}
    &tamanhoPagina={size}
    &exibirApenasAvisosNaoLidos={boolean}
```

---

### 6. Permissões e Recursos

Retorna recursos e permissões do usuário.

**Endpoint:**
```
GET /pje-seguranca/api/token/permissoes/recursos
GET /pje-seguranca/api/token/permissoes/recursos?tipo=HOME
```

---

## 🔄 Fluxo Completo de Raspagem

```
1. Login no PJE
   └─> Obter cookies de sessão

2. GET /pje-seguranca/api/token/perfis
   └─> Extrair idPerfil (idAdvogado)

3. GET /pje-comum-api/api/paineladvogado/{idAdvogado}/totalizadores
   └─> Obter quantidades por categoria

4. Para cada categoria (Acervo Geral, Pendentes, Arquivados):

   a. Inicializar: pagina = 1

   b. GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos
           ?idAgrupamentoProcessoTarefa={id}
           &pagina={pagina}
           &tamanhoPagina=100

   c. Processar resultado

   d. Se pagina < qtdPaginas:
      - pagina++
      - Voltar para (b)

   e. Salvar todos os processos em arquivo JSON

5. Gerar relatório final
```

---

## 📊 Agrupamentos Descobertos

| ID | Nome | Descrição |
|----|------|-----------|
| 1 | Acervo Geral | Todos os processos ativos |
| 2 | Pendentes de Manifestação | Processos aguardando manifestação |
| 5 | Arquivados | Processos arquivados |

---

## 🔒 Segurança

**Headers Necessários:**
- `Cookie`: Cookies de sessão obtidos após login
- `User-Agent`: User-Agent realista
- `Accept`: `application/json`

**Proteções:**
- CloudFront (anti-bot)
- Rate limiting (evite muitas requisições simultâneas)
- Timeout de sessão (re-login necessário após período de inatividade)

---

## ⚙️ Limites e Boas Práticas

**Paginação:**
- Tamanho máximo de página: 100 registros
- Sempre use paginação para grandes volumes

**Rate Limiting:**
- Adicione delay entre requisições (500ms recomendado)
- Não faça mais de 2 requisições por segundo

**Timeouts:**
- Sessão expira após ~30 minutos de inatividade
- Implemente re-login automático se necessário

---

## 📝 Exemplos de Uso

### Buscar Todos os Pendentes

```javascript
const idAdvogado = 29203;
const idPendentes = 2;
let todosProcessos = [];
let pagina = 1;

// Primeira página para saber total
const primeira = await fetch(
  `/pje-comum-api/api/paineladvogado/${idAdvogado}/processos?idAgrupamentoProcessoTarefa=${idPendentes}&pagina=1&tamanhoPagina=100`
);
const dados = await primeira.json();

todosProcessos.push(...dados.resultado);

// Buscar páginas restantes
for (let p = 2; p <= dados.qtdPaginas; p++) {
  await delay(500); // Rate limiting

  const response = await fetch(
    `/pje-comum-api/api/paineladvogado/${idAdvogado}/processos?idAgrupamentoProcessoTarefa=${idPendentes}&pagina=${p}&tamanhoPagina=100`
  );
  const page = await response.json();

  todosProcessos.push(...page.resultado);
}

console.log(`Total: ${todosProcessos.length} processos`);
```

---

## 🐛 Troubleshooting

### Erro 401 Unauthorized
- Sessão expirou
- Faça login novamente

### Erro 403 Forbidden
- CloudFront detectou bot
- Use anti-detecção (Stealth Plugin)
- Adicione delays entre requisições

### Erro 429 Too Many Requests
- Rate limit excedido
- Aumente delays entre requisições
- Aguarde alguns minutos

### Dados vazios ou incompletos
- Verifique se `idAgrupamentoProcessoTarefa` está correto
- Confirme se há processos naquela categoria
- Verifique se a página solicitada existe

---

## 📚 Referências

- Base URL: `https://pje.trt3.jus.br`
- API Base: `/pje-comum-api/api`
- Segurança: `/pje-seguranca/api`
- Frontend: `/pjekz` (Angular application)

---

**Última atualização**: 24 de Outubro de 2025
**Versão da API**: PJE 2.15.2 - COPAÍBA
**Tribunal**: TRT3 (Tribunal Regional do Trabalho da 3ª Região)
