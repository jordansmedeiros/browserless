@echo off
REM ###############################################################################
REM Script para iniciar Browserless com Docker (Windows)
REM ###############################################################################

setlocal enabledelayedexpansion

set "BLUE=[94m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

echo %BLUE%========================================%NC%
echo %BLUE%  Browserless - Docker Start%NC%
echo %BLUE%========================================%NC%
echo.

REM Verificar Docker
where docker >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Docker não está instalado!
    echo Instale o Docker: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

docker ps >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Docker não está rodando!
    echo Inicie o Docker Desktop
    pause
    exit /b 1
)

REM Opções de navegador
echo %YELLOW%Selecione o navegador:%NC%
echo   1^) Chromium (padrão)
echo   2^) Firefox
echo   3^) WebKit
echo   4^) Microsoft Edge
echo   5^) Multi (todos os navegadores)
echo.

set /p BROWSER_CHOICE="Escolha [1-5] (padrão: 1): "
if not defined BROWSER_CHOICE set BROWSER_CHOICE=1

if "%BROWSER_CHOICE%"=="1" (
    set IMAGE=ghcr.io/browserless/chromium
    set BROWSER_NAME=Chromium
) else if "%BROWSER_CHOICE%"=="2" (
    set IMAGE=ghcr.io/browserless/firefox
    set BROWSER_NAME=Firefox
) else if "%BROWSER_CHOICE%"=="3" (
    set IMAGE=ghcr.io/browserless/webkit
    set BROWSER_NAME=WebKit
) else if "%BROWSER_CHOICE%"=="4" (
    set IMAGE=ghcr.io/browserless/edge
    set BROWSER_NAME=Edge
) else if "%BROWSER_CHOICE%"=="5" (
    set IMAGE=ghcr.io/browserless/multi
    set BROWSER_NAME=Multi
) else (
    echo %RED%[ERROR]%NC% Opção inválida
    pause
    exit /b 1
)

REM Porta
set /p PORT="Porta (padrão: 3000): "
if not defined PORT set PORT=3000

REM Token
set /p TOKEN="Token de autenticação (padrão: 6R0W53R135510): "
if not defined TOKEN set TOKEN=6R0W53R135510

REM Modo
echo.
echo %YELLOW%Modo de execução:%NC%
echo   1^) Interativo (logs no terminal)
echo   2^) Background/Daemon
echo.

set /p MODE_CHOICE="Escolha [1-2] (padrão: 2): "
if not defined MODE_CHOICE set MODE_CHOICE=2

REM Nome do container
set CONTAINER_NAME=browserless-%BROWSER_NAME%

REM Verificar se já existe
docker ps -a --format "{{.Names}}" | find "%CONTAINER_NAME%" >nul 2>&1
if not errorlevel 1 (
    echo %YELLOW%[WARNING]%NC% Container '%CONTAINER_NAME%' já existe
    set /p REMOVE_EXISTING="Deseja removê-lo e criar um novo? [s/N]: "

    if /i "!REMOVE_EXISTING!"=="s" (
        echo %BLUE%[INFO]%NC% Removendo container existente...
        docker rm -f %CONTAINER_NAME% >nul 2>&1
        echo %GREEN%[SUCCESS]%NC% Container removido
    ) else (
        echo %YELLOW%[INFO]%NC% Mantendo container existente
        echo Use: docker start %CONTAINER_NAME%
        pause
        exit /b 0
    )
)

REM Construir comando
set DOCKER_CMD=docker run

if "%MODE_CHOICE%"=="2" (
    set DOCKER_CMD=!DOCKER_CMD! -d
)

set DOCKER_CMD=!DOCKER_CMD! --name %CONTAINER_NAME%
set DOCKER_CMD=!DOCKER_CMD! -p %PORT%:3000
set DOCKER_CMD=!DOCKER_CMD! -e TOKEN=%TOKEN%
set DOCKER_CMD=!DOCKER_CMD! -e DEBUG=browserless*
set DOCKER_CMD=!DOCKER_CMD! --restart unless-stopped

REM Downloads
set /p MAP_DOWNLOADS="Mapear diretório de downloads? [s/N]: "

if /i "%MAP_DOWNLOADS%"=="s" (
    set DOWNLOAD_DIR=%CD%\downloads
    if not exist "!DOWNLOAD_DIR!" mkdir "!DOWNLOAD_DIR!"
    set DOCKER_CMD=!DOCKER_CMD! -v "!DOWNLOAD_DIR!":/app/downloads
)

set DOCKER_CMD=!DOCKER_CMD! %IMAGE%

REM Executar
echo.
echo %BLUE%[INFO]%NC% Iniciando container...
echo %BLUE%[INFO]%NC% Navegador: %BROWSER_NAME%
echo %BLUE%[INFO]%NC% Porta: %PORT%
echo %BLUE%[INFO]%NC% Imagem: %IMAGE%
echo.

call !DOCKER_CMD!
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Falha ao iniciar container
    pause
    exit /b 1
)

echo.
echo %GREEN%========================================%NC%
echo %GREEN%  Browserless iniciado com sucesso!%NC%
echo %GREEN%========================================%NC%
echo.
echo %BLUE%Informações:%NC%
echo   - Container: %CONTAINER_NAME%
echo   - Documentação: http://localhost:%PORT%/docs
echo   - WebSocket: ws://localhost:%PORT%?token=%TOKEN%
echo   - Debugger: http://localhost:%PORT%/debugger/?token=%TOKEN%
echo.
echo %BLUE%Comandos úteis:%NC%
echo   - Ver logs:  docker logs -f %CONTAINER_NAME%
echo   - Parar:     docker stop %CONTAINER_NAME%
echo   - Iniciar:   docker start %CONTAINER_NAME%
echo   - Remover:   docker rm -f %CONTAINER_NAME%
echo.

if "%MODE_CHOICE%"=="1" (
    echo %YELLOW%Pressione Ctrl+C para parar%NC%
)

pause
