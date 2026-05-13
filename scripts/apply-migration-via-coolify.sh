#!/usr/bin/env bash
# Prepara uma migration SQL para ser aplicada no Supabase self-hosted
# do VilaFood via Coolify Web Terminal.
#
# Por que: container Postgres nao tem porta 5432 publica, repo pode
# ser privado, SSH pode estar com restricao. Codifica o SQL em
# gzip+base64 e copia pra clipboard. Depois, no Coolify > supabase-db >
# Terminal, cole o comando impresso, da Enter, fim.
#
# Uso:
#   ./scripts/apply-migration-via-coolify.sh supabase/migrations/20260619000000_testimonials_table.sql
#   ./scripts/apply-migration-via-coolify.sh -d agua  supabase/migrations/...sql   # banco custom
#   ./scripts/apply-migration-via-coolify.sh -u postgres ...                       # user custom
#
# Defaults:
#   DB_USER=supabase_admin
#   DB_NAME=postgres

set -euo pipefail

DB_USER="${DB_USER:-supabase_admin}"
DB_NAME="${DB_NAME:-postgres}"
COPY_TO_CLIPBOARD=1

print_usage() {
  cat <<EOF
Uso: $0 [opcoes] <arquivo.sql>

Opcoes:
  -u USER       Usuario do Postgres (default: supabase_admin)
  -d DBNAME     Nome do banco (default: postgres)
  --no-copy     Nao copiar pro clipboard (so imprime no stdout)
  -h | --help   Mostra esta ajuda

Exemplo:
  $0 supabase/migrations/20260619000000_testimonials_table.sql
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -u) DB_USER="$2"; shift 2 ;;
    -d) DB_NAME="$2"; shift 2 ;;
    --no-copy) COPY_TO_CLIPBOARD=0; shift ;;
    -h|--help) print_usage; exit 0 ;;
    -*) echo "Opcao desconhecida: $1" >&2; print_usage; exit 1 ;;
    *) SQL_FILE="$1"; shift ;;
  esac
done

if [[ -z "${SQL_FILE:-}" ]]; then
  echo "Erro: caminho do arquivo SQL e obrigatorio." >&2
  print_usage
  exit 1
fi

if [[ ! -f "$SQL_FILE" ]]; then
  echo "Erro: arquivo nao encontrado: $SQL_FILE" >&2
  exit 1
fi

if ! command -v gzip >/dev/null 2>&1; then
  echo "Erro: gzip nao instalado." >&2
  exit 1
fi

if ! command -v base64 >/dev/null 2>&1; then
  echo "Erro: base64 nao instalado." >&2
  exit 1
fi

# Detecta o flag -w0 (GNU coreutils) vs sem (BSD/macOS)
if base64 --help 2>&1 | grep -q -- '-w'; then
  B64="$(gzip -c "$SQL_FILE" | base64 -w0)"
else
  # macOS: base64 ja gera sem quebras de linha por padrao
  B64="$(gzip -c "$SQL_FILE" | base64 | tr -d '\n')"
fi

COMMAND="echo '$B64' | base64 -d | gunzip | psql -U $DB_USER -d $DB_NAME"

ORIGINAL_SIZE=$(wc -c < "$SQL_FILE")
ENCODED_SIZE=${#B64}

echo "============================================================"
echo "Migration: $SQL_FILE"
echo "  Tamanho SQL: $ORIGINAL_SIZE bytes"
echo "  Tamanho base64: $ENCODED_SIZE chars (compressao: $((100 - ENCODED_SIZE * 100 / ORIGINAL_SIZE))% menor)"
echo "  Destino: $DB_USER@$DB_NAME"
echo "============================================================"
echo ""
echo "COMANDO PRA COLAR no Coolify > supabase-db > Terminal:"
echo ""
echo "$COMMAND"
echo ""

# Copia pro clipboard se disponivel
if [[ "$COPY_TO_CLIPBOARD" == "1" ]]; then
  if command -v clip.exe >/dev/null 2>&1; then
    echo "$COMMAND" | clip.exe
    echo "[OK] Comando copiado pra clipboard (clip.exe / Windows)"
  elif command -v pbcopy >/dev/null 2>&1; then
    echo "$COMMAND" | pbcopy
    echo "[OK] Comando copiado pra clipboard (pbcopy / macOS)"
  elif command -v xclip >/dev/null 2>&1; then
    echo "$COMMAND" | xclip -selection clipboard
    echo "[OK] Comando copiado pra clipboard (xclip / Linux)"
  elif command -v wl-copy >/dev/null 2>&1; then
    echo "$COMMAND" | wl-copy
    echo "[OK] Comando copiado pra clipboard (wl-copy / Wayland)"
  else
    echo "[AVISO] Nenhuma ferramenta de clipboard detectada (clip.exe, pbcopy, xclip, wl-copy)."
    echo "        Copie o comando manualmente acima."
  fi
fi

echo ""
echo "Proximos passos:"
echo "  1. Abrir https://painel.vilafood.delivery (Coolify)"
echo "  2. Resources > supabase-bm30vj8tm3qze7pgi61ogai3 > supabase-db > Terminal"
echo "  3. Colar o comando, dar Enter"
echo "  4. Validar saida (CREATE TABLE / INSERT 0 N / CREATE POLICY ...)"
