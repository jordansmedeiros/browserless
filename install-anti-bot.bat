@echo off
REM ###############################################################################
REM Instalador de Dependencias Anti-Bot para Browserless (Windows)
REM ###############################################################################

setlocal enabledelayedexpansion

set "BLUE=[94m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

echo %BLUE%========================================%NC%
echo %BLUE%  Anti-Bot Detection - Instalador%NC%
echo %BLUE%========================================%NC%
echo.

echo %YELLOW%Este script vai instalar:%NC%
echo   - puppeteer-extra
echo   - puppeteer-extra-plugin-stealth
echo   - playwright-core (opcional)
echo   - dotenv (para credenciais seguras)
echo.

set /p CONFIRM="Deseja continuar? [S/n]: "
if /i "%CONFIRM%"=="n" (
    echo Instalacao cancelada.
    exit /b 0
)

echo.
echo %BLUE%[1/4]%NC% Instalando puppeteer-extra...
call npm install puppeteer-extra
if errorlevel 1 (
    echo %RED%[ERRO]%NC% Falha ao instalar puppeteer-extra
    pause
    exit /b 1
)

echo.
echo %BLUE%[2/4]%NC% Instalando puppeteer-extra-plugin-stealth...
call npm install puppeteer-extra-plugin-stealth
if errorlevel 1 (
    echo %RED%[ERRO]%NC% Falha ao instalar puppeteer-extra-plugin-stealth
    pause
    exit /b 1
)

echo.
echo %BLUE%[3/4]%NC% Instalando playwright-core (opcional)...
call npm install playwright-core
if errorlevel 1 (
    echo %YELLOW%[AVISO]%NC% Falha ao instalar playwright-core (opcional)
)

echo.
echo %BLUE%[4/4]%NC% Instalando dotenv...
call npm install dotenv
if errorlevel 1 (
    echo %YELLOW%[AVISO]%NC% Falha ao instalar dotenv (opcional)
)

echo.
echo %GREEN%========================================%NC%
echo %GREEN%  Instalacao Completa!%NC%
echo %GREEN%========================================%NC%
echo.

echo %BLUE%Proximos passos:%NC%
echo.
echo   1. Edite suas credenciais:
echo      %YELLOW%Edite login-pje-stealth.js e atualize CPF e senha%NC%
echo.
echo   2. Execute o teste de anti-deteccao:
echo      %GREEN%node test-anti-detection.js%NC%
echo.
echo   3. Se o teste passar, execute o login:
echo      %GREEN%node login-pje-stealth.js%NC%
echo.
echo   4. Leia a documentacao completa:
echo      %YELLOW%README-PJE-LOGIN.md%NC%
echo      %YELLOW%ANTI-BOT-DETECTION.md%NC%
echo.

echo %YELLOW%IMPORTANTE:%NC%
echo   - NUNCA commit suas credenciais no codigo!
echo   - Use variaveis de ambiente (.env) para producao
echo   - Use apenas para automacao legitima
echo.

pause
