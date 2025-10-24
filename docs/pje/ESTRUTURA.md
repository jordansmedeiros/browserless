# 📂 Estrutura do Projeto PJE

## ✅ Estrutura Organizada (ATUAL)

```
browserless/
│
├── 📄 README-PJE.md                    # Documentação principal (ponto de entrada)
│
├── 📁 scripts/pje/                     # Scripts de automação
│   ├── login.js                        # ✅ Script principal VALIDADO
│   ├── test-detection.js               # Teste de anti-detecção
│   └── README.md                       # Documentação completa e detalhada
│
├── 📁 docs/pje/                        # Documentação técnica
│   ├── ANTI-BOT-DETECTION.md          # Guia de técnicas anti-detecção
│   └── ESTRUTURA.md                    # Este arquivo
│
└── 📁 screenshots/                     # Evidências e resultados
    └── pje-login-success.png           # Screenshot do login bem-sucedido
```

---

## ❌ Estrutura Anterior (REMOVIDA)

Arquivos obsoletos que foram removidos da raiz:

```
browserless/
├── ❌ login-pje-stealth.js             # Versão antiga (não funcionou no debugger)
├── ❌ login-pje-playwright.js          # Alternativa com Playwright (não validada)
├── ❌ login-pje-debugger.js            # Para debugger (preview ficava em branco)
├── ❌ login-pje-local-visual.js        # Versão intermediária (sem botão PDPJ)
├── ❌ login-pje-visual-correto.js      # Versão intermediária (HTTP 400)
├── ❌ login-pje-completo.js            # ✅ MOVIDO para scripts/pje/login.js
├── ❌ test-anti-detection.js           # ✅ MOVIDO para scripts/pje/test-detection.js
│
├── ❌ README-PJE-LOGIN.md              # ✅ MOVIDO para scripts/pje/README.md
├── ❌ ANTI-BOT-DETECTION.md            # ✅ MOVIDO para docs/pje/
├── ❌ COMO-USAR-DEBUGGER.md            # Obsoleto (debugger não funciona)
├── ❌ RESUMO-TESTES.md                 # Obsoleto (info incluída no novo README)
│
├── ❌ install-anti-bot.bat             # Obsoleto (instruções no README)
│
└── 📁 screenshots (raiz)
    ├── ❌ test-anti-detection-result.png
    ├── ❌ test-pje-access.png
    ├── ❌ login-pje-resultado.png
    ├── ❌ login-pje-erro-correto.png
    └── ❌ login-pje-completo-resultado.png  # ✅ MOVIDO para screenshots/pje-login-success.png
```

---

## 🎯 Benefícios da Nova Estrutura

### 1. **Organização Clara**
- Scripts em `scripts/pje/`
- Documentação em `docs/pje/`
- Screenshots em `screenshots/`
- Raiz limpa e organizada

### 2. **Único Ponto de Entrada**
- `README-PJE.md` na raiz aponta para tudo
- Não há confusão sobre qual arquivo usar

### 3. **Versionamento Simplificado**
- Apenas 1 script principal: `scripts/pje/login.js`
- Não há mais 5-6 versões diferentes
- Histórico claro no changelog

### 4. **Manutenção Facilitada**
- Todas as alterações em um único arquivo
- Documentação centralizada
- Screenshots organizados

### 5. **Escalável**
- Estrutura preparada para novos scripts
- Fácil adicionar `scripts/pje/consulta-processos.js`
- Padrão replicável para outros tribunais

---

## 📋 Mapeamento de Arquivos

### O que foi mantido:

| Arquivo Antigo | Novo Local | Status |
|----------------|------------|--------|
| `login-pje-completo.js` | `scripts/pje/login.js` | ✅ Renomeado e movido |
| `test-anti-detection.js` | `scripts/pje/test-detection.js` | ✅ Movido |
| `README-PJE-LOGIN.md` | `scripts/pje/README.md` | ✅ Atualizado e movido |
| `ANTI-BOT-DETECTION.md` | `docs/pje/ANTI-BOT-DETECTION.md` | ✅ Movido |
| `login-pje-completo-resultado.png` | `screenshots/pje-login-success.png` | ✅ Renomeado e movido |

### O que foi removido:

| Arquivo | Motivo |
|---------|--------|
| `login-pje-stealth.js` | Não funcionou (export default incompatível) |
| `login-pje-playwright.js` | Não validado |
| `login-pje-debugger.js` | Preview ficava em branco |
| `login-pje-local-visual.js` | Não clicava no botão PDPJ |
| `login-pje-visual-correto.js` | Dava HTTP 400 (state hardcoded) |
| `COMO-USAR-DEBUGGER.md` | Debugger não funciona bem |
| `RESUMO-TESTES.md` | Info consolidada no novo README |
| `install-anti-bot.bat` | Instruções incluídas no README |
| Screenshots antigos | Mantido apenas o final (sucesso) |

---

## 🚀 Como Usar a Nova Estrutura

### Para usuários finais:

1. Leia: [README-PJE.md](../../README-PJE.md) na raiz
2. Execute: `node scripts/pje/login.js`
3. Veja: Screenshot em `screenshots/pje-login-success.png`

### Para desenvolvedores:

1. Leia: [scripts/pje/README.md](../scripts/pje/README.md) para documentação completa
2. Leia: [ANTI-BOT-DETECTION.md](ANTI-BOT-DETECTION.md) para técnicas avançadas
3. Teste: `node scripts/pje/test-detection.js`
4. Modifique: Apenas `scripts/pje/login.js`

### Para adicionar novos scripts:

```bash
# Criar novo script
touch scripts/pje/consulta-processos.js

# Adicionar documentação
echo "# Consulta de Processos" >> scripts/pje/README.md

# Adicionar screenshot de evidência
mv resultado.png screenshots/pje-consulta-success.png
```

---

## 📊 Estatísticas

### Antes da Limpeza:
- **11 arquivos** relacionados ao PJE na raiz
- **6 versões diferentes** do script de login
- **5 screenshots** espalhados
- **4 arquivos de documentação** duplicados

### Depois da Limpeza:
- **1 arquivo** na raiz (README-PJE.md)
- **1 script principal** (scripts/pje/login.js)
- **1 screenshot** de evidência (screenshots/pje-login-success.png)
- **2 arquivos de documentação** organizados (scripts/pje/README.md + docs/pje/ANTI-BOT-DETECTION.md)

**Redução**: De 20+ arquivos para 5 arquivos organizados (75% de redução)

---

## 🔄 Migração para Usuários Existentes

Se você estava usando os scripts antigos:

### Antes:
```bash
node login-pje-completo.js
```

### Agora:
```bash
node scripts/pje/login.js
```

**Nota**: O código é EXATAMENTE o mesmo, apenas mudou de lugar.

---

## 📝 Padrão de Nomenclatura

### Arquivos principais:
- `login.js` - Script principal de funcionalidade
- `test-*.js` - Scripts de teste
- `README.md` - Documentação do módulo

### Documentação técnica:
- `ANTI-BOT-DETECTION.md` - Guias técnicos em MAIÚSCULAS
- `ESTRUTURA.md` - Documentação de estrutura
- `CHANGELOG.md` - Histórico de mudanças

### Screenshots:
- `pje-{funcionalidade}-{status}.png`
- Exemplo: `pje-login-success.png`, `pje-consulta-error.png`

---

## 🎯 Próximos Passos

### Possíveis adições futuras:

```
scripts/pje/
├── login.js                    # ✅ Implementado
├── test-detection.js           # ✅ Implementado
├── consulta-processos.js       # 📝 TODO
├── enviar-peticao.js           # 📝 TODO
└── acompanhar-movimentacao.js  # 📝 TODO

docs/pje/
├── ANTI-BOT-DETECTION.md       # ✅ Implementado
├── ESTRUTURA.md                # ✅ Implementado
├── API.md                      # 📝 TODO
└── TROUBLESHOOTING.md          # 📝 TODO
```

---

**Última atualização**: 24 de Outubro de 2025
**Versão da estrutura**: 1.0.0
