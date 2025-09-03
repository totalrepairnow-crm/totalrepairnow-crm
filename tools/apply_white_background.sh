#!/usr/bin/env bash
set -euo pipefail

FRONT=~/crm_app/frontend
CSS_FILE="$FRONT/src/styles/app.css"

FILES=(
  "$FRONT/src/pages/Dashboard.jsx"
  "$FRONT/src/pages/Clients.jsx"
  "$FRONT/src/pages/ClientNew.jsx"
  "$FRONT/src/pages/ClientDetail.jsx"
  "$FRONT/src/pages/ClientView.jsx"
  "$FRONT/src/pages/Users.jsx"
)

ts=$(date +%F_%H%M%S)
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    cp -a "$f" "${f}.bak.$ts"
  fi
done

if [ -f "$FRONT/src/pages/ClientView.jsx" ]; then
  perl -0777 -pe 's/\s*style=\{\s*\{\s*backgroundColor\s*:\s*"\#fff"\s*\}\s*\}//g' -i "$FRONT/src/pages/ClientView.jsx" || true
  perl -0777 -pe 's/\s*style=\{\s*\{\s*backgroundColor\s*:\s*"\#FFF"\s*\}\s*\}//g' -i "$FRONT/src/pages/ClientView.jsx" || true
fi

for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  perl -0777 -pe 's/className="\s*container(?![^"]*page-white)([^"]*)"/className="container\1 page-white"/g' -i "$f" || true
  perl -0777 -pe "s/className=\{\s*'container'(?![^}]*page-white)\s*\}/className={'container page-white'}/g" -i "$f" || true
  perl -0777 -pe 's/className=\{\s*"container"(?![^}]*page-white)\s*\}/className={"container page-white"}/g' -i "$f" || true
done

mkdir -p "$(dirname "$CSS_FILE")"
touch "$CSS_FILE"
if ! grep -q ".page-white" "$CSS_FILE"; then
  cat >> "$CSS_FILE" <<'CSS'
.page-white { background: #fff !important; }
CSS
fi

cd "$FRONT"
npm run build
if [ -x /usr/local/bin/crm_web_deploy.sh ]; then
  /usr/local/bin/crm_web_deploy.sh
else
  sudo rsync -av --delete "$FRONT/build/" /var/www/crm/
  sudo find /var/www/crm -type f -exec chmod 644 {} \;
  sudo find /var/www/crm -type d -exec chmod 755 {} \;
  sudo nginx -t && sudo systemctl reload nginx
fi
