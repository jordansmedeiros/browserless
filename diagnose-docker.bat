@echo off
REM ###############################################################################
REM Browserless - Script de Diagnóstico do Docker (Windows)
REM
REM Este script verifica e diagnostica problemas comuns com Docker
REM ###############################################################################

setlocal enabledelayedexpansion

set "BLUE=[94m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

echo %BLUE%========================================%NC%
echo %BLUE%  Browserless - Diagnóstico Docker%NC%
echo %BLUE%========================================%NC%
echo.

REM ###############################################################################
REM 1. Verificar Docker instalado
REM ###############################################################################
echo %BLUE%[1/8]%NC% Verificando instalação do Docker...
where docker >nul 2>&1
if errorlevel 1 (
    echo %RED%  [FALHA]%NC% Docker não está instalado!
    echo   Instale: https://docs.docker.com/get-docker/
    goto :end_with_error
) else (
    for /f "tokens=3" %%a in ('docker --version') do set DOCKER_VERSION=%%a
    echo %GREEN%  [OK]%NC% Docker version !DOCKER_VERSION!
)

REM ###############################################################################
REM 2. Verificar Docker rodando
REM ###############################################################################
echo.
echo %BLUE%[2/8]%NC% Verificando se Docker está rodando...
docker ps >nul 2>&1
if errorlevel 1 (
    echo %RED%  [FALHA]%NC% Docker não está rodando!
    echo   Inicie o Docker Desktop
    goto :end_with_error
) else (
    echo %GREEN%  [OK]%NC% Docker está rodando
)

REM ###############################################################################
REM 3. Verificar conectividade com GitHub Container Registry
REM ###############################################################################
echo.
echo %BLUE%[3/8]%NC% Testando conectividade com ghcr.io...
ping -n 2 ghcr.io >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%  [AVISO]%NC% Não foi possível pingar ghcr.io
    echo   Isso pode ser normal se ICMP estiver bloqueado
    echo   Tentando pull de teste...

    docker pull ghcr.io/browserless/chromium:latest --quiet >nul 2>&1
    if errorlevel 1 (
        echo %RED%  [FALHA]%NC% Não foi possível conectar ao registry
        echo   Verifique firewall/proxy/conectividade
    ) else (
        echo %GREEN%  [OK]%NC% Conectividade OK via pull
    )
) else (
    echo %GREEN%  [OK]%NC% ghcr.io está acessível
)

REM ###############################################################################
REM 4. Verificar espaço em disco
REM ###############################################################################
echo.
echo %BLUE%[4/8]%NC% Verificando espaço em disco...
for /f "tokens=3" %%a in ('dir /-c ^| find "bytes free"') do set FREE_SPACE=%%a
echo %GREEN%  [INFO]%NC% Espaço livre: !FREE_SPACE! bytes
echo   (Imagens Browserless precisam de ~1-2GB)

REM ###############################################################################
REM 5. Listar imagens Browserless existentes
REM ###############################################################################
echo.
echo %BLUE%[5/8]%NC% Verificando imagens Browserless locais...
docker images --filter=reference='*browserless*' --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" > nul 2>&1
if errorlevel 1 (
    echo %YELLOW%  [AVISO]%NC% Nenhuma imagem Browserless encontrada
    echo   Execute: docker pull ghcr.io/browserless/chromium:latest
) else (
    docker images --filter=reference='*browserless*' --format "  {{.Repository}}:{{.Tag}} ({{.Size}})"
    if "!ERRORLEVEL!"=="0" (
        echo %GREEN%  [OK]%NC% Imagens encontradas
    )
)

REM ###############################################################################
REM 6. Verificar containers Browserless
REM ###############################################################################
echo.
echo %BLUE%[6/8]%NC% Verificando containers Browserless...
docker ps -a --filter=name=browserless --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | find "browserless" >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%  [INFO]%NC% Nenhum container Browserless encontrado
) else (
    echo %GREEN%  [INFO]%NC% Containers encontrados:
    docker ps -a --filter=name=browserless --format "  - {{.Names}}: {{.Status}}"
)

REM ###############################################################################
REM 7. Verificar porta 3000
REM ###############################################################################
echo.
echo %BLUE%[7/8]%NC% Verificando se porta 3000 está disponível...
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo %GREEN%  [OK]%NC% Porta 3000 está livre
) else (
    echo %YELLOW%  [AVISO]%NC% Porta 3000 já está em uso:
    netstat -ano | findstr :3000 | findstr LISTENING
    echo   Você pode alterar a porta no docker-compose.yml
)

REM ###############################################################################
REM 8. Verificar Docker Compose
REM ###############################################################################
echo.
echo %BLUE%[8/8]%NC% Verificando Docker Compose...
docker compose version >nul 2>&1
if errorlevel 1 (
    echo %RED%  [FALHA]%NC% Docker Compose não está disponível
) else (
    for /f "tokens=4" %%a in ('docker compose version') do set COMPOSE_VERSION=%%a
    echo %GREEN%  [OK]%NC% Docker Compose version !COMPOSE_VERSION!
)

REM ###############################################################################
REM Resumo e Recomendações
REM ###############################################################################
echo.
echo %GREEN%========================================%NC%
echo %GREEN%  Diagnóstico Completo%NC%
echo %GREEN%========================================%NC%
echo.

echo %YELLOW%Recomendações:%NC%
echo.

docker images --filter=reference='ghcr.io/browserless/chromium' --format "{{.Repository}}" | find "chromium" >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%1.%NC% Fazer pull manual da imagem:
    echo    %GREEN%docker pull ghcr.io/browserless/chromium:latest%NC%
    echo.
)

docker ps --filter=name=browserless-chromium --format "{{.Names}}" | find "browserless-chromium" >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%2.%NC% Iniciar Browserless:
    echo    Opção A: %GREEN%docker compose up -d%NC%
    echo    Opção B: %GREEN%docker run -d -p 3000:3000 ghcr.io/browserless/chromium%NC%
    echo    Opção C: %GREEN%docker-start.bat%NC%
    echo.
)

echo %YELLOW%3.%NC% Para resolver problemas de pull lento:
echo    - Use conexão de internet mais rápida
echo    - Configure HTTP_PROXY e HTTPS_PROXY se usar proxy corporativo
echo    - Tente em horário de menor tráfego
echo.

echo %YELLOW%4.%NC% Se o problema persistir:
echo    - Limpe cache do Docker: %GREEN%docker system prune -a%NC%
echo    - Reinicie o Docker Desktop
echo    - Use desenvolvimento local sem Docker (veja DEPLOY-LOCAL.md)
echo.

echo %BLUE%Documentação:%NC%
echo   - Guia completo: DEPLOY-LOCAL.md
echo   - Início rápido: QUICKSTART.md
echo   - Validar instalação: validate-installation.bat
echo.

goto :end

:end_with_error
echo.
echo %RED%Diagnóstico falhou. Corrija os erros acima.%NC%
echo.
pause
exit /b 1

:end
echo %GREEN%Diagnóstico concluído!%NC%
echo.
pause
