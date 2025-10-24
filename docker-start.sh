#!/bin/bash

###############################################################################
# Script para iniciar Browserless com Docker
###############################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Browserless - Docker Start${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Docker não está instalado!"
    echo "Instale o Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker está rodando
if ! docker ps &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Docker não está rodando!"
    echo "Inicie o Docker Desktop ou serviço Docker"
    exit 1
fi

# Opções de navegador
echo -e "${YELLOW}Selecione o navegador:${NC}"
echo "  1) Chromium (padrão)"
echo "  2) Firefox"
echo "  3) WebKit"
echo "  4) Microsoft Edge"
echo "  5) Multi (todos os navegadores)"
echo ""

read -p "Escolha [1-5] (padrão: 1): " BROWSER_CHOICE
BROWSER_CHOICE=${BROWSER_CHOICE:-1}

case $BROWSER_CHOICE in
    1)
        IMAGE="ghcr.io/browserless/chromium"
        BROWSER_NAME="Chromium"
        ;;
    2)
        IMAGE="ghcr.io/browserless/firefox"
        BROWSER_NAME="Firefox"
        ;;
    3)
        IMAGE="ghcr.io/browserless/webkit"
        BROWSER_NAME="WebKit"
        ;;
    4)
        IMAGE="ghcr.io/browserless/edge"
        BROWSER_NAME="Edge"
        ;;
    5)
        IMAGE="ghcr.io/browserless/multi"
        BROWSER_NAME="Multi-Browser"
        ;;
    *)
        echo -e "${RED}[ERROR]${NC} Opção inválida"
        exit 1
        ;;
esac

# Porta
read -p "Porta (padrão: 3000): " PORT
PORT=${PORT:-3000}

# Token
read -p "Token de autenticação (padrão: 6R0W53R135510): " TOKEN
TOKEN=${TOKEN:-6R0W53R135510}

# Modo (daemon ou interativo)
echo ""
echo -e "${YELLOW}Modo de execução:${NC}"
echo "  1) Interativo (logs no terminal)"
echo "  2) Background/Daemon"
echo ""

read -p "Escolha [1-2] (padrão: 2): " MODE_CHOICE
MODE_CHOICE=${MODE_CHOICE:-2}

# Nome do container
CONTAINER_NAME="browserless-${BROWSER_NAME,,}"

# Verificar se já existe um container com esse nome
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}[WARNING]${NC} Container '${CONTAINER_NAME}' já existe"
    read -p "Deseja removê-lo e criar um novo? [s/N]: " REMOVE_EXISTING

    if [[ $REMOVE_EXISTING =~ ^[Ss]$ ]]; then
        echo -e "${BLUE}[INFO]${NC} Removendo container existente..."
        docker rm -f "${CONTAINER_NAME}" > /dev/null 2>&1
        echo -e "${GREEN}[SUCCESS]${NC} Container removido"
    else
        echo -e "${YELLOW}[INFO]${NC} Mantendo container existente"
        echo "Use: docker start ${CONTAINER_NAME}"
        exit 0
    fi
fi

# Construir comando Docker
DOCKER_CMD="docker run"

if [ "$MODE_CHOICE" = "2" ]; then
    DOCKER_CMD="${DOCKER_CMD} -d"
fi

DOCKER_CMD="${DOCKER_CMD} --name ${CONTAINER_NAME}"
DOCKER_CMD="${DOCKER_CMD} -p ${PORT}:3000"
DOCKER_CMD="${DOCKER_CMD} -e TOKEN=${TOKEN}"
DOCKER_CMD="${DOCKER_CMD} -e DEBUG=browserless*"
DOCKER_CMD="${DOCKER_CMD} --restart unless-stopped"

# Adicionar volume para downloads (opcional)
read -p "Mapear diretório de downloads? [s/N]: " MAP_DOWNLOADS

if [[ $MAP_DOWNLOADS =~ ^[Ss]$ ]]; then
    DOWNLOAD_DIR="$(pwd)/downloads"
    mkdir -p "${DOWNLOAD_DIR}"
    DOCKER_CMD="${DOCKER_CMD} -v ${DOWNLOAD_DIR}:/app/downloads"
fi

DOCKER_CMD="${DOCKER_CMD} ${IMAGE}"

# Executar
echo ""
echo -e "${BLUE}[INFO]${NC} Iniciando container..."
echo -e "${BLUE}[INFO]${NC} Navegador: ${BROWSER_NAME}"
echo -e "${BLUE}[INFO]${NC} Porta: ${PORT}"
echo -e "${BLUE}[INFO]${NC} Imagem: ${IMAGE}"
echo ""

if eval ${DOCKER_CMD}; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Browserless iniciado com sucesso!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Informações:${NC}"
    echo "  - Container: ${CONTAINER_NAME}"
    echo "  - Documentação: http://localhost:${PORT}/docs"
    echo "  - WebSocket: ws://localhost:${PORT}?token=${TOKEN}"
    echo "  - Debugger: http://localhost:${PORT}/debugger/?token=${TOKEN}"
    echo ""
    echo -e "${BLUE}Comandos úteis:${NC}"
    echo "  - Ver logs:  docker logs -f ${CONTAINER_NAME}"
    echo "  - Parar:     docker stop ${CONTAINER_NAME}"
    echo "  - Iniciar:   docker start ${CONTAINER_NAME}"
    echo "  - Remover:   docker rm -f ${CONTAINER_NAME}"
    echo ""

    if [ "$MODE_CHOICE" = "1" ]; then
        echo -e "${YELLOW}Pressione Ctrl+C para parar${NC}"
    fi
else
    echo -e "${RED}[ERROR]${NC} Falha ao iniciar container"
    exit 1
fi
