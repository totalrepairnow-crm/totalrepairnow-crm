#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "[1/3] Build..."
npm run build

echo "[2/3] Backup /var/www/crm -> /var/backups/crm_web"
sudo mkdir -p /var/backups/crm_web
sudo tar -C /var/www -czf /var/backups/crm_web/crm_web_$(date +%F_%H%M%S).tgz crm || true

echo "[3/3] Rsync -> /var/www/crm"
sudo mkdir -p /var/www/crm
sudo rsync -av --delete build/ /var/www/crm/

sudo chown -R root:root /var/www/crm
sudo find /var/www/crm -type d -exec chmod 755 {} \;
sudo find /var/www/crm -type f -exec chmod 644 {} \;

sudo systemctl reload nginx
echo "Deploy OK ✅"
