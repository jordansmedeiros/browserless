# PJE - Tribunais Regionais do Trabalho (TRT)

Scripts de raspagem para o Processo Judicial Eletrônico (PJE) dos Tribunais Regionais do Trabalho.

## 📂 Estrutura

```
pje-trt/
├── trt3/                    # TRT da 3ª Região (Minas Gerais)
│   └── 1g/                  # Primeiro Grau
│       ├── pendentes/       # Processos Pendentes de Manifestação
│       ├── pauta/           # Minha Pauta (Audiências)
│       ├── acervo/          # Acervo Geral
│       ├── arquivados/      # Processos Arquivados
│       └── utils/           # Utilitários
├── common/                  # Scripts compartilhados
│   └── login.js             # Módulo de login reutilizável
└── README.md               # Este arquivo
```

## 🚀 Scripts Disponíveis

### TRT3 - 1º Grau

#### Pendentes de Manifestação
- **raspar-no-prazo-dada-ciencia.js** - Processos no prazo + com ciência dada
  - Download automático de PDFs
  - Enriquecimento com processo relacionado
  - Salva em: `data/pje/trt3/1g/pendentes/`

- **raspar-sem-prazo.js** - Processos sem prazo (intimação)
  - Download automático de PDFs
  - Salva em: `data/pje/trt3/1g/pendentes/`

#### Minha Pauta
- **raspar-minha-pauta.js** - Audiências/sessões agendadas
  - Período: 1 ano (hoje + 365 dias)
  - Geração automática de arquivos .ics (Google Calendar)
  - Captura link de videoconferência (quando disponível)
  - Salva em: `data/pje/trt3/1g/pauta/`

## ⚙️ Como Usar

### 1. Configurar Credenciais (OBRIGATÓRIO)

**Todas as credenciais agora são lidas de variáveis de ambiente**. Configure o arquivo `.env` antes de executar qualquer script:

```bash
# 1. Copie o arquivo de exemplo (na raiz do projeto)
cp .env.example .env

# 2. Edite o arquivo .env e preencha:
nano .env  # ou use seu editor preferido
```

**Variáveis necessárias no `.env`:**

```bash
# CPF do advogado (apenas números)
PJE_CPF=12345678900

# Senha de acesso ao PJE
PJE_SENHA=sua_senha_aqui

# ID do advogado no sistema PJE
PJE_ID_ADVOGADO=29203
```

**Como descobrir seu `PJE_ID_ADVOGADO`:**

1. Execute o script de login:
   ```bash
   node scripts/pje-trt/common/login.js
   ```

2. Após login bem-sucedido, acesse a API de perfis no navegador aberto:
   ```
   https://pje.trt3.jus.br/pje-seguranca/api/token/perfis
   ```

3. Procure por `idAdvogado` no JSON retornado

**Importante:**
- ⚠️ O arquivo `.env` já está no `.gitignore` - nunca será commitado
- 🔒 Suas credenciais ficam apenas no seu ambiente local
- ✅ Se as variáveis não estiverem configuradas, o script mostrará erro claro

### 2. Executar Scripts

```bash
# Acervo Geral
node scripts/pje-trt/trt3/1g/acervo/raspar-acervo-geral.js

# Pendentes - No Prazo + Dada Ciência
node scripts/pje-trt/trt3/1g/pendentes/raspar-pendentes-no-prazo-dada-ciencia.js

# Pendentes - Sem Prazo
node scripts/pje-trt/trt3/1g/pendentes/raspar-pendentes-sem-prazo.js

# Minha Pauta
node scripts/pje-trt/trt3/1g/pauta/raspar-minha-pauta.js

# Processos Arquivados
node scripts/pje-trt/trt3/1g/arquivados/raspar-arquivados.js

# Login apenas (para testar ou descobrir ID)
node scripts/pje-trt/common/login.js
```

### 3. Verificar Resultados

Os dados são salvos em:
- JSON: `data/pje/trt3/1g/{dominio}/`
- PDFs: `data/pje/trt3/1g/{dominio}/pdfs/`
- ICS: `data/pje/trt3/1g/pauta/ics/`

## 🔧 Troubleshooting

### Erro: "Credenciais PJE não configuradas"

**Problema**: Variáveis de ambiente não foram configuradas.

**Solução**:
```bash
# 1. Verifique se o arquivo .env existe
ls -la .env

# 2. Se não existir, copie do exemplo
cp .env.example .env

# 3. Edite e preencha as variáveis
nano .env
```

### Erro: "PJE_ID_ADVOGADO undefined"

**Problema**: Você não preencheu o ID do advogado.

**Solução**: Siga as instruções em "Como descobrir seu PJE_ID_ADVOGADO" acima.

### Erro 403 - CloudFront bloqueou

**Problema**: Múltiplas tentativas consecutivas ou IP suspeito.

**Solução**: Aguarde 5-10 minutos antes de tentar novamente.

## 📊 Estrutura de Dados

### Processos Pendentes

```json
{
  "numeroProcesso": "0010474-87.2025.5.03.0020",
  "nomeParteAutora": "Nome do Autor",
  "urlDocumento": "https://...",
  "pdfLocal": "data/pje/trt3/1g/pendentes/pdfs/...",
  "processoRelacionado": { ... },
  "documentoMetadados": { ... }
}
```

### Audiências (Minha Pauta)

```json
{
  "id": 5388073,
  "nrProcesso": "0010914-13.2025.5.03.0108",
  "dataInicio": "2025-11-04T08:20:00",
  "dataFim": "2025-11-04T08:21:00",
  "urlAudienciaVirtual": "https://zoom.us/...",
  "arquivoICS": "data/pje/trt3/1g/pauta/ics/audiencia-5388073.ics",
  "tipo": { "descricao": "Conciliação em Conhecimento por videoconferência" },
  "processo": { ... },
  "poloAtivo": { ... },
  "poloPassivo": { ... }
}
```

## 🔧 Utilitários

### verificar-pdfs.js
Verifica a integridade dos PDFs baixados.

### verificar-sem-prazo.js
Verifica os dados capturados dos processos sem prazo.

## 🎯 Próximos TRTs

A estrutura está preparada para adicionar outros TRTs:
- `trt3/` - TRT 3ª Região (MG) ✅
- `trt1/` - TRT 1ª Região (RJ) 🔜
- `trt2/` - TRT 2ª Região (SP) 🔜
- ... e outros

## 📝 Padrões de Nomenclatura

- **Arquivos JSON**: `{agrupador}-{filtros}-{timestamp}.json`
  - Exemplo: `pend-N-C-20251024-182427.json`

- **Arquivos PDF**: `{numeroProcessoSemCaracteres}-{idDocumento}.pdf`
  - Exemplo: `00104748720255030020-231990951.pdf`

- **Arquivos ICS**: `audiencia-{id}.ics`
  - Exemplo: `audiencia-5388073.ics`

## 🛡️ Segurança

### Proteção de Credenciais

✅ **IMPLEMENTADO**: Todas as credenciais são lidas de variáveis de ambiente (`.env`)

- ✅ Arquivo `.env` está no `.gitignore` - nunca será commitado
- ✅ Credenciais não estão mais hardcoded nos scripts
- ✅ Validação automática: scripts falham se credenciais não estiverem configuradas
- ✅ Mensagens de erro claras indicam exatamente o que está faltando

### Anti-Detecção de Bots

- 🛡️ `puppeteer-extra-plugin-stealth` - Oculta marcadores de automação
- 🖱️ Simulação de movimento de mouse humano
- ⌨️ Digitação caractere por caractere com delays aleatórios
- 🌐 Headers realistas (User-Agent Chrome 131)
- 🔒 Navigator.webdriver oculto

### Boas Práticas

- 🔐 **Nunca compartilhe** seu arquivo `.env`
- 📝 **Nunca commite** credenciais no Git
- ⏱️ **Respeite rate limits** - aguarde entre requisições
- 🎯 **Use apenas** para fins autorizados (sua própria conta)

## 📚 Documentação Oficial

- [PJE CNJ](https://www.pje.jus.br/)
- [TRT3](https://portal.trt3.jus.br/)
