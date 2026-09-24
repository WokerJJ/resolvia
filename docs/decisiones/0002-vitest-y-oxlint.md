# ADR 0002 — Vitest y oxlint en lugar de Jest y ESLint

**Estado:** Aceptada · **Fecha:** 2026-09-24

## Contexto

El plan inicial usaba Jest para las pruebas y ESLint para el lint del backend. Al generar `apps/api` con `scripts/bootstrap.sh`, NestJS 12 (`@nestjs/cli new`) ya no crea proyectos con Jest y ESLint: el proyecto nuevo trae **Vitest** como runner de pruebas y **oxlint** (con `--type-aware`) como linter, ya configurados y en verde.

Había dos opciones: mantener lo que genera el framework o reemplazarlo por Jest y ESLint para respetar el plan original.

## Decisión

Se mantienen **Vitest** y **oxlint** tal como los genera NestJS 12. **Supertest** sigue siendo la herramienta para las pruebas e2e de los endpoints.

- Pruebas unitarias: archivos `*.spec.ts` junto al código, con `npm test` (`vitest run`, configuración en `vitest.config.ts`).
- Pruebas e2e: archivos `*.e2e-spec.ts` en `apps/api/test`, con `npm run test:e2e` (configuración en `vitest.config.e2e.ts`).
- Cobertura: `npm run test:cov` (proveedor `@vitest/coverage-v8`).
- Lint: `npm run lint` (`oxlint --type-aware src/ test/`).

## Consecuencias

- Seguimos el camino por defecto del framework: menos configuración propia que mantener y la documentación oficial de NestJS aplica directamente.
- Vitest es más rápido que Jest (reutiliza el pipeline de Vite y transforma TypeScript con esbuild), y además es el runner natural para `apps/web` (que también usa Vite), lo que permite tener una sola herramienta de pruebas en todo el monorepo.
- La API de Vitest es casi idéntica a la de Jest (`describe`, `it`, `expect`); los mocks usan `vi.fn()` y `vi.spyOn()` en lugar de `jest.fn()` y `jest.spyOn()`. Con `globals: true` no hace falta importar `describe`/`it`/`expect`.
- oxlint es mucho más rápido que ESLint, pero tiene un ecosistema de plugins más pequeño. Si en el futuro hace falta una regla que solo exista en ESLint, se evaluará en un nuevo ADR.
- La mayoría de tutoriales de NestJS anteriores a la versión 12 muestran Jest; al seguirlos hay que traducir los mocks a la sintaxis de Vitest.
