#!/usr/bin/env bash
set -euo pipefail

FRONT=~/crm_app/frontend
CSS="$FRONT/src/components/Header.css"

echo "[1/3] Reescribiendo Header.css (estilos solo para el header)…"
mkdir -p "$(dirname "$CSS")"
cat > "$CSS" <<'CSS'
/* ===== ESTILOS SOLO PARA EL HEADER ===== */
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: #111;          /* fondo oscuro */
  color: #fff;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.header .inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.header .logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header .logo img {
  height: 28px;
  width: auto;
}
.header .brand {
  font-weight: 600;
  font-size: 15px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header .spacer {
  flex: 1;
}

.header .nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header .nav a {
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.2s ease;
}
.header .nav a:hover {
  background: rgba(255,255,255,0.15);
}

.header .logout-btn {
  background: #e11d48;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.header .logout-btn:hover {
  filter: brightness(1.1);
}

/* Chip verde de estado API (opcional) */
.api-chip {
  background: #16a34a;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 700;
}
CSS

echo "[2/3] Compilando frontend…"
cd "$FRONT"
npm run build

echo "[3/3] Publicando en /var/www/crm …"
sudo rsync -av --delete "$FRONT/build/" /var/www/crm/
sudo systemctl reload nginx

echo "✅ Header restaurado. Refresca el navegador (Ctrl+Shift+R)."

