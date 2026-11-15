#!/usr/bin/env bash
# Instala o pre-commit local deste repo (Prisma generate + tsc + testes +
# eslint nos arquivos staged + build). Git não versiona hooks, então cada
# clone precisa rodar este script uma vez:
#   bash scripts/install-git-hooks.sh
set -euo pipefail

HOOK_PATH="$(git rev-parse --git-path hooks/pre-commit)"

cat > "$HOOK_PATH" <<'EOF'
#!/usr/bin/env bash
# Gate local — roda os scripts REAIS que existem no package.json.
set -e

echo "[pre-commit] prisma generate..."
npx prisma generate

echo "[pre-commit] typecheck (tsc --noEmit)..."
npx tsc --noEmit

echo "[pre-commit] testes (vitest run)..."
npm test

STAGED_TS=$(git diff --cached --name-only --diff-filter=ACM -- '*.ts' '*.tsx' || true)
if [ -n "$STAGED_TS" ]; then
  echo "[pre-commit] lint (só arquivos staged, repo tem erros pré-existentes em arquivos não tocados)..."
  npx eslint $STAGED_TS
fi

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[pre-commit] build (prisma generate && next build)..."
  npm run build
else
  echo "[pre-commit] AVISO: build PULADO — sem DATABASE_URL no ambiente (Next 16 precisa de banco"
  echo "  real pra coletar dados de página). Commit local sem esse gate. Rode 'npm run build' com"
  echo "  DATABASE_URL configurado antes de considerar isso pronto pra produção."
fi

echo "[pre-commit] OK (Prisma/typecheck/testes sempre; lint nos staged; build só se DATABASE_URL existir)"
EOF

chmod +x "$HOOK_PATH"
echo "pre-commit instalado em $HOOK_PATH"
