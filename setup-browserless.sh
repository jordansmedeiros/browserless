#!/bin/bash

###############################################################################
# Browserless - Script de Setup para Linux/macOS
#
# Este script automatiza a instalação e configuração do Browserless
# para desenvolvimento local.
###############################################################################

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
print_banner() {
    echo -e "${BLUE}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                    BROWSERLESS SETUP                         ║
║                                                              ║
║         Deploy Local - Script de Configuração               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar Node.js
check_node() {
    log_info "Verificando Node.js..."

    if ! command_exists node; then
        log_error "Node.js não está instalado!"
        echo ""
        echo "Por favor, instale o Node.js versão 24.x:"
        echo "  - Via NVM (recomendado): https://github.com/nvm-sh/nvm"
        echo "  - Download direto: https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

    if [ "$NODE_VERSION" -ne 24 ]; then
        log_warning "Versão do Node.js: $(node -v) (requerido: v24.x)"

        if command_exists nvm; then
            log_info "NVM detectado. Instalando Node.js 24..."
            nvm install 24
            nvm use 24
            log_success "Node.js 24 instalado via NVM"
        else
            log_error "Por favor, instale Node.js 24.x"
            echo ""
            echo "Você pode usar NVM para gerenciar versões do Node.js:"
            echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
            echo "  nvm install 24"
            echo "  nvm use 24"
            exit 1
        fi
    else
        log_success "Node.js $(node -v) detectado"
    fi
}

# Verificar npm
check_npm() {
    log_info "Verificando npm..."

    if ! command_exists npm; then
        log_error "npm não encontrado!"
        exit 1
    fi

    log_success "npm $(npm -v) detectado"
}

# Verificar Git
check_git() {
    log_info "Verificando Git..."

    if ! command_exists git; then
        log_error "Git não está instalado!"
        echo "Instale o Git: https://git-scm.com/downloads"
        exit 1
    fi

    log_success "Git $(git --version | cut -d' ' -f3) detectado"
}

# Verificar Docker (opcional)
check_docker() {
    log_info "Verificando Docker (opcional)..."

    if command_exists docker; then
        if docker ps >/dev/null 2>&1; then
            log_success "Docker está instalado e rodando"
            DOCKER_AVAILABLE=true
        else
            log_warning "Docker instalado mas não está rodando"
            DOCKER_AVAILABLE=false
        fi
    else
        log_warning "Docker não está instalado (opcional para desenvolvimento)"
        DOCKER_AVAILABLE=false
    fi
}

# Instalar dependências
install_dependencies() {
    log_info "Instalando dependências do npm..."

    if npm install; then
        log_success "Dependências instaladas com sucesso"
    else
        log_error "Falha ao instalar dependências"
        exit 1
    fi
}

# Instalar navegadores
install_browsers() {
    log_info "Instalando navegadores (Chromium, Firefox, WebKit, Edge)..."
    log_warning "Este processo pode demorar alguns minutos e requer ~1-2GB de espaço"

    if npm run install:browsers; then
        log_success "Navegadores instalados com sucesso"
    else
        log_error "Falha ao instalar navegadores"
        exit 1
    fi
}

# Build do projeto
build_project() {
    log_info "Fazendo build do projeto..."

    read -p "$(echo -e ${YELLOW}Deseja fazer build completo com debugger? [s/N]:${NC} )" -n 1 -r
    echo

    if [[ $REPLY =~ ^[Ss]$ ]]; then
        log_info "Executando build completo (com debugger)..."
        if npm run build:dev; then
            log_success "Build completo concluído"
        else
            log_error "Falha no build"
            exit 1
        fi
    else
        log_info "Executando build padrão..."
        if npm run build; then
            log_success "Build concluído"
        else
            log_error "Falha no build"
            exit 1
        fi
    fi
}

# Criar arquivo .env
create_env_file() {
    log_info "Configurando arquivo .env..."

    if [ ! -f .env ]; then
        if [ -f .env.dev ]; then
            cp .env.dev .env
            log_success "Arquivo .env criado a partir de .env.dev"

            log_warning "IMPORTANTE: Arquivo .env criado com token padrão!"
            log_warning "Para produção, edite o arquivo .env e defina um token seguro"
        else
            log_error "Arquivo .env.dev não encontrado"
            exit 1
        fi
    else
        log_info "Arquivo .env já existe, mantendo configuração atual"
    fi
}

# Criar diretórios necessários
create_directories() {
    log_info "Criando diretórios necessários..."

    mkdir -p logs
    mkdir -p downloads
    mkdir -p scripts

    log_success "Diretórios criados"
}

# Criar scripts auxiliares
create_helper_scripts() {
    log_info "Criando scripts auxiliares..."

    # Script de start
    cat > scripts/start.sh << 'EOFSTART'
#!/bin/bash
echo "Iniciando Browserless..."
npm start
EOFSTART

    # Script de stop
    cat > scripts/stop.sh << 'EOFSTOP'
#!/bin/bash
echo "Parando Browserless..."
pkill -f "node build" && echo "Browserless parado" || echo "Nenhum processo encontrado"
EOFSTOP

    # Script de restart
    cat > scripts/restart.sh << 'EOFRESTART'
#!/bin/bash
echo "Reiniciando Browserless..."
./scripts/stop.sh
sleep 2
./scripts/start.sh
EOFRESTART

    # Script de logs
    cat > scripts/logs.sh << 'EOFLOGS'
#!/bin/bash
if [ -f logs/browserless.log ]; then
    tail -f logs/browserless.log
else
    echo "Arquivo de log não encontrado. Execute o Browserless primeiro."
fi
EOFLOGS

    # Tornar scripts executáveis
    chmod +x scripts/*.sh

    log_success "Scripts auxiliares criados em ./scripts/"
}

# Exibir informações finais
show_final_info() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}║          SETUP CONCLUÍDO COM SUCESSO!                        ║${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Próximos passos:${NC}"
    echo ""
    echo "  1. Iniciar o Browserless:"
    echo -e "     ${YELLOW}npm start${NC}  ou  ${YELLOW}npm run dev${NC}"
    echo ""
    echo "  2. Acessar a documentação:"
    echo -e "     ${YELLOW}http://localhost:3000/docs${NC}"
    echo ""
    echo "  3. Acessar o debugger (se instalado):"
    echo -e "     ${YELLOW}http://localhost:3000/debugger/?token=6R0W53R135510${NC}"
    echo ""
    echo -e "${BLUE}Scripts disponíveis:${NC}"
    echo -e "  ${YELLOW}./scripts/start.sh${NC}    - Iniciar Browserless"
    echo -e "  ${YELLOW}./scripts/stop.sh${NC}     - Parar Browserless"
    echo -e "  ${YELLOW}./scripts/restart.sh${NC}  - Reiniciar Browserless"
    echo -e "  ${YELLOW}./scripts/logs.sh${NC}     - Ver logs em tempo real"
    echo ""

    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo -e "${BLUE}Alternativa com Docker:${NC}"
        echo -e "  ${YELLOW}docker run -p 3000:3000 ghcr.io/browserless/chromium${NC}"
        echo ""
    fi

    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo "  - Edite o arquivo .env e altere o TOKEN para produção"
    echo "  - Consulte DEPLOY-LOCAL.md para documentação completa"
    echo ""
}

# Perguntar modo de instalação
ask_installation_mode() {
    echo ""
    echo -e "${YELLOW}Selecione o modo de instalação:${NC}"
    echo ""
    echo "  1) Instalação Completa (recomendado para desenvolvimento)"
    echo "     - Instala dependências"
    echo "     - Instala navegadores"
    echo "     - Faz build do projeto"
    echo "     - Cria scripts auxiliares"
    echo ""
    echo "  2) Instalação Rápida (apenas dependências)"
    echo "     - Instala dependências npm"
    echo "     - Você precisará instalar navegadores e fazer build manualmente"
    echo ""
    echo "  3) Apenas verificar pré-requisitos"
    echo "     - Não instala nada, apenas verifica o ambiente"
    echo ""

    read -p "$(echo -e ${YELLOW}Escolha uma opção [1-3]:${NC} )" -n 1 -r
    echo

    case $REPLY in
        1)
            INSTALL_MODE="full"
            ;;
        2)
            INSTALL_MODE="quick"
            ;;
        3)
            INSTALL_MODE="check"
            ;;
        *)
            log_error "Opção inválida"
            exit 1
            ;;
    esac
}

# Main
main() {
    print_banner

    # Verificar pré-requisitos
    check_node
    check_npm
    check_git
    check_docker

    echo ""

    # Perguntar modo de instalação
    ask_installation_mode

    echo ""

    if [ "$INSTALL_MODE" = "check" ]; then
        log_success "Verificação de pré-requisitos concluída!"
        exit 0
    fi

    # Criar diretórios
    create_directories

    # Instalação
    if [ "$INSTALL_MODE" = "full" ] || [ "$INSTALL_MODE" = "quick" ]; then
        install_dependencies
        create_env_file
        create_helper_scripts
    fi

    if [ "$INSTALL_MODE" = "full" ]; then
        install_browsers
        build_project
    fi

    # Informações finais
    show_final_info

    if [ "$INSTALL_MODE" = "quick" ]; then
        echo -e "${YELLOW}Lembre-se de executar:${NC}"
        echo "  npm run install:browsers"
        echo "  npm run build:dev"
        echo ""
    fi
}

# Executar
main
