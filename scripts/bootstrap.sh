#!/usr/bin/env bash
# Genera las aplicaciones de Resolvia con las herramientas oficiales.
# Uso: bash scripts/bootstrap.sh   (desde la raíz del repositorio)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "▶ Backend (NestJS)"
if [ ! -f apps/api/package.json ]; then
  npx --yes @nestjs/cli new api --directory apps/api --package-manager npm --skip-git --strict
  (
    cd apps/api
    npm install @prisma/client @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer @nestjs/swagger
    npm install -D prisma @types/passport-jwt @types/bcrypt
    mkdir -p prisma
    cp "$ROOT/docs/modelo-datos.prisma" prisma/schema.prisma
  )
else
  echo "  apps/api ya existe, se omite."
fi

echo "▶ Frontend (React + Vite)"
if [ ! -f apps/web/package.json ]; then
  npm create vite@latest apps/web -- --template react-ts
  (cd apps/web && npm install)
else
  echo "  apps/web ya existe, se omite."
fi

echo "▶ Móvil (Flutter)"
if command -v flutter >/dev/null 2>&1; then
  if [ ! -f apps/mobile/pubspec.yaml ]; then
    flutter create --org com.wokerjj --project-name resolvia_mobile apps/mobile
  else
    echo "  apps/mobile ya existe, se omite."
  fi
else
  echo "  Flutter no está instalado; se omite la app móvil."
fi

echo ""
echo "✔ Listo. Siguientes pasos:"
echo "  1. cp .env.example .env"
echo "  2. docker compose up -d db"
echo "  3. cd apps/api && npx prisma migrate dev --name init"
