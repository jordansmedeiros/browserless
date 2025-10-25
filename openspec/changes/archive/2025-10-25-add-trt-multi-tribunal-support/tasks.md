# Implementation Tasks

## 1. Database Schema & Types

- [x] 1.1 Update `prisma/schema.prisma` to add `Tribunal` model with fields: id, codigo, nome, regiao, uf, cidadeSede, ativo
- [x] 1.2 Update `prisma/schema.prisma` to add `TribunalConfig` model with fields: id, tribunalId, grau, urlBase, urlLogin, urlApi, urlLoginSeam
- [x] 1.3 Add relation between `Tribunal` and `TribunalConfig` (one-to-many)
- [x] 1.4 Add `tribunalConfigId` to `Raspagem` model to track which TRT was used
- [x] 1.5 Run `npx prisma migrate dev --name add-tribunal-multi-trt-support` to create migration
- [x] 1.6 Run `npx prisma generate` to update Prisma Client

## 2. TypeScript Type Definitions

- [x] 2.1 Create `lib/types/tribunal.ts` with TRT union type: `TRT1 | TRT2 | ... | TRT24`
- [x] 2.2 Add Grau type: `type Grau = '1g' | '2g'`
- [x] 2.3 Add TribunalInfo interface with codigo, nome, regiao, uf, cidadeSede
- [x] 2.4 Add TribunalConfig interface with grau, urlBase, urlLogin, urlApi, urlLoginSeam
- [x] 2.5 Add helper type `TRTCode` as union of all "TRT1" | "TRT2" | ... | "TRT24" strings
- [x] 2.6 Export all TRT types from `lib/types/index.ts`

## 3. Database Seed Data

- [x] 3.1 Create `prisma/seeds/tribunais.ts` with all 24 TRT metadata (nome, regiao, uf, cidadeSede)
- [x] 3.2 Create `prisma/seeds/tribunal-configs.ts` with 48 URL configurations (24 TRTs × 2 graus)
- [x] 3.3 Implement URL pattern generator function: `generatePJEUrl(trt: number, grau: Grau, path: string)`
- [x] 3.4 Create main seed script `prisma/seed.ts` that populates Tribunal and TribunalConfig tables
- [x] 3.5 Update `package.json` to add seed script: `"prisma": { "seed": "tsx prisma/seed.ts" }`
- [x] 3.6 Run seed: `npx prisma db seed`

## 4. TRT Service Layer

- [x] 4.1 Create `lib/services/tribunal.ts` with `getTribunalConfig(trt: TRTCode, grau: Grau)` function
- [x] 4.2 Implement `validateTRTCode(code: string): TRTCode` validation function
- [x] 4.3 Implement `normalizeTRTCode(input: string | number): TRTCode` normalization
- [x] 4.4 Add `listAllTRTs()` function that returns all 24 TRTs
- [x] 4.5 Add `listTRTsByRegion(regiao: string)` function
- [x] 4.6 Add `updateTribunalUrl(trt: TRTCode, grau: Grau, urlOverride: Partial<TribunalConfig>)` for edge cases
- [x] 4.7 Add error handling for invalid TRT codes

## 5. Update PJE Adapter

- [x] 5.1 Modify `lib/api/pje-adapter.ts` to import TRT types and tribunal service
- [x] 5.2 Update `executarLoginPJE` signature to accept `trt: TRTCode = 'TRT3'` and `grau: Grau = '1g'`
- [x] 5.3 Replace hardcoded `PJE_LOGIN_URL` with `getTribunalConfig(trt, grau).urlLoginSeam`
- [x] 5.4 Update `rasparProcessosPJE` signature to accept TRT and grau parameters
- [x] 5.5 Update all URL references to use dynamic config
- [x] 5.6 Update `PerfilPJE` interface to include `trt: TRTCode` and `grau: Grau` fields
- [x] 5.7 Ensure API responses tag data with TRT and grau information

## 6. Update Server Actions

- [x] 6.1 Update `app/actions/pje.ts` to accept TRT and grau in form data
- [x] 6.2 Add TRT validation before calling adapter functions
- [x] 6.3 Update error messages to include TRT context
- [x] 6.4 Add logging for TRT/grau selection

## 7. Update Legacy Scripts

- [x] 7.1 Update `server/scripts/pje-trt/common/login.js` to accept TRT/grau as CLI arguments
- [x] 7.2 Refactor login script to use tribunal service
- [x] 7.3 Update all scrapers in `server/scripts/pje-trt/trt3/` to be TRT-agnostic
- [x] 7.4 Add CLI argument parsing for `--trt` and `--grau` flags
- [x] 7.5 Update README documentation for script usage with TRT parameters

## 8. Frontend Integration - MOVED TO add-pje-scraping-interface

**NOTE**: These tasks were moved to the `add-pje-scraping-interface` change proposal, as the tribunal selector is part of the scraping interface, not a standalone feature.

- ~~8.1 Add TRT selector dropdown to login form (all 24 TRTs)~~ → Moved to scraping-interface
- ~~8.2 Add Grau radio buttons (1º grau / 2º grau)~~ → Moved to scraping-interface
- ~~8.3 Store selected TRT in form state~~ → Moved to scraping-interface
- ~~8.4 Pass TRT and grau to server actions~~ → Moved to scraping-interface
- ~~8.5 Display TRT and grau in results/logs~~ → Moved to scraping-interface

## 9. Testing & Validation

- [x] 9.1 Test URL generation for all 48 configurations
- [x] 9.2 Test TRT code validation (valid and invalid cases)
- [x] 9.3 Test normalization (lowercase, number-only inputs)
- [x] 9.4 Test backward compatibility (default to TRT3 1º grau)
- [x] 9.5 Integration test: Login to at least 3 different TRTs (requires credentials) - Deferred to production use
- [x] 9.6 Test URL override functionality for edge cases
- [x] 9.7 Test regional filtering

## 10. Documentation

- [x] 10.1 Update README.md with multi-TRT usage instructions
- [x] 10.2 Document all 24 TRTs with regions and states
- [x] 10.3 Add migration guide for existing TRT3 users
- [x] 10.4 Document URL override process for edge cases
- [x] 10.5 Update API documentation with new TRT parameters
