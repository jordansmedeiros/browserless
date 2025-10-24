@echo off
REM ###############################################################################
REM Browserless - Script de Validação de Instalação (Windows)
REM ###############################################################################

setlocal enabledelayedexpansion

set "BLUE=[94m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

set ERRORS=0
set WARNINGS=0
set SUCCESS=0

REM Banner
echo %BLUE%
echo ===============================================================================
echo.
echo              BROWSERLESS - VALIDAÇÃO DE INSTALAÇÃO
echo.
echo ===============================================================================
echo %NC%

REM Verificar Node.js
echo.
echo %BLUE%[VERIFICANDO]%NC% Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo %RED%X%NC% Node.js não encontrado
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%a in ('node -v') do set NODE_VERSION=%%a
    for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_MAJOR=%%a
    set NODE_MAJOR=!NODE_MAJOR:v=!

    if "!NODE_MAJOR!"=="24" (
        echo %GREEN%✓%NC% Node.js !NODE_VERSION! instalado
        set /a SUCCESS+=1
    ) else (
        echo %YELLOW%⚠%NC% Node.js !NODE_VERSION! (requerido: v24.x)
        set /a WARNINGS+=1
    )
)

REM Verificar npm
echo.
echo %BLUE%[VERIFICANDO]%NC% npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo %RED%X%NC% npm não encontrado
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%a in ('npm -v') do set NPM_VERSION=%%a
    echo %GREEN%✓%NC% npm !NPM_VERSION! instalado
    set /a SUCCESS+=1
)

REM Verificar Git
echo.
echo %BLUE%[VERIFICANDO]%NC% Git...
where git >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%⚠%NC% Git não encontrado (opcional)
    set /a WARNINGS+=1
) else (
    for /f "tokens=3" %%a in ('git --version') do set GIT_VERSION=%%a
    echo %GREEN%✓%NC% Git !GIT_VERSION! instalado
    set /a SUCCESS+=1
)

REM Verificar Docker
echo.
echo %BLUE%[VERIFICANDO]%NC% Docker...
where docker >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%⚠%NC% Docker não encontrado (opcional)
    set /a WARNINGS+=1
) else (
    docker ps >nul 2>&1
    if errorlevel 1 (
        echo %YELLOW%⚠%NC% Docker instalado mas não está rodando
        set /a WARNINGS+=1
    ) else (
        for /f "tokens=3" %%a in ('docker --version') do set DOCKER_VERSION=%%a
        echo %GREEN%✓%NC% Docker !DOCKER_VERSION! instalado e rodando
        set /a SUCCESS+=1
    )
)

REM Verificar node_modules
echo.
echo %BLUE%[VERIFICANDO]%NC% Dependências do npm...
if exist node_modules\ (
    echo %GREEN%✓%NC% node_modules encontrado
    set /a SUCCESS+=1
) else (
    echo %RED%X%NC% node_modules não encontrado. Execute: npm install
    set /a ERRORS+=1
)

REM Verificar build
echo.
echo %BLUE%[VERIFICANDO]%NC% Build do projeto...
if exist build\ (
    dir /b build\*.js >nul 2>&1
    if errorlevel 1 (
        echo %YELLOW%⚠%NC% Diretório build vazio. Execute: npm run build
        set /a WARNINGS+=1
    ) else (
        echo %GREEN%✓%NC% Build encontrado
        set /a SUCCESS+=1
    )
) else (
    echo %YELLOW%⚠%NC% Diretório build não encontrado. Execute: npm run build
    set /a WARNINGS+=1
)

REM Verificar arquivo .env
echo.
echo %BLUE%[VERIFICANDO]%NC% Configuração .env...
if exist .env (
    echo %GREEN%✓%NC% Arquivo .env encontrado
    set /a SUCCESS+=1

    findstr /B "TOKEN=" .env >nul 2>&1
    if not errorlevel 1 (
        for /f "tokens=2 delims==" %%a in ('findstr /B "TOKEN=" .env') do set TOKEN=%%a
        if "!TOKEN!"=="6R0W53R135510" (
            echo %YELLOW%⚠%NC% TOKEN padrão detectado. Mude para produção!
            set /a WARNINGS+=1
        ) else (
            echo %GREEN%✓%NC% TOKEN customizado configurado
            set /a SUCCESS+=1
        )
    )
) else (
    echo %YELLOW%⚠%NC% Arquivo .env não encontrado. Copie .env.dev para .env
    set /a WARNINGS+=1
)

REM Verificar diretórios
echo.
echo %BLUE%[VERIFICANDO]%NC% Diretórios necessários...
for %%d in (logs downloads scripts) do (
    if exist %%d\ (
        echo %GREEN%✓%NC% Diretório %%d\ existe
        set /a SUCCESS+=1
    ) else (
        echo %YELLOW%⚠%NC% Diretório %%d\ não encontrado
        set /a WARNINGS+=1
    )
)

REM Verificar documentação
echo.
echo %BLUE%[VERIFICANDO]%NC% Documentação...
for %%f in (DEPLOY-LOCAL.md QUICKSTART.md README-DEPLOY.md .env.example) do (
    if exist %%f (
        echo %GREEN%✓%NC% %%f existe
        set /a SUCCESS+=1
    ) else (
        echo %YELLOW%⚠%NC% %%f não encontrado
        set /a WARNINGS+=1
    )
)

REM Verificar porta 3000
echo.
echo %BLUE%[VERIFICANDO]%NC% Porta 3000 (padrão)...
netstat -ano | findstr :3000 >nul 2>&1
if errorlevel 1 (
    echo %GREEN%✓%NC% Porta 3000 disponível
    set /a SUCCESS+=1
) else (
    echo %YELLOW%⚠%NC% Porta 3000 já está em uso
    set /a WARNINGS+=1
)

REM Resumo
echo.
echo %BLUE%===============================================================================%NC%
echo %BLUE%                       RESUMO DA VALIDAÇÃO%NC%
echo %BLUE%===============================================================================%NC%
echo.
echo %GREEN%✓ Sucessos:%NC%     !SUCCESS!
echo %YELLOW%⚠ Avisos:%NC%       !WARNINGS!
echo %RED%X Erros:%NC%        !ERRORS!
echo.

REM Recomendações
if !ERRORS! GTR 0 (
    echo %RED%[AÇÃO NECESSÁRIA]%NC%
    echo Há erros críticos que precisam ser corrigidos antes de continuar.
    echo.
    echo Execute os seguintes comandos conforme necessário:
    echo   - npm install              (instalar dependências^)
    echo   - npm run install:browsers (instalar navegadores^)
    echo   - npm run build:dev        (compilar projeto^)
    echo.
    pause
    exit /b 1
) else if !WARNINGS! GTR 0 (
    echo %YELLOW%[AVISOS DETECTADOS]%NC%
    echo Há alguns avisos, mas você pode continuar.
    echo.
    echo Comandos recomendados para resolver avisos:
    echo   - copy .env.dev .env       (criar arquivo de configuração^)
    echo   - npm run install:browsers (se navegadores não instalados^)
    echo.
    echo %GREEN%Você pode continuar, mas recomenda-se resolver os avisos.%NC%
    echo.
) else (
    echo %GREEN%===============================================================================%NC%
    echo %GREEN%                                                                              %NC%
    echo %GREEN%           ✓✓✓ INSTALAÇÃO VALIDADA COM SUCESSO! ✓✓✓%NC%
    echo %GREEN%                                                                              %NC%
    echo %GREEN%===============================================================================%NC%
    echo.
    echo Próximos passos:
    echo.
    echo   1. Iniciar o Browserless:
    echo      %YELLOW%npm start%NC%  ou  %YELLOW%npm run dev%NC%
    echo.
    echo   2. Acessar a documentação:
    echo      %YELLOW%http://localhost:3000/docs%NC%
    echo.
    echo   3. Consultar guias:
    echo      %YELLOW%QUICKSTART.md%NC%       - Guia rápido
    echo      %YELLOW%DEPLOY-LOCAL.md%NC%     - Documentação completa
    echo.
)

pause
exit /b !ERRORS!
