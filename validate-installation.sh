#!/bin/bash

###############################################################################
# Browserless - Script de Validação de Instalação
#
# Este script verifica se tudo está instalado e configurado corretamente
###############################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0
SUCCESS=0

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           BROWSERLESS - VALIDAÇÃO DE INSTALAÇÃO             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Funções de log
log_check() {
    echo -e "\n${BLUE}[VERIFICANDO]${NC} $1..."
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((SUCCESS++))
}

log_error() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# Verificar Node.js
log_check "Node.js"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

    if [ "$NODE_MAJOR" -eq 24 ]; then
        log_success "Node.js $NODE_VERSION instalado"
    else
        log_warning "Node.js $NODE_VERSION (requerido: v24.x)"
    fi
else
    log_error "Node.js não encontrado"
fi

# Verificar npm
log_check "npm"
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm -v)
    log_success "npm $NPM_VERSION instalado"
else
    log_error "npm não encontrado"
fi

# Verificar Git
log_check "Git"
if command -v git >/dev/null 2>&1; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    log_success "Git $GIT_VERSION instalado"
else
    log_warning "Git não encontrado (opcional)"
fi

# Verificar Docker
log_check "Docker"
if command -v docker >/dev/null 2>&1; then
    if docker ps >/dev/null 2>&1; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
        log_success "Docker $DOCKER_VERSION instalado e rodando"
    else
        log_warning "Docker instalado mas não está rodando"
    fi
else
    log_warning "Docker não encontrado (opcional)"
fi

# Verificar dependências do npm
log_check "Dependências do npm"
if [ -d "node_modules" ]; then
    PACKAGE_COUNT=$(ls -1 node_modules | wc -l)
    log_success "$PACKAGE_COUNT pacotes instalados em node_modules"
else
    log_error "Diretório node_modules não encontrado. Execute: npm install"
fi

# Verificar build
log_check "Build do projeto"
if [ -d "build" ]; then
    BUILD_FILES=$(find build -name "*.js" 2>/dev/null | wc -l)
    if [ "$BUILD_FILES" -gt 0 ]; then
        log_success "$BUILD_FILES arquivos compilados em build/"
    else
        log_warning "Diretório build vazio. Execute: npm run build"
    fi
else
    log_warning "Diretório build não encontrado. Execute: npm run build"
fi

# Verificar navegadores instalados
log_check "Navegadores Playwright"

check_browser() {
    local browser=$1
    local path_pattern=$2

    if find ~/.cache/ms-playwright -name "$path_pattern" 2>/dev/null | grep -q .; then
        log_success "$browser instalado"
        return 0
    else
        log_warning "$browser não encontrado"
        return 1
    fi
}

BROWSERS_FOUND=0

if [ -d ~/.cache/ms-playwright ] || [ -d ~/Library/Caches/ms-playwright ]; then
    check_browser "Chromium" "chrome-*" && ((BROWSERS_FOUND++)) || true
    check_browser "Firefox" "firefox-*" && ((BROWSERS_FOUND++)) || true
    check_browser "WebKit" "webkit-*" && ((BROWSERS_FOUND++)) || true

    if [ $BROWSERS_FOUND -eq 0 ]; then
        log_error "Nenhum navegador encontrado. Execute: npm run install:browsers"
    fi
else
    log_warning "Cache do Playwright não encontrado. Execute: npm run install:browsers"
fi

# Verificar arquivo .env
log_check "Configuração .env"
if [ -f ".env" ]; then
    log_success "Arquivo .env encontrado"

    # Verificar TOKEN
    if grep -q "^TOKEN=" .env; then
        TOKEN=$(grep "^TOKEN=" .env | cut -d'=' -f2)
        if [ "$TOKEN" = "6R0W53R135510" ]; then
            log_warning "TOKEN padrão detectado. Mude para produção!"
        else
            log_success "TOKEN customizado configurado"
        fi
    else
        log_warning "TOKEN não definido em .env"
    fi
else
    log_warning "Arquivo .env não encontrado. Copie .env.dev para .env"
fi

# Verificar diretórios
log_check "Diretórios necessários"
for dir in logs downloads scripts; do
    if [ -d "$dir" ]; then
        log_success "Diretório $dir/ existe"
    else
        log_warning "Diretório $dir/ não encontrado"
    fi
done

# Verificar scripts auxiliares
log_check "Scripts auxiliares"
if [ -d "scripts" ]; then
    SCRIPT_COUNT=$(ls -1 scripts/*.{sh,bat} 2>/dev/null | wc -l)
    if [ "$SCRIPT_COUNT" -gt 0 ]; then
        log_success "$SCRIPT_COUNT scripts auxiliares encontrados"
    else
        log_warning "Nenhum script auxiliar encontrado em scripts/"
    fi
fi

# Verificar documentação criada
log_check "Documentação"
for doc in DEPLOY-LOCAL.md QUICKSTART.md README-DEPLOY.md .env.example; do
    if [ -f "$doc" ]; then
        log_success "$doc existe"
    else
        log_warning "$doc não encontrado"
    fi
done

# Verificar porta 3000
log_check "Porta 3000 (padrão)"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_warning "Porta 3000 já está em uso"
else
    log_success "Porta 3000 disponível"
fi

# Verificar permissões dos scripts
log_check "Permissões de scripts"
for script in setup-browserless.sh docker-start.sh; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            log_success "$script é executável"
        else
            log_warning "$script não é executável. Execute: chmod +x $script"
        fi
    fi
done

# Verificar espaço em disco
log_check "Espaço em disco"
AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
log_success "Espaço disponível: $AVAILABLE_SPACE"

# Verificar memória RAM
log_check "Memória RAM"
if command -v free >/dev/null 2>&1; then
    TOTAL_RAM=$(free -h | awk 'NR==2 {print $2}')
    AVAILABLE_RAM=$(free -h | awk 'NR==2 {print $7}')
    log_success "RAM total: $TOTAL_RAM, Disponível: $AVAILABLE_RAM"
elif command -v vm_stat >/dev/null 2>&1; then
    # macOS
    log_success "Sistema macOS detectado"
else
    log_warning "Não foi possível verificar RAM"
fi

# Resumo final
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    RESUMO DA VALIDAÇÃO                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Sucessos:${NC}     $SUCCESS"
echo -e "${YELLOW}⚠ Avisos:${NC}       $WARNINGS"
echo -e "${RED}✗ Erros:${NC}        $ERRORS"
echo ""

# Recomendações
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}[AÇÃO NECESSÁRIA]${NC}"
    echo "Há erros críticos que precisam ser corrigidos antes de continuar."
    echo ""
    echo "Execute os seguintes comandos conforme necessário:"
    echo "  - npm install              (instalar dependências)"
    echo "  - npm run install:browsers (instalar navegadores)"
    echo "  - npm run build:dev        (compilar projeto)"
    echo ""
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}[AVISOS DETECTADOS]${NC}"
    echo "Há alguns avisos, mas você pode continuar."
    echo ""
    echo "Comandos recomendados para resolver avisos:"
    echo "  - cp .env.dev .env         (criar arquivo de configuração)"
    echo "  - chmod +x *.sh            (tornar scripts executáveis)"
    echo "  - npm run install:browsers (se navegadores não instalados)"
    echo ""
    echo -e "${GREEN}Você pode continuar, mas recomenda-se resolver os avisos.${NC}"
    echo ""
else
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}║          ✓✓✓ INSTALAÇÃO VALIDADA COM SUCESSO! ✓✓✓          ║${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Próximos passos:"
    echo ""
    echo "  1. Iniciar o Browserless:"
    echo -e "     ${YELLOW}npm start${NC}  ou  ${YELLOW}npm run dev${NC}"
    echo ""
    echo "  2. Acessar a documentação:"
    echo -e "     ${YELLOW}http://localhost:3000/docs${NC}"
    echo ""
    echo "  3. Consultar guias:"
    echo -e "     ${YELLOW}QUICKSTART.md${NC}       - Guia rápido"
    echo -e "     ${YELLOW}DEPLOY-LOCAL.md${NC}     - Documentação completa"
    echo ""
fi

exit $ERRORS
