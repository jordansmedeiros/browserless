# PJE - Tribunais de Justiça (TJ)

Scripts de raspagem para o Processo Judicial Eletrônico (PJE) dos Tribunais de Justiça estaduais.

## 🚧 Em Desenvolvimento

Esta seção está preparada para implementação futura de scrapers para os Tribunais de Justiça.

## 📂 Estrutura Planejada

```
pje-tj/
├── tjmg/                    # Tribunal de Justiça de Minas Gerais
│   └── 1g/                  # Primeiro Grau
│       ├── pendentes/       # Processos Pendentes
│       ├── pauta/           # Audiências
│       └── acervo/          # Acervo Geral
├── tjsp/                    # Tribunal de Justiça de São Paulo
├── tjrj/                    # Tribunal de Justiça do Rio de Janeiro
├── common/                  # Scripts compartilhados
└── README.md               # Este arquivo
```

## 🎯 Próximos Passos

1. Identificar estrutura da API do PJE-TJ
2. Adaptar scripts existentes do pje-trt
3. Implementar scrapers por estado
4. Documentar peculiaridades de cada TJ

## 📚 Referências

- [CNJ - Conselho Nacional de Justiça](https://www.cnj.jus.br/)
- [PJE - Documentação Oficial](https://www.pje.jus.br/)

## 💡 Contribuindo

Se você deseja contribuir com scrapers para TJs específicos, siga o padrão estabelecido em `pje-trt/` como referência.
