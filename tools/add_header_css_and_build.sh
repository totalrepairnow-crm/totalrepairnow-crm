#!/usr/bin/env bash
set -euo pipefail

FRONT=~/crm_app/frontend
COMP="$FRONT/src/components"

echo "[1/3] Crear Header.css (si no existe)"
mkdir -p "$COMP"
cat > "$COMP/Header.css" <<'CSS'
.header{
  display:flex;align-items:center;gap:16px;
  padding:12px 16px;border-bottom:1px solid #e5e7eb;background:#fff;
  position:sticky;top:0;z-index:50
}
.header .brand{display:flex;align-items:center;font-weight:600}
.header .nav{margin-left:auto;display:flex;align-items:center;gap:12px}
.header .nav a{color:#111;text-decoration:none;padding:6px 10px;border-radius:10px}
.header .nav a:hover{background:#f3f4f6}
.btn{display:inline-flex;align-items:center;gap:6px;border:1px solid #e5e7eb;
  background:#111;color:#fff;padding:8px 12px;border-radius:12px;cursor:pointer}
.btn.ghost{background:#fff;color:#111}
.btn.small{padding:6px 10px;font-size:14px}
.spacer{flex:1}
CSS

echo "[2/3] Build del frontend"
cd "$FRONT"
npm run build

echo "[3/3] Deploy a /var/www/crm"
sudo rsync -av --delete "$FRONT/build/" /var/www/crm/
sudo find /var/www/crm -type f -exec chmod 644 {} \;
sudo find /var/www/crm -type d -exec chmod 755 {} \;
sudo systemctl reload nginx

echo "[OK] Header.css creado y frontend publicado."
