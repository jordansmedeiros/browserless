# Implementation Tasks

## 1. Update Environment Configuration

- [ ] 1.1 Adicionar variáveis `PJE_CPF`, `PJE_SENHA` e `PJE_ID_ADVOGADO` ao `.env.example`
- [ ] 1.2 Adicionar comentários explicativos sobre cada variável
- [ ] 1.3 Verificar que `.gitignore` já protege arquivos `*.env*`

## 2. Refactor PJE Scripts

- [ ] 2.1 Atualizar `scripts/pje-trt/common/login.js` para usar variáveis de ambiente
- [ ] 2.2 Atualizar `scripts/pje-trt/trt3/1g/acervo/raspar-acervo-geral.js`
- [ ] 2.3 Atualizar `scripts/pje-trt/trt3/1g/pauta/raspar-minha-pauta.js`
- [ ] 2.4 Atualizar `scripts/pje-trt/trt3/1g/pendentes/raspar-pendentes-sem-prazo.js`
- [ ] 2.5 Atualizar `scripts/pje-trt/trt3/1g/pendentes/raspar-pendentes-no-prazo-dada-ciencia.js`
- [ ] 2.6 Atualizar `scripts/pje-trt/trt3/1g/arquivados/raspar-arquivados.js`

## 3. Handle Old Reference Scripts

- [ ] 3.1 Decidir se scripts em `_old_pje_reference` devem ser atualizados ou removidos
- [ ] 3.2 Atualizar ou adicionar aviso de descontinuação nos scripts antigos

## 4. Add Validation

- [ ] 4.1 Adicionar validação nos scripts para verificar se variáveis de ambiente estão definidas
- [ ] 4.2 Adicionar mensagens de erro claras quando credenciais não estiverem configuradas

## 5. Documentation

- [ ] 5.1 Atualizar README principal com instruções de configuração das variáveis PJE
- [ ] 5.2 Atualizar `scripts/pje-trt/README.md` com o novo fluxo de configuração
- [ ] 5.3 Adicionar seção de troubleshooting para erros de credenciais ausentes

## 6. Testing

- [ ] 6.1 Testar login com variáveis de ambiente configuradas
- [ ] 6.2 Testar pelo menos um script de raspagem para validar funcionamento
- [ ] 6.3 Verificar comportamento quando variáveis não estão definidas
