# TRT3 - Tribunal Regional do Trabalho da 3ª Região

Scripts de raspagem para o TRT3 (Minas Gerais).

## 🏛️ Sobre o TRT3

- **Região**: 3ª Região (Minas Gerais)
- **URL**: https://portal.trt3.jus.br/
- **PJE URL**: https://pje.trt3.jus.br/

## 📂 Estrutura

```
trt3/
└── 1g/                      # Primeiro Grau
    ├── pendentes/           # Processos Pendentes de Manifestação
    │   ├── raspar-no-prazo-dada-ciencia.js
    │   └── raspar-sem-prazo.js
    ├── pauta/               # Minha Pauta (Audiências)
    │   └── raspar-minha-pauta.js
    ├── acervo/              # Acervo Geral
    ├── arquivados/          # Processos Arquivados
    └── utils/               # Utilitários
        ├── verificar-pdfs.js
        └── verificar-sem-prazo.js
```

## 🚀 Scripts Disponíveis

### Pendentes de Manifestação

#### 1. No Prazo + Dada Ciência
```bash
node scripts/pje-trt/trt3/1g/pendentes/raspar-no-prazo-dada-ciencia.js
```

**Funcionalidades:**
- ✅ Busca processos no prazo + com ciência dada
- ✅ Download automático de PDFs
- ✅ Enriquecimento com processo relacionado
- ✅ Metadados do documento

**Filtros:**
- `N` = No prazo
- `C` = Dada ciência

**Saída:**
- JSON: `data/pje/trt3/1g/pendentes/pend-N-C-{timestamp}.json`
- PDFs: `data/pje/trt3/1g/pendentes/pdfs/*.pdf`

#### 2. Sem Prazo
```bash
node scripts/pje-trt/trt3/1g/pendentes/raspar-sem-prazo.js
```

**Funcionalidades:**
- ✅ Busca processos sem prazo (intimação)
- ✅ Download automático de PDFs
- ✅ Enriquecimento com processo relacionado

**Filtros:**
- `I` = Sem prazo (Intimação)

**Saída:**
- JSON: `data/pje/trt3/1g/pendentes/pend-I-{timestamp}.json`
- PDFs: `data/pje/trt3/1g/pendentes/pdfs/*.pdf`

### Minha Pauta (Audiências)

```bash
node scripts/pje-trt/trt3/1g/pauta/raspar-minha-pauta.js
```

**Funcionalidades:**
- ✅ Busca audiências/sessões agendadas
- ✅ Período: 1 ano (hoje + 365 dias)
- ✅ Link de videoconferência (quando disponível)
- ✅ Geração automática de arquivos .ics (Google Calendar)

**Saída:**
- JSON: `data/pje/trt3/1g/pauta/pauta-{timestamp}.json`
- ICS: `data/pje/trt3/1g/pauta/ics/audiencia-{id}.ics`

**Campos especiais:**
- `urlAudienciaVirtual`: Link do Zoom/videoconferência
- `arquivoICS`: Caminho do arquivo .ics gerado

## ⚙️ Configuração

### Credenciais

Edite os scripts e atualize:

```javascript
const CPF = 'seu_cpf';
const SENHA = 'sua_senha';
```

### URLs do PJE TRT3

- **Login**: `https://pje.trt3.jus.br/primeirograu/login.seam`
- **Portal KZ**: `https://pje.trt3.jus.br/pjekz/`
- **API**: `https://pje.trt3.jus.br/pje-comum-api/api/`

## 📊 Estatísticas de Uso

### Exemplo de Resultados Típicos

**Pendentes de Manifestação:**
- No Prazo + Dada Ciência: ~100 processos
- Sem Prazo: ~7 processos

**Minha Pauta:**
- ~60 audiências por ano

## 🔧 Utilitários

### verificar-pdfs.js
Valida que todos os PDFs foram baixados corretamente.

```bash
node scripts/pje-trt/trt3/1g/utils/verificar-pdfs.js
```

### verificar-sem-prazo.js
Verifica a integridade dos dados de processos sem prazo.

```bash
node scripts/pje-trt/trt3/1g/utils/verificar-sem-prazo.js
```

## 🎯 Filtros Disponíveis

| Código | Descrição |
|--------|-----------|
| `N` | No prazo |
| `V` | Vencido |
| `C` | Dada ciência |
| `S` | Sem ciência |
| `I` | Sem prazo (Intimação) |

## 📝 Formato dos Dados

### Processo Pendente

```json
{
  "numeroProcesso": "0010474-87.2025.5.03.0020",
  "nomeParteAutora": "Nome do Autor",
  "urlDocumento": "https://pje.trt3.jus.br/...",
  "pdfLocal": "data/pje/trt3/1g/pendentes/pdfs/...",
  "processoRelacionado": {
    "numero": "0010474-87.2025.5.03.0020",
    "assunto": "Assunto Principal"
  },
  "documentoMetadados": {
    "titulo": "Intimação",
    "tipo": "Intimação",
    "nomeArquivo": "1º Grau-231990951.pdf",
    "tamanho": 58941
  }
}
```

### Audiência (Pauta)

```json
{
  "id": 5388073,
  "nrProcesso": "0010914-13.2025.5.03.0108",
  "dataInicio": "2025-11-04T08:20:00",
  "dataFim": "2025-11-04T08:21:00",
  "urlAudienciaVirtual": "https://trt3-jus-br.zoom.us/my/varabh29",
  "arquivoICS": "data/pje/trt3/1g/pauta/ics/audiencia-5388073.ics",
  "tipo": {
    "descricao": "Conciliação em Conhecimento por videoconferência"
  },
  "salaAudiencia": {
    "nome": "- Sala Principal - 29ª VT"
  },
  "processo": {
    "numero": "0010914-13.2025.5.03.0108",
    "orgaoJulgador": {
      "descricao": "29ª VARA DO TRABALHO DE BELO HORIZONTE"
    }
  },
  "poloAtivo": {
    "nome": "MARCO ANTONIO RODRIGUES"
  },
  "poloPassivo": {
    "nome": "CONSTRUPOWER ENGENHARIA LTDA"
  }
}
```

## 🛡️ Segurança

- Scripts usam `puppeteer-extra-plugin-stealth`
- Delays entre requisições para evitar sobrecarga
- Tratamento de erros e timeouts

## 📚 APIs Utilizadas

### Pendentes de Manifestação
`GET /pje-comum-api/api/paineladvogado/{id}/processos`

### Minha Pauta
`GET /pje-comum-api/api/pauta-usuarios-externos`

### Download de PDF
`GET /pje-comum-api/api/processos/id/{idProcesso}/documentos/id/{idDocumento}/conteudo`

## 🔄 Próximas Implementações

- [ ] 2º Grau (TRT3)
- [ ] Recursos
- [ ] Execução
- [ ] Cálculos

## 📞 Suporte

Em caso de dúvidas ou problemas, consulte:
- [Portal TRT3](https://portal.trt3.jus.br/)
- [Suporte PJE](https://www.pje.jus.br/wiki/)
