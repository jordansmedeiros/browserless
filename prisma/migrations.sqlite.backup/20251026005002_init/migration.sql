-- CreateTable
CREATE TABLE "Tribunal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "regiao" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "cidadeSede" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TribunalConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grau" TEXT NOT NULL,
    "urlBase" TEXT NOT NULL,
    "urlLoginSeam" TEXT NOT NULL,
    "urlApi" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tribunalId" TEXT NOT NULL,
    CONSTRAINT "TribunalConfig_tribunalId_fkey" FOREIGN KEY ("tribunalId") REFERENCES "Tribunal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Raspagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "idAgrupamento" INTEGER,
    "totalProcessos" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "tribunalConfigId" TEXT,
    CONSTRAINT "Raspagem_tribunalConfigId_fkey" FOREIGN KEY ("tribunalConfigId") REFERENCES "TribunalConfig" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Processo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroProcesso" TEXT NOT NULL,
    "dataAjuizamento" TEXT,
    "classe" TEXT,
    "assunto" TEXT,
    "vara" TEXT,
    "fase" TEXT,
    "valor" REAL,
    "nomeParteAutora" TEXT,
    "nomeParteRe" TEXT,
    "idProcesso" TEXT,
    "dataUltimaMovimentacao" TEXT,
    "situacao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "raspagemId" TEXT,
    CONSTRAINT "Processo_raspagemId_fkey" FOREIGN KEY ("raspagemId") REFERENCES "Raspagem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Parte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "documento" TEXT,
    "processoId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Parte_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Escritorio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Advogado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "oabNumero" TEXT NOT NULL,
    "oabUf" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "idAdvogado" TEXT,
    "escritorioId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Advogado_escritorioId_fkey" FOREIGN KEY ("escritorioId") REFERENCES "Escritorio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Credencial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senha" TEXT NOT NULL,
    "descricao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "advogadoId" TEXT NOT NULL,
    CONSTRAINT "Credencial_advogadoId_fkey" FOREIGN KEY ("advogadoId") REFERENCES "Advogado" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CredencialTribunal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipoTribunal" TEXT NOT NULL,
    "validadoEm" DATETIME,
    "credencialId" TEXT NOT NULL,
    "tribunalConfigId" TEXT NOT NULL,
    CONSTRAINT "CredencialTribunal_credencialId_fkey" FOREIGN KEY ("credencialId") REFERENCES "Credencial" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CredencialTribunal_tribunalConfigId_fkey" FOREIGN KEY ("tribunalConfigId") REFERENCES "TribunalConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScrapeJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "scrapeType" TEXT NOT NULL,
    "scrapeSubType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ScrapeJobTribunal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "scrapeJobId" TEXT NOT NULL,
    "tribunalConfigId" TEXT NOT NULL,
    CONSTRAINT "ScrapeJobTribunal_scrapeJobId_fkey" FOREIGN KEY ("scrapeJobId") REFERENCES "ScrapeJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScrapeJobTribunal_tribunalConfigId_fkey" FOREIGN KEY ("tribunalConfigId") REFERENCES "TribunalConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScrapeExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "processosCount" INTEGER NOT NULL DEFAULT 0,
    "resultData" TEXT,
    "executionLogs" TEXT,
    "errorMessage" TEXT,
    "retryAttempt" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "scrapeJobId" TEXT NOT NULL,
    "tribunalConfigId" TEXT NOT NULL,
    CONSTRAINT "ScrapeExecution_scrapeJobId_fkey" FOREIGN KEY ("scrapeJobId") REFERENCES "ScrapeJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScrapeExecution_tribunalConfigId_fkey" FOREIGN KEY ("tribunalConfigId") REFERENCES "TribunalConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tribunal_codigo_key" ON "Tribunal"("codigo");

-- CreateIndex
CREATE INDEX "Tribunal_codigo_idx" ON "Tribunal"("codigo");

-- CreateIndex
CREATE INDEX "Tribunal_regiao_idx" ON "Tribunal"("regiao");

-- CreateIndex
CREATE INDEX "Tribunal_ativo_idx" ON "Tribunal"("ativo");

-- CreateIndex
CREATE INDEX "TribunalConfig_grau_idx" ON "TribunalConfig"("grau");

-- CreateIndex
CREATE UNIQUE INDEX "TribunalConfig_tribunalId_grau_key" ON "TribunalConfig"("tribunalId", "grau");

-- CreateIndex
CREATE INDEX "Raspagem_status_idx" ON "Raspagem"("status");

-- CreateIndex
CREATE INDEX "Raspagem_tipo_idx" ON "Raspagem"("tipo");

-- CreateIndex
CREATE INDEX "Raspagem_createdAt_idx" ON "Raspagem"("createdAt");

-- CreateIndex
CREATE INDEX "Raspagem_tribunalConfigId_idx" ON "Raspagem"("tribunalConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "Processo_numeroProcesso_key" ON "Processo"("numeroProcesso");

-- CreateIndex
CREATE INDEX "Processo_numeroProcesso_idx" ON "Processo"("numeroProcesso");

-- CreateIndex
CREATE INDEX "Processo_nomeParteAutora_idx" ON "Processo"("nomeParteAutora");

-- CreateIndex
CREATE INDEX "Processo_nomeParteRe_idx" ON "Processo"("nomeParteRe");

-- CreateIndex
CREATE INDEX "Processo_createdAt_idx" ON "Processo"("createdAt");

-- CreateIndex
CREATE INDEX "Parte_tipo_idx" ON "Parte"("tipo");

-- CreateIndex
CREATE INDEX "Parte_processoId_idx" ON "Parte"("processoId");

-- CreateIndex
CREATE INDEX "Advogado_cpf_idx" ON "Advogado"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Advogado_oabNumero_oabUf_key" ON "Advogado"("oabNumero", "oabUf");

-- CreateIndex
CREATE UNIQUE INDEX "Credencial_advogadoId_senha_key" ON "Credencial"("advogadoId", "senha");

-- CreateIndex
CREATE UNIQUE INDEX "CredencialTribunal_credencialId_tribunalConfigId_key" ON "CredencialTribunal"("credencialId", "tribunalConfigId");

-- CreateIndex
CREATE INDEX "ScrapeJob_status_idx" ON "ScrapeJob"("status");

-- CreateIndex
CREATE INDEX "ScrapeJob_scrapeType_idx" ON "ScrapeJob"("scrapeType");

-- CreateIndex
CREATE INDEX "ScrapeJob_createdAt_idx" ON "ScrapeJob"("createdAt");

-- CreateIndex
CREATE INDEX "ScrapeJobTribunal_status_idx" ON "ScrapeJobTribunal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ScrapeJobTribunal_scrapeJobId_tribunalConfigId_key" ON "ScrapeJobTribunal"("scrapeJobId", "tribunalConfigId");

-- CreateIndex
CREATE INDEX "ScrapeExecution_status_idx" ON "ScrapeExecution"("status");

-- CreateIndex
CREATE INDEX "ScrapeExecution_scrapeJobId_idx" ON "ScrapeExecution"("scrapeJobId");

-- CreateIndex
CREATE INDEX "ScrapeExecution_tribunalConfigId_idx" ON "ScrapeExecution"("tribunalConfigId");

-- CreateIndex
CREATE INDEX "ScrapeExecution_createdAt_idx" ON "ScrapeExecution"("createdAt");
