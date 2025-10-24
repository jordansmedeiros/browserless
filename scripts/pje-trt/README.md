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

### 1. Configurar Credenciais

Edite o script desejado e atualize as credenciais:

```javascript
const CPF = 'seu_cpf';
const SENHA = 'sua_senha';
```

### 2. Executar Script

```bash
# Pendentes - No Prazo + Dada Ciência
node scripts/pje-trt/trt3/1g/pendentes/raspar-no-prazo-dada-ciencia.js

# Pendentes - Sem Prazo
node scripts/pje-trt/trt3/1g/pendentes/raspar-sem-prazo.js

# Minha Pauta
node scripts/pje-trt/trt3/1g/pauta/raspar-minha-pauta.js
```

### 3. Verificar Resultados

Os dados são salvos em:
- JSON: `data/pje/trt3/1g/{dominio}/`
- PDFs: `data/pje/trt3/1g/{dominio}/pdfs/`
- ICS: `data/pje/trt3/1g/pauta/ics/`

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

- ⚠️ **NUNCA** commite credenciais nos scripts
- Use variáveis de ambiente quando possível
- Os scripts usam `puppeteer-extra-plugin-stealth` para evitar detecção

## 📚 Documentação Oficial

- [PJE CNJ](https://www.pje.jus.br/)
- [TRT3](https://portal.trt3.jus.br/)
