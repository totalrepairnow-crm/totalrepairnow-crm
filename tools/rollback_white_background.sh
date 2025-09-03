#!/usr/bin/env bash
set -euo pipefail

FILES=(
  "src/pages/Dashboard.jsx"
  "src/pages/Clients.jsx"
  "src/pages/ClientNew.jsx"
  "src/pages/ClientDetail.jsx"
  "src/pages/ClientView.jsx"
  "src/pages/Users.jsx"
)

cd ~/crm_app/frontend

for f in "${FILES[@]}"; do
  LAST_BAK=$(ls -1t "$f.bak."* 2>/dev/null | head -n1 || true)
  if [[ -n "$LAST_BAK" ]]; then
    cp -a "$LAST_BAK" "$f"
    echo "[RESTORED] $f from $LAST_BAK"
  else
    echo "[SKIP] No backup for $f"
  fi
done

LAST_CSS_BAK=$(ls -1t src/styles/app.css.bak.* 2>/dev/null | head -n1 || true)
if [[ -n "$LAST_CSS_BAK" ]]; then
  cp -a "$LAST_CSS_BAK" src/styles/app.css
  echo "[RESTORED] src/styles/app.css from $LAST_CSS_BAK"
fi

npm run build
sudo rsync -av --delete build/ /var/www/crm/
sudo systemctl reload nginx
