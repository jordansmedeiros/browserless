@echo off
REM ###############################################################################
REM Browserless - Validação de Instalação Docker em Runtime (Windows)
REM
REM Este script valida se o Browserless está funcionando corretamente após deploy
REM ###############################################################################

setlocal enabledelayedexpansion

set "BLUE=[94m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

set PORT=3000
set TOKEN=6R0W53R135510

echo %BLUE%========================================%NC%
echo %BLUE%  Browserless - Validação Docker%NC%
echo %BLUE%========================================%NC%
echo.

REM Detectar porta e token customizados
if defined BROWSERLESS_PORT set PORT=%BROWSERLESS_PORT%
if defined BROWSERLESS_TOKEN set TOKEN=%BROWSERLESS_TOKEN%

echo %BLUE%Configuração:%NC%
echo   - Porta: %PORT%
echo   - Token: %TOKEN%
echo.

REM ###############################################################################
REM 1. Verificar se há container rodando
REM ###############################################################################
echo %BLUE%[1/6]%NC% Verificando containers Docker...
docker ps --filter=name=browserless --format "{{.Names}}" | find "browserless" >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%  [AVISO]%NC% Nenhum container Browserless rodando via Docker
    echo   Verificando processo Node.js local...

    tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
    if errorlevel 1 (
        echo %RED%  [FALHA]%NC% Browserless não está rodando!
        echo.
        echo   Inicie com:
        echo     - Docker: %GREEN%docker compose up -d%NC%
        echo     - Local:  %GREEN%npm start%NC%
        goto :end_with_error
    ) else (
        echo %GREEN%  [OK]%NC% Processo Node.js encontrado
    )
) else (
    echo %GREEN%  [OK]%NC% Container Docker rodando:
    docker ps --filter=name=browserless --format "  - {{.Names}}: {{.Status}}"
)

REM ###############################################################################
REM 2. Testar endpoint /docs
REM ###############################################################################
echo.
echo %BLUE%[2/6]%NC% Testando endpoint /docs...
curl -s -o nul -w "%%{http_code}" http://localhost:%PORT%/docs > %TEMP%\http_code.txt 2>nul
set /p HTTP_CODE=<%TEMP%\http_code.txt
del %TEMP%\http_code.txt >nul 2>&1

if "%HTTP_CODE%"=="200" (
    echo %GREEN%  [OK]%NC% Documentação acessível em http://localhost:%PORT%/docs
) else if "%HTTP_CODE%"=="000" (
    echo %RED%  [FALHA]%NC% Não foi possível conectar (porta %PORT%)
    echo   Verifique se o Browserless está rodando
    goto :end_with_error
) else (
    echo %YELLOW%  [AVISO]%NC% HTTP Status: %HTTP_CODE%
)

REM ###############################################################################
REM 3. Testar endpoint /health
REM ###############################################################################
echo.
echo %BLUE%[3/6]%NC% Testando endpoint /health...
curl -s http://localhost:%PORT%/health > %TEMP%\health.txt 2>nul
if errorlevel 1 (
    echo %RED%  [FALHA]%NC% Health check falhou
) else (
    type %TEMP%\health.txt | find "ok" >nul 2>&1
    if errorlevel 1 (
        echo %YELLOW%  [AVISO]%NC% Resposta inesperada
        type %TEMP%\health.txt
    ) else (
        echo %GREEN%  [OK]%NC% Health check passou
    )
)
del %TEMP%\health.txt >nul 2>&1

REM ###############################################################################
REM 4. Testar API REST - Screenshot
REM ###############################################################################
echo.
echo %BLUE%[4/6]%NC% Testando API REST (screenshot)...
echo   Fazendo screenshot de example.com...

curl -s -X POST "http://localhost:%PORT%/screenshot?token=%TOKEN%" ^
    -H "Content-Type: application/json" ^
    -d "{\"url\":\"https://example.com\"}" ^
    -o %TEMP%\test-screenshot.png 2>nul

if errorlevel 1 (
    echo %RED%  [FALHA]%NC% Erro ao gerar screenshot
) else (
    for %%A in (%TEMP%\test-screenshot.png) do set SIZE=%%~zA
    if !SIZE! LSS 1000 (
        echo %RED%  [FALHA]%NC% Screenshot muito pequeno (!SIZE! bytes)
        echo   Resposta:
        type %TEMP%\test-screenshot.png
    ) else (
        echo %GREEN%  [OK]%NC% Screenshot gerado (!SIZE! bytes)
        echo   Arquivo salvo: %TEMP%\test-screenshot.png
    )
)

REM ###############################################################################
REM 5. Testar API REST - Content
REM ###############################################################################
echo.
echo %BLUE%[5/6]%NC% Testando API REST (content)...
curl -s -X POST "http://localhost:%PORT%/content?token=%TOKEN%" ^
    -H "Content-Type: application/json" ^
    -d "{\"url\":\"https://example.com\"}" > %TEMP%\test-content.html 2>nul

if errorlevel 1 (
    echo %RED%  [FALHA]%NC% Erro ao obter conteúdo
) else (
    type %TEMP%\test-content.html | find "Example Domain" >nul 2>&1
    if errorlevel 1 (
        echo %YELLOW%  [AVISO]%NC% Conteúdo inesperado
    ) else (
        echo %GREEN%  [OK]%NC% Conteúdo HTML obtido com sucesso
    )
)
del %TEMP%\test-content.html >nul 2>&1

REM ###############################################################################
REM 6. Verificar recursos do sistema
REM ###############################################################################
echo.
echo %BLUE%[6/6]%NC% Verificando recursos do sistema...

REM Verificar se há containers parados inesperadamente
docker ps -a --filter=name=browserless --filter=status=exited --format "{{.Names}}" | find "browserless" >nul 2>&1
if not errorlevel 1 (
    echo %YELLOW%  [AVISO]%NC% Há containers parados inesperadamente:
    docker ps -a --filter=name=browserless --filter=status=exited --format "  - {{.Names}}: {{.Status}}"
    echo   Execute: docker logs [container-name] para ver os logs
) else (
    echo %GREEN%  [OK]%NC% Nenhum container com problemas
)

REM ###############################################################################
REM Resumo Final
REM ###############################################################################
echo.
echo %GREEN%========================================%NC%
echo %GREEN%  Validação Completa!%NC%
echo %GREEN%========================================%NC%
echo.

echo %BLUE%URLs Úteis:%NC%
echo   - Documentação: %GREEN%http://localhost:%PORT%/docs%NC%
echo   - Debugger:     %GREEN%http://localhost:%PORT%/debugger/?token=%TOKEN%%NC%
echo   - Health:       %GREEN%http://localhost:%PORT%/health%NC%
echo.

echo %BLUE%Próximos Passos:%NC%
echo   1. Acesse a documentação para exemplos de uso
echo   2. Teste com Puppeteer ou Playwright (veja DEPLOY-LOCAL.md)
echo   3. Configure variáveis de ambiente no .env
echo.

echo %YELLOW%Dicas:%NC%
echo   - Logs Docker:  %GREEN%docker logs -f browserless-chromium%NC%
echo   - Parar:        %GREEN%docker compose down%NC%
echo   - Reiniciar:    %GREEN%docker compose restart%NC%
echo.

goto :end

:end_with_error
echo.
echo %RED%Validação falhou. Execute diagnose-docker.bat para mais detalhes.%NC%
echo.
pause
exit /b 1

:end
echo %GREEN%Tudo funcionando corretamente!%NC%
echo.
pause
