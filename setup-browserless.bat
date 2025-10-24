@echo off
REM ###############################################################################
REM Browserless - Script de Setup para Windows
REM
REM Este script automatiza a instalação e configuração do Browserless
REM para desenvolvimento local.
REM ###############################################################################

setlocal enabledelayedexpansion

REM Cores (usando códigos ANSI - requer Windows 10+)
set "BLUE=[94m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

REM Banner
call :print_banner

REM Verificações
echo.
call :log_info "Iniciando verificações de pré-requisitos..."
echo.

call :check_node
call :check_npm
call :check_git
call :check_docker

echo.
call :ask_installation_mode

if "%INSTALL_MODE%"=="check" (
    call :log_success "Verificação de pré-requisitos concluída!"
    goto :end
)

REM Criar diretórios
call :create_directories

REM Instalação
if "%INSTALL_MODE%"=="full" call :full_installation
if "%INSTALL_MODE%"=="quick" call :quick_installation

REM Informações finais
call :show_final_info

goto :end

REM ###############################################################################
REM Funções
REM ###############################################################################

:print_banner
echo %BLUE%
echo ===============================================================================
echo.
echo                         BROWSERLESS SETUP
echo.
echo              Deploy Local - Script de Configuração
echo.
echo ===============================================================================
echo %NC%
exit /b

:log_info
echo %BLUE%[INFO]%NC% %~1
exit /b

:log_success
echo %GREEN%[SUCCESS]%NC% %~1
exit /b

:log_warning
echo %YELLOW%[WARNING]%NC% %~1
exit /b

:log_error
echo %RED%[ERROR]%NC% %~1
exit /b

:check_node
call :log_info "Verificando Node.js..."

where node >nul 2>&1
if errorlevel 1 (
    call :log_error "Node.js não está instalado!"
    echo.
    echo Por favor, instale o Node.js versão 24.x:
    echo   - Via NVM Windows: https://github.com/coreybutler/nvm-windows
    echo   - Download direto: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_MAJOR=%%a
set NODE_MAJOR=%NODE_MAJOR:v=%

if not "%NODE_MAJOR%"=="24" (
    call :log_warning "Versão do Node.js incorreta. Requerido: v24.x"

    where nvm >nul 2>&1
    if not errorlevel 1 (
        call :log_info "NVM detectado. Instalando Node.js 24..."
        call nvm install 24
        call nvm use 24
        call :log_success "Node.js 24 instalado via NVM"
    ) else (
        call :log_error "Por favor, instale Node.js 24.x"
        echo.
        echo Você pode usar NVM para gerenciar versões do Node.js:
        echo   https://github.com/coreybutler/nvm-windows/releases
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%a in ('node -v') do set NODE_VERSION=%%a
    call :log_success "Node.js !NODE_VERSION! detectado"
)
exit /b

:check_npm
call :log_info "Verificando npm..."

where npm >nul 2>&1
if errorlevel 1 (
    call :log_error "npm não encontrado!"
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('npm -v') do set NPM_VERSION=%%a
call :log_success "npm !NPM_VERSION! detectado"
exit /b

:check_git
call :log_info "Verificando Git..."

where git >nul 2>&1
if errorlevel 1 (
    call :log_error "Git não está instalado!"
    echo Instale o Git: https://git-scm.com/downloads
    pause
    exit /b 1
)

for /f "tokens=3" %%a in ('git --version') do set GIT_VERSION=%%a
call :log_success "Git !GIT_VERSION! detectado"
exit /b

:check_docker
call :log_info "Verificando Docker (opcional)..."

where docker >nul 2>&1
if errorlevel 1 (
    call :log_warning "Docker não está instalado (opcional para desenvolvimento)"
    set DOCKER_AVAILABLE=false
) else (
    docker ps >nul 2>&1
    if errorlevel 1 (
        call :log_warning "Docker instalado mas não está rodando"
        set DOCKER_AVAILABLE=false
    ) else (
        call :log_success "Docker está instalado e rodando"
        set DOCKER_AVAILABLE=true
    )
)
exit /b

:ask_installation_mode
echo.
echo %YELLOW%Selecione o modo de instalação:%NC%
echo.
echo   1) Instalação Completa (recomendado para desenvolvimento)
echo      - Instala dependências
echo      - Instala navegadores
echo      - Faz build do projeto
echo      - Cria scripts auxiliares
echo.
echo   2) Instalação Rápida (apenas dependências)
echo      - Instala dependências npm
echo      - Você precisará instalar navegadores e fazer build manualmente
echo.
echo   3) Apenas verificar pré-requisitos
echo      - Não instala nada, apenas verifica o ambiente
echo.

set /p CHOICE="%YELLOW%Escolha uma opção [1-3]:%NC% "

if "%CHOICE%"=="1" (
    set INSTALL_MODE=full
) else if "%CHOICE%"=="2" (
    set INSTALL_MODE=quick
) else if "%CHOICE%"=="3" (
    set INSTALL_MODE=check
) else (
    call :log_error "Opção inválida"
    pause
    exit /b 1
)
exit /b

:create_directories
call :log_info "Criando diretórios necessários..."

if not exist logs mkdir logs
if not exist downloads mkdir downloads
if not exist scripts mkdir scripts

call :log_success "Diretórios criados"
exit /b

:install_dependencies
call :log_info "Instalando dependências do npm..."

call npm install
if errorlevel 1 (
    call :log_error "Falha ao instalar dependências"
    pause
    exit /b 1
)

call :log_success "Dependências instaladas com sucesso"
exit /b

:install_browsers
call :log_info "Instalando navegadores (Chromium, Firefox, WebKit, Edge)..."
call :log_warning "Este processo pode demorar alguns minutos e requer ~1-2GB de espaço"

call npm run install:browsers
if errorlevel 1 (
    call :log_error "Falha ao instalar navegadores"
    pause
    exit /b 1
)

call :log_success "Navegadores instalados com sucesso"
exit /b

:build_project
call :log_info "Fazendo build do projeto..."

set /p BUILD_CHOICE="%YELLOW%Deseja fazer build completo com debugger? [s/N]:%NC% "

if /i "%BUILD_CHOICE%"=="s" (
    call :log_info "Executando build completo (com debugger)..."
    call npm run build:dev
    if errorlevel 1 (
        call :log_error "Falha no build"
        pause
        exit /b 1
    )
    call :log_success "Build completo concluído"
) else (
    call :log_info "Executando build padrão..."
    call npm run build
    if errorlevel 1 (
        call :log_error "Falha no build"
        pause
        exit /b 1
    )
    call :log_success "Build concluído"
)
exit /b

:create_env_file
call :log_info "Configurando arquivo .env..."

if not exist .env (
    if exist .env.dev (
        copy .env.dev .env >nul
        call :log_success "Arquivo .env criado a partir de .env.dev"
        call :log_warning "IMPORTANTE: Arquivo .env criado com token padrão!"
        call :log_warning "Para produção, edite o arquivo .env e defina um token seguro"
    ) else (
        call :log_error "Arquivo .env.dev não encontrado"
        pause
        exit /b 1
    )
) else (
    call :log_info "Arquivo .env já existe, mantendo configuração atual"
)
exit /b

:create_helper_scripts
call :log_info "Criando scripts auxiliares..."

REM Script de start
echo @echo off > scripts\start.bat
echo echo Iniciando Browserless... >> scripts\start.bat
echo call npm start >> scripts\start.bat

REM Script de stop
echo @echo off > scripts\stop.bat
echo echo Parando Browserless... >> scripts\stop.bat
echo taskkill /F /FI "WINDOWTITLE eq Browserless*" /IM node.exe 2^>nul >> scripts\stop.bat
echo if errorlevel 1 ( >> scripts\stop.bat
echo     echo Nenhum processo encontrado >> scripts\stop.bat
echo ) else ( >> scripts\stop.bat
echo     echo Browserless parado >> scripts\stop.bat
echo ) >> scripts\stop.bat

REM Script de restart
echo @echo off > scripts\restart.bat
echo echo Reiniciando Browserless... >> scripts\restart.bat
echo call scripts\stop.bat >> scripts\restart.bat
echo timeout /t 2 /nobreak ^>nul >> scripts\restart.bat
echo call scripts\start.bat >> scripts\restart.bat

REM Script de status
echo @echo off > scripts\status.bat
echo echo Verificando status do Browserless... >> scripts\status.bat
echo tasklist /FI "IMAGENAME eq node.exe" 2^>nul ^| find /I "node.exe" ^>nul >> scripts\status.bat
echo if errorlevel 1 ( >> scripts\status.bat
echo     echo Browserless não está rodando >> scripts\status.bat
echo ) else ( >> scripts\status.bat
echo     echo Browserless está rodando >> scripts\status.bat
echo     tasklist /FI "IMAGENAME eq node.exe" >> scripts\status.bat
echo ) >> scripts\status.bat

call :log_success "Scripts auxiliares criados em .\scripts\"
exit /b

:quick_installation
call :install_dependencies
call :create_env_file
call :create_helper_scripts
exit /b

:full_installation
call :install_dependencies
call :create_env_file
call :create_helper_scripts
call :install_browsers
call :build_project
exit /b

:show_final_info
echo.
echo %GREEN%===============================================================================%NC%
echo %GREEN%                                                                              %NC%
echo %GREEN%              SETUP CONCLUÍDO COM SUCESSO!                                   %NC%
echo %GREEN%                                                                              %NC%
echo %GREEN%===============================================================================%NC%
echo.
echo %BLUE%Próximos passos:%NC%
echo.
echo   1. Iniciar o Browserless:
echo      %YELLOW%npm start%NC%  ou  %YELLOW%npm run dev%NC%
echo.
echo   2. Acessar a documentação:
echo      %YELLOW%http://localhost:3000/docs%NC%
echo.
echo   3. Acessar o debugger (se instalado):
echo      %YELLOW%http://localhost:3000/debugger/?token=6R0W53R135510%NC%
echo.
echo %BLUE%Scripts disponíveis:%NC%
echo   %YELLOW%scripts\start.bat%NC%     - Iniciar Browserless
echo   %YELLOW%scripts\stop.bat%NC%      - Parar Browserless
echo   %YELLOW%scripts\restart.bat%NC%   - Reiniciar Browserless
echo   %YELLOW%scripts\status.bat%NC%    - Verificar status
echo.

if "%DOCKER_AVAILABLE%"=="true" (
    echo %BLUE%Alternativa com Docker:%NC%
    echo   %YELLOW%docker run -p 3000:3000 ghcr.io/browserless/chromium%NC%
    echo.
)

echo %YELLOW%IMPORTANTE:%NC%
echo   - Edite o arquivo .env e altere o TOKEN para produção
echo   - Consulte DEPLOY-LOCAL.md para documentação completa
echo.

if "%INSTALL_MODE%"=="quick" (
    echo %YELLOW%Lembre-se de executar:%NC%
    echo   npm run install:browsers
    echo   npm run build:dev
    echo.
)

pause
exit /b

:end
endlocal
