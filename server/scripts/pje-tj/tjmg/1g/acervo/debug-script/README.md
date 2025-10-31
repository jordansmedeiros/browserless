# Debug Script - TJMG Acervo Geral

Este é um script de debug para investigar problemas no login do TJMG.

## ⚠️ IMPORTANTE

- Este arquivo contém credenciais hardcoded
- Está no `.gitignore` - **NÃO será commitado**
- Use apenas para debug local

## Como Usar

### 1. Edite as Credenciais

Abra o arquivo `raspar-acervo-geral-debug.js` e substitua:

```javascript
const CPF = '12345678900'; // SUBSTITUA
const SENHA = 'sua_senha_aqui'; // SUBSTITUA
```

### 2. Execute o Script

```bash
node server/scripts/pje-tj/tjmg/1g/acervo/debug-script/raspar-acervo-geral-debug.js
```

### 3. Analise os Arquivos de Debug

O script cria a pasta `debug-tjmg/` na raiz do projeto com:

- **Screenshots numerados**: Cada etapa do processo
- **Arquivos HTML**: HTML completo da página em caso de erro
- **Cookies JSON**: Cookies salvos antes do refresh
- **Stack trace**: Em caso de erro fatal

### 4. Navegador Visível

O script abre um navegador Chrome visível para você acompanhar o processo em tempo real.

## Características de Debug

✅ **Headless: false** - Navegador visível  
✅ **Perfil Chrome persistente** - Cookies salvos automaticamente  
✅ **Screenshots automáticos** após cada ação  
✅ **Logs verbose** de todos os passos  
✅ **Análise de elementos** na página  
✅ **Salvamento de HTML** em caso de erro  
✅ **Cookies exportados** para análise  
✅ **Verificação de cookies** após cada etapa importante

### 🔧 Configuração de Cookies

O script usa um **perfil Chrome persistente** (`debug-tjmg/chrome-profile`) que:
- Mantém cookies entre execuções
- Habilita sessões de login persistente
- Resolve problemas de "sessão sem usuário"  

## O Que o Script Faz

1. Faz login no SSO
2. Aguarda Bad Request
3. Faz refresh
4. Verifica elementos de navegação
5. Navega para Acervo
6. Aguarda sidebar de regiões

Se qualquer passo falhar, arquivos de debug são salvos automaticamente.

