@echo off
REM ###############################################################################
REM Browserless - Script de Fix Rápido para Problemas com Docker (Windows)
REM
REM Este script automatiza soluções para problemas comuns com Docker
REM ###############################################################################

setlocal enabledelayedexpansion

set "BLUE=[94m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

echo %BLUE%========================================%NC%
echo %BLUE%  Browserless - Fix Rápido Docker%NC%
echo %BLUE%========================================%NC%
echo.

echo %YELLOW%Este script tentará resolver problemas comuns:%NC%
echo   1. Pull manual de imagens
echo   2. Limpar containers antigos
echo   3. Limpar cache do Docker
echo   4. Reiniciar serviço
echo.

set /p CONFIRM="Deseja continuar? [s/N]: "
if /i not "%CONFIRM%"=="s" (
    echo Operação cancelada
    goto :end
)

REM ###############################################################################
REM 1. Parar e remover containers existentes
REM ###############################################################################
echo.
echo %BLUE%[1/5]%NC% Parando containers Browserless existentes...
docker ps --filter=name=browserless --format "{{.Names}}" | find "browserless" >nul 2>&1
if not errorlevel 1 (
    docker stop $(docker ps --filter=name=browserless -q) 2>nul
    echo %GREEN%  [OK]%NC% Containers parados
) else (
    echo %YELLOW%  [SKIP]%NC% Nenhum container rodando
)

echo   Removendo containers antigos...
docker ps -a --filter=name=browserless --format "{{.Names}}" | find "browserless" >nul 2>&1
if not errorlevel 1 (
    docker rm -f $(docker ps -a --filter=name=browserless -q) 2>nul
    echo %GREEN%  [OK]%NC% Containers removidos
) else (
    echo %YELLOW%  [SKIP]%NC% Nenhum container para remover
)

REM ###############################################################################
REM 2. Pull manual das imagens (com retry)
REM ###############################################################################
echo.
echo %BLUE%[2/5]%NC% Fazendo pull da imagem Chromium...
echo   Isso pode demorar alguns minutos...
echo.

set RETRY=0
set MAX_RETRIES=3

:retry_pull
set /a RETRY+=1
echo   Tentativa %RETRY%/%MAX_RETRIES%...

docker pull ghcr.io/browserless/chromium:latest
if errorlevel 1 (
    if %RETRY% LSS %MAX_RETRIES% (
        echo %YELLOW%  [AVISO]%NC% Pull falhou, tentando novamente em 5 segundos...
        timeout /t 5 /nobreak >nul
        goto :retry_pull
    ) else (
        echo %RED%  [FALHA]%NC% Não foi possível fazer pull da imagem após %MAX_RETRIES% tentativas
        echo.
        echo   Possíveis causas:
        echo     - Problemas de conectividade
        echo     - Firewall/proxy bloqueando acesso
        echo     - ghcr.io temporariamente indisponível
        echo.
        echo   Tente:
        echo     - Verificar sua conexão de internet
        echo     - Configurar proxy: set HTTP_PROXY=http://proxy:port
        echo     - Tentar novamente mais tarde
        goto :end_with_error
    )
) else (
    echo %GREEN%  [OK]%NC% Imagem baixada com sucesso!
)

REM ###############################################################################
REM 3. Limpar cache do Docker (opcional)
REM ###############################################################################
echo.
echo %BLUE%[3/5]%NC% Limpeza de cache (opcional)...
set /p CLEAN_CACHE="Deseja limpar cache do Docker? Isso pode liberar espaço [s/N]: "

if /i "%CLEAN_CACHE%"=="s" (
    echo   Limpando imagens não utilizadas...
    docker image prune -f >nul 2>&1
    echo %GREEN%  [OK]%NC% Cache limpo

    echo.
    echo   Deseja fazer limpeza COMPLETA (remove TODAS as imagens não usadas)?
    set /p DEEP_CLEAN="CUIDADO: Isso remove tudo que não está em uso [s/N]: "

    if /i "!DEEP_CLEAN!"=="s" (
        docker system prune -a -f >nul 2>&1
        echo %GREEN%  [OK]%NC% Limpeza completa realizada
    )
) else (
    echo %YELLOW%  [SKIP]%NC% Limpeza de cache pulada
)

REM ###############################################################################
REM 4. Criar diretórios necessários
REM ###############################################################################
echo.
echo %BLUE%[4/5]%NC% Criando diretórios necessários...
for %%d in (downloads logs) do (
    if not exist %%d mkdir %%d
    echo %GREEN%  [OK]%NC% Diretório %%d\ criado/verificado
)

REM ###############################################################################
REM 5. Iniciar Browserless
REM ###############################################################################
echo.
echo %BLUE%[5/5]%NC% Iniciando Browserless...
echo.
echo %YELLOW%Escolha o método de inicialização:%NC%
echo   1^) Docker Compose (recomendado^)
echo   2^) Docker run direto
echo   3^) Pular inicialização
echo.

set /p START_METHOD="Escolha [1-3]: "

if "%START_METHOD%"=="1" (
    echo   Iniciando via Docker Compose...
    docker compose up -d
    if errorlevel 1 (
        echo %RED%  [FALHA]%NC% Erro ao iniciar via compose
        goto :end_with_error
    ) else (
        echo %GREEN%  [OK]%NC% Browserless iniciado via Docker Compose
    )
) else if "%START_METHOD%"=="2" (
    echo   Iniciando via Docker run...
    docker run -d ^
        --name browserless-chromium ^
        -p 3000:3000 ^
        -e TOKEN=6R0W53R135510 ^
        -e DEBUG=browserless* ^
        -v "%CD%\downloads":/app/downloads ^
        --restart unless-stopped ^
        ghcr.io/browserless/chromium:latest

    if errorlevel 1 (
        echo %RED%  [FALHA]%NC% Erro ao iniciar container
        goto :end_with_error
    ) else (
        echo %GREEN%  [OK]%NC% Browserless iniciado via Docker run
    )
) else (
    echo %YELLOW%  [SKIP]%NC% Inicialização pulada
    goto :show_instructions
)

REM Aguardar container iniciar
echo.
echo   Aguardando container inicializar...
timeout /t 5 /nobreak >nul

REM Verificar status
docker ps --filter=name=browserless --format "{{.Names}}: {{.Status}}" | find "browserless" >nul 2>&1
if not errorlevel 1 (
    echo %GREEN%  [OK]%NC% Container rodando:
    docker ps --filter=name=browserless --format "  {{.Names}}: {{.Status}}"
) else (
    echo %RED%  [FALHA]%NC% Container não está rodando!
    echo   Verificando logs...
    docker logs browserless-chromium 2>nul
    goto :end_with_error
)

REM ###############################################################################
REM Validação Final
REM ###############################################################################
echo.
echo %BLUE%[VALIDAÇÃO]%NC% Testando serviço...
timeout /t 3 /nobreak >nul

curl -s -o nul -w "%%{http_code}" http://localhost:3000/docs > %TEMP%\http_code.txt 2>nul
set /p HTTP_CODE=<%TEMP%\http_code.txt
del %TEMP%\http_code.txt >nul 2>&1

if "%HTTP_CODE%"=="200" (
    echo %GREEN%  [OK]%NC% Serviço acessível! http://localhost:3000/docs
) else (
    echo %YELLOW%  [AVISO]%NC% Serviço ainda não respondeu (HTTP: %HTTP_CODE%)
    echo   Aguarde alguns segundos e tente: validate-docker.bat
)

REM ###############################################################################
REM Sucesso
REM ###############################################################################
:show_instructions
echo.
echo %GREEN%========================================%NC%
echo %GREEN%  Fix Concluído!%NC%
echo %GREEN%========================================%NC%
echo.

echo %BLUE%Próximos passos:%NC%
echo.
echo   1. Validar instalação:
echo      %GREEN%validate-docker.bat%NC%
echo.
echo   2. Ver logs em tempo real:
echo      %GREEN%docker logs -f browserless-chromium%NC%
echo.
echo   3. Acessar documentação:
echo      %GREEN%http://localhost:3000/docs%NC%
echo.
echo   4. Testar API:
echo      %GREEN%curl -X POST http://localhost:3000/screenshot?token=6R0W53R135510 \%NC%
echo      %GREEN%-H "Content-Type: application/json" \%NC%
echo      %GREEN%-d "{\"url\":\"https://example.com\"}" \%NC%
echo      %GREEN%--output test.png%NC%
echo.

echo %YELLOW%Dicas:%NC%
echo   - Para parar:     %GREEN%docker compose down%NC%
echo   - Para reiniciar: %GREEN%docker compose restart%NC%
echo   - Para ver logs:  %GREEN%docker compose logs -f%NC%
echo.

goto :end

:end_with_error
echo.
echo %RED%Fix falhou. Execute diagnose-docker.bat para mais detalhes.%NC%
echo.
pause
exit /b 1

:end
echo %GREEN%Pronto para usar!%NC%
echo.
pause
