#!/usr/bin/env bash
set -euo pipefail

ROOT=~/crm_app/frontend/src/pages
FILES=(
  "Dashboard.jsx"
  "Clients.jsx"
  "ClientNew.jsx"
  "ClientDetail.jsx"
  "ClientView.jsx"
  "Users.jsx"
)

echo "[1/3] Backups"
for f in "${FILES[@]}"; do
  [ -f "$ROOT/$f" ] || { echo "[SKIP] $f no existe"; continue; }
  cp -a "$ROOT/$f" "$ROOT/$f.bak.$(date +%s)"
done

echo "[2/3] Aplicando fondo blanco en contenedores"
for f in "${FILES[@]}"; do
  P="$ROOT/$f"
  [ -f "$P" ] || continue

  # Si ya tiene style, fuerza backgroundColor:#fff dentro del style existente de ese contenedor
  # 1) .container client-detail | client-view | solo .container
  # Inserta/actualiza backgroundColor: "#fff" sin romper otros estilos inline

  # A) container con style ya presente
  sed -i '
    0,/<div className="container[^\"]*"\s*style={{[^}]*}}>/ {
      s/<div className="container\([^"]*\)"\s*style={{\([^}]*\)}}>/<div className="container\1" style={{ \2, backgroundColor: "#fff" }}>/
    }
  ' "$P"

  # B) si no había style, lo añade (casos: container, container client-detail, container client-view)
  sed -i '
    0,/<div className="container client-detail">/ {
      s/<div className="container client-detail">/<div className="container client-detail" style={{ backgroundColor: "#fff" }}>/
    }
  ' "$P"

  sed -i '
    0,/<div className="container client-view">/ {
      s/<div className="container client-view">/<div className="container client-view" style={{ backgroundColor: "#fff" }}>/
    }
  ' "$P"

  sed -i '
    0,/<div className="container">/ {
      s/<div className="container">/<div className="container" style={{ backgroundColor: "#fff" }}>/
    }
  ' "$P"

  echo "[OK] $f"
done

echo "[3/3] Build y deploy"
cd ~/crm_app/frontend
npm run build
sudo rsync -av --delete build/ /var/www/crm/
sudo systemctl reload nginx
echo "[DONE] Fondo blanco aplicado y publicado."
