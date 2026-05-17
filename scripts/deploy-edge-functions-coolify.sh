#!/usr/bin/env bash
# Deploya as edge functions do VilaFood pro container supabase-edge-functions
# do Coolify self-hosted.
#
# Como funciona:
#   O Supabase Edge Functions do Coolify monta /home/deno/functions/ como bind
#   mount do host (/data/coolify/services/<service-id>/volumes/functions). O
#   edge-runtime detecta novos arquivos automaticamente — sem precisar restart.
#
# Pre-requisitos:
#   - Container precisa de curl (instala temporariamente via apt-get update + install)
#   - Repo precisa ser publico OU usar PAT no GITHUB_REF (TODO)
#
# Uso:
#   1. Copiar o conteudo desse script
#   2. Coolify > vilafood-supabase > Terminal > supabase-edge-functions > Connect
#   3. Colar o script todo e dar Enter
#   4. Validar com `ls /home/deno/functions/ | wc -l` (esperado: ~62)
#
# Pra deploy idempotente: pode rodar varias vezes, sobrescreve por cima.
# Pra deploy de UMA funcao especifica, ver bloco SINGLE_FUNCTION abaixo.

set -e

REPO_OWNER="${REPO_OWNER:-doutorgigabyte}"
REPO_NAME="${REPO_NAME:-vila-food-nova}"
REPO_BRANCH="${REPO_BRANCH:-main}"
DEST_DIR="${DEST_DIR:-/home/deno/functions}"

echo "=== Verificando dependencias (curl, tar) ==="
if ! command -v curl >/dev/null 2>&1; then
  echo "curl nao encontrado. Instalando temporariamente via apt..."
  apt-get update -qq
  apt-get install -y --no-install-recommends curl ca-certificates 2>&1 | tail -3
fi
command -v tar >/dev/null 2>&1 || { echo "tar obrigatorio. abort."; exit 1; }

echo "=== Baixando tarball do GitHub ($REPO_OWNER/$REPO_NAME@$REPO_BRANCH) ==="
TARBALL_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/${REPO_BRANCH}.tar.gz"
cd /tmp
rm -f vfn.tar.gz
rm -rf vfn-extract
curl -sL "$TARBALL_URL" -o vfn.tar.gz
ls -la vfn.tar.gz

echo "=== Extraindo apenas supabase/functions/ ==="
mkdir -p vfn-extract
tar xzf vfn.tar.gz -C vfn-extract --strip-components=3 "${REPO_NAME}-${REPO_BRANCH}/supabase/functions"
EXTRACTED=$(ls -d vfn-extract/*/ 2>/dev/null | wc -l)
echo "Funcoes extraidas: $EXTRACTED"

echo "=== Copiando pra $DEST_DIR ==="
cp -r vfn-extract/. "$DEST_DIR/"

echo "=== Resultado ==="
echo "Total de subdirs em $DEST_DIR: $(ls -d $DEST_DIR/*/ | wc -l)"
echo "Funcoes deployadas:"
ls "$DEST_DIR/"

echo "=== Cleanup ==="
rm -f /tmp/vfn.tar.gz
rm -rf /tmp/vfn-extract

echo ""
echo "[OK] Deploy concluido. Edge-runtime detecta os arquivos automaticamente"
echo "     (hot-reload). Pra forcar reload, restart o container supabase-edge-functions."
echo ""
echo "Validar com:"
echo "  curl https://db.vilafood.delivery/functions/v1/store-seo?slug=marinacafeemporium \\"
echo "    -H 'Authorization: Bearer <ANON_KEY>'"
