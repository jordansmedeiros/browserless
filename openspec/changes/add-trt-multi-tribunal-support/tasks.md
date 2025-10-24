# Implementation Tasks

## 1. Database Schema & Types

- [ ] 1.1 Update `prisma/schema.prisma` to add `Tribunal` model with fields: id, codigo, nome, regiao, uf, cidadeSede, ativo
- [ ] 1.2 Update `prisma/schema.prisma` to add `TribunalConfig` model with fields: id, tribunalId, grau, urlBase, urlLogin, urlApi, urlLoginSeam
- [ ] 1.3 Add relation between `Tribunal` and `TribunalConfig` (one-to-many)
- [ ] 1.4 Add `tribunalConfigId` to `Raspagem` model to track which TRT was used
- [ ] 1.5 Run `npx prisma migrate dev --name add-tribunal-multi-trt-support` to create migration
- [ ] 1.6 Run `npx prisma generate` to update Prisma Client

## 2. TypeScript Type Definitions

- [ ] 2.1 Create `lib/types/tribunal.ts` with TRT union type: `TRT1 | TRT2 | ... | TRT24`
- [ ] 2.2 Add Grau type: `type Grau = '1g' | '2g'`
- [ ] 2.3 Add TribunalInfo interface with codigo, nome, regiao, uf, cidadeSede
- [ ] 2.4 Add TribunalConfig interface with grau, urlBase, urlLogin, urlApi, urlLoginSeam
- [ ] 2.5 Add helper type `TRTCode` as union of all "TRT1" | "TRT2" | ... | "TRT24" strings
- [ ] 2.6 Export all TRT types from `lib/types/index.ts`

## 3. Database Seed Data

- [ ] 3.1 Create `prisma/seeds/tribunais.ts` with all 24 TRT metadata (nome, regiao, uf, cidadeSede)
- [ ] 3.2 Create `prisma/seeds/tribunal-configs.ts` with 48 URL configurations (24 TRTs × 2 graus)
- [ ] 3.3 Implement URL pattern generator function: `generatePJEUrl(trt: number, grau: Grau, path: string)`
- [ ] 3.4 Create main seed script `prisma/seed.ts` that populates Tribunal and TribunalConfig tables
- [ ] 3.5 Update `package.json` to add seed script: `"prisma": { "seed": "tsx prisma/seed.ts" }`
- [ ] 3.6 Run seed: `npx prisma db seed`

## 4. TRT Service Layer

- [ ] 4.1 Create `lib/services/tribunal.ts` with `getTribunalConfig(trt: TRTCode, grau: Grau)` function
- [ ] 4.2 Implement `validateTRTCode(code: string): TRTCode` validation function
- [ ] 4.3 Implement `normalizeTRTCode(input: string | number): TRTCode` normalization
- [ ] 4.4 Add `listAllTRTs()` function that returns all 24 TRTs
- [ ] 4.5 Add `listTRTsByRegion(regiao: string)` function
- [ ] 4.6 Add `updateTribunalUrl(trt: TRTCode, grau: Grau, urlOverride: Partial<TribunalConfig>)` for edge cases
- [ ] 4.7 Add error handling for invalid TRT codes

## 5. Update PJE Adapter

- [ ] 5.1 Modify `lib/api/pje-adapter.ts` to import TRT types and tribunal service
- [ ] 5.2 Update `executarLoginPJE` signature to accept `trt: TRTCode = 'TRT3'` and `grau: Grau = '1g'`
- [ ] 5.3 Replace hardcoded `PJE_LOGIN_URL` with `getTribunalConfig(trt, grau).urlLoginSeam`
- [ ] 5.4 Update `rasparProcessosPJE` signature to accept TRT and grau parameters
- [ ] 5.5 Update all URL references to use dynamic config
- [ ] 5.6 Update `PerfilPJE` interface to include `trt: TRTCode` and `grau: Grau` fields
- [ ] 5.7 Ensure API responses tag data with TRT and grau information

## 6. Update Server Actions

- [ ] 6.1 Update `app/actions/pje.ts` to accept TRT and grau in form data
- [ ] 6.2 Add TRT validation before calling adapter functions
- [ ] 6.3 Update error messages to include TRT context
- [ ] 6.4 Add logging for TRT/grau selection

## 7. Update Legacy Scripts

- [ ] 7.1 Update `server/scripts/pje-trt/common/login.js` to accept TRT/grau as CLI arguments
- [ ] 7.2 Refactor login script to use tribunal service
- [ ] 7.3 Update all scrapers in `server/scripts/pje-trt/trt3/` to be TRT-agnostic
- [ ] 7.4 Add CLI argument parsing for `--trt` and `--grau` flags
- [ ] 7.5 Update README documentation for script usage with TRT parameters

## 8. Frontend Integration

- [ ] 8.1 Add TRT selector dropdown to login form (all 24 TRTs)
- [ ] 8.2 Add Grau radio buttons (1º grau / 2º grau)
- [ ] 8.3 Store selected TRT in form state
- [ ] 8.4 Pass TRT and grau to server actions
- [ ] 8.5 Display TRT and grau in results/logs

## 9. Testing & Validation

- [ ] 9.1 Test URL generation for all 48 configurations
- [ ] 9.2 Test TRT code validation (valid and invalid cases)
- [ ] 9.3 Test normalization (lowercase, number-only inputs)
- [ ] 9.4 Test backward compatibility (default to TRT3 1º grau)
- [ ] 9.5 Integration test: Login to at least 3 different TRTs
- [ ] 9.6 Test URL override functionality for edge cases
- [ ] 9.7 Test regional filtering

## 10. Documentation

- [ ] 10.1 Update README-PJE.md with multi-TRT usage instructions
- [ ] 10.2 Document all 24 TRTs with regions and states
- [ ] 10.3 Add migration guide for existing TRT3 users
- [ ] 10.4 Document URL override process for edge cases
- [ ] 10.5 Update API documentation with new TRT parameters
