# Refactor PJE Credentials to Environment Variables

## Why

Atualmente, as credenciais de acesso ao PJE (CPF, senha e ID do advogado) estão hardcoded diretamente nos scripts de raspagem, criando riscos de segurança e expondo dados sensíveis no código-fonte. Esta prática viola as melhores práticas de segurança e pode levar ao comprometimento acidental de credenciais através de commits no Git.

## What Changes

- Remover todas as credenciais hardcoded dos scripts PJE (CPF, SENHA, idAdvogado)
- Adicionar variáveis de ambiente `PJE_CPF`, `PJE_SENHA` e `PJE_ID_ADVOGADO` ao arquivo `.env.example`
- Atualizar todos os scripts de raspagem para ler credenciais de variáveis de ambiente
- Documentar o uso das variáveis de ambiente no README
- Verificar e garantir que o `.gitignore` protege arquivos `.env` e dados sensíveis

## Impact

- **Affected specs**:
  - `pje-security` (nova capability)

- **Affected code**:
  - `scripts/pje-trt/common/login.js`
  - `scripts/pje-trt/trt3/1g/acervo/raspar-acervo-geral.js`
  - `scripts/pje-trt/trt3/1g/pauta/raspar-minha-pauta.js`
  - `scripts/pje-trt/trt3/1g/pendentes/raspar-pendentes-sem-prazo.js`
  - `scripts/pje-trt/trt3/1g/pendentes/raspar-pendentes-no-prazo-dada-ciencia.js`
  - `scripts/pje-trt/trt3/1g/arquivados/raspar-arquivados.js`
  - `scripts/_old_pje_reference/raspar-todos-processos.js`
  - `scripts/_old_pje_reference/raspar-processos.js`
  - `.env.example`
  - Documentação relevante

- **Breaking**: Usuários existentes precisarão criar/atualizar seus arquivos `.env` com as credenciais do PJE

## Benefits

- Elimina riscos de vazamento de credenciais no controle de versão
- Facilita o gerenciamento de credenciais em diferentes ambientes (dev, staging, prod)
- Segue as melhores práticas de segurança da indústria (twelve-factor app)
- Permite que diferentes desenvolvedores usem suas próprias credenciais sem modificar código
