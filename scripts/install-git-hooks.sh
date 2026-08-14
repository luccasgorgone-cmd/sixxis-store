#!/usr/bin/env bash
# Instala o pre-commit local deste repo (tsc --noEmit + eslint nos arquivos
# staged + build). Não versionamos .git/hooks/ direto (git não versiona essa
# pasta), então cada clone precisa rodar este script uma vez:
#   bash scripts/install-git-hooks.sh
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_PATH="$REPO_ROOT/.git/hooks/pre-commit"

cat > "$HOOK_PATH" <<'EOF'
#!/usr/bin/env bash
# Gate local — roda os scripts REAIS que existem no package.json.
# Não inventa gate que o projeto não tem (sem suite de testes hoje).
set -e

echo "[pre-commit] typecheck (tsc --noEmit)..."
npx tsc --noEmit

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

echo "[pre-commit] OK (typecheck sempre; lint nos staged; build só se DATABASE_URL existir)"
EOF

chmod +x "$HOOK_PATH"
echo "pre-commit instalado em $HOOK_PATH"
