#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-.}"
cd "$PROJECT_ROOT"

echo "[1/9] Checking project files..."
test -f package.json || { echo "❌ package.json not found. Run this inside your React project root."; exit 1; }
test -d src || { echo "❌ src/ directory not found. Are you in the frontend root?"; exit 1; }

mkdir -p src/styles backups cypress/e2e

STAMP=$(date +%Y%m%d-%H%M%S)

echo "[2/9] Backing up important files to ./backups ..."
cp -a src/styles/app.css "backups/app.css.$STAMP" 2>/dev/null || true
cp -a src/App.jsx "backups/App.jsx.$STAMP" 2>/dev/null || true
cp -a src/pages/Clients.jsx "backups/Clients.jsx.$STAMP" 2>/dev/null || true
cp -a package.json "backups/package.json.$STAMP" 2>/dev/null || true

echo "[3/9] Ensuring styles/app.css exists and appending white-background contract (idempotent)..."
if [ ! -f src/styles/app.css ]; then
  touch src/styles/app.css
fi

if ! grep -q "STYLE CONTRACT: fondo blanco global" src/styles/app.css; then
cat <<'CSS' >> src/styles/app.css

/* === STYLE CONTRACT: fondo blanco global (no rompe UI) === */
:root { --bg: #fff !important; }
html, body, #root, .App {
  background-color: #fff !important;
  background-image: none !important;
}
header, .header, nav, .navbar {
  background-color: #fff !important;
  background-image: none !important;
}
CSS
fi

echo "[4/9] Ensuring './styles/app.css' import is last in src/App.jsx import block (if file exists)..."
node - <<'NODE'
const fs=require('fs');
const path='src/App.jsx';
if(!fs.existsSync(path)){ console.log('[i] src/App.jsx not found. Skipping import reordering.'); process.exit(0); }
let s=fs.readFileSync(path,'utf8');
const importLine="import './styles/app.css';";

if(!/import\s+['"]\.\/styles\/app\.css['"];?/.test(s)){
  // Insert after last import line
  const lines=s.split('\n');
  let i=0;
  while(i<lines.length && lines[i].startsWith('import ')) i++;
  lines.splice(i,0,importLine);
  s=lines.join('\n');
} else {
  // Move to end of import group
  const lines=s.split('\n');
  const imports=[];
  const rest=[];
  let i=0;
  while(i<lines.length && lines[i].startsWith('import ')){ imports.push(lines[i]); i++; }
  rest.push(...lines.slice(i));
  const importsNoStyle=imports.filter(l=>!l.includes("./styles/app.css"));
  importsNoStyle.push(importLine);
  s=[...importsNoStyle, ...rest].join('\n');
}
fs.writeFileSync(path,s);
console.log('[OK] App.jsx import adjusted');
NODE

echo "[5/9] Fixing common inline background issues in src/pages/Clients.jsx (if file exists)..."
node - <<'NODE'
const fs=require('fs');
const path='src/pages/Clients.jsx';
if(!fs.existsSync(path)){ console.log('[i] src/pages/Clients.jsx not found. Skipping inline fixes.'); process.exit(0); }
let s=fs.readFileSync(path,'utf8');
// Replace blue with white in inline backgroundColor
s=s.replace(/backgroundColor\s*:\s*['"]#0*d6efd['"]/gi, "backgroundColor: '#fff'");
// Remove duplicate backgroundColor inside style={{ ... }}
s=s.replace(/style=\{\{([\s\S]*?)\}\}/g, (m, inner)=>{
  // Split by commas not inside braces
  const parts = inner.split(/,(?![^{]*\})/);
  let seen=false;
  const out=[];
  for(let p of parts){
    if(/backgroundColor\s*:/.test(p)){
      if(seen){ continue; } else { seen=true; }
    }
    out.push(p);
  }
  return 'style={{' + out.join(',') + '}}';
});
fs.writeFileSync(path,s);
console.log('[OK] Clients.jsx background fixes applied');
NODE

echo "[6/9] Installing ESLint + Prettier and adding scripts (idempotent)..."
# Add scripts via npm pkg set (safe to ignore if npm version old)
npm pkg set scripts.lint="eslint src --ext .js,.jsx" >/dev/null 2>&1 || true
npm pkg set scripts.format="prettier -w ." >/dev/null 2>&1 || true
npm pkg set scripts.dev="vite || react-scripts start || npm start" >/dev/null 2>&1 || true
npm pkg set scripts.build="vite build || react-scripts build || npm run build" >/dev/null 2>&1 || true

npm install -D eslint prettier eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks >/dev/null 2>&1 || true

if [ ! -f .eslintrc.json ]; then
cat <<'JSON' > .eslintrc.json
{
  "extends": ["plugin:react/recommended", "prettier"],
  "plugins": ["react", "react-hooks"],
  "env": { "browser": true, "es2021": true },
  "parserOptions": { "ecmaFeatures": { "jsx": true }, "sourceType": "module" },
  "settings": { "react": { "version": "detect" } },
  "rules": {
    "no-dupe-keys": "error",
    "no-unused-vars": "warn",
    "react/prop-types": "off"
  }
}
JSON
fi

if [ ! -f .prettierrc ]; then
cat <<'JSON' > .prettierrc
{
  "printWidth": 100,
  "singleQuote": true,
  "trailingComma": "es5",
  "semi": true
}
JSON
fi

echo "[7/9] Installing Cypress and creating white-background e2e test..."
npm install -D cypress >/dev/null 2>&1 || true
npx cypress install >/dev/null 2>&1 || true
mkdir -p cypress/e2e

# Determine dev server URL heuristically
DEVURL="http://localhost:5173"
if grep -q "\"react-scripts\"" package.json; then DEVURL="http://localhost:3000"; fi

cat > cypress/e2e/background_white.cy.js <<JS
describe('Background must be white', () => {
  it('body and #root are white', () => {
    cy.visit('${DEVURL}');
    cy.get('body').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('#root').should('have.css', 'background-color', 'rgb(255, 255, 255)');
  });
});
JS

echo "[8/9] Formatting source files..."
npm run format >/dev/null 2>&1 || true

echo "[9/9] Done."
echo "✅ Setup completado."
echo "👉 Respaldos en ./backups/*.$STAMP"
echo "👉 Arranca el server:    npm run dev   (Vite)  o  react-scripts start (CRA)"
echo "👉 Ejecuta ESLint:       npm run lint"
echo "👉 Abre Cypress (GUI):   npx cypress open"
echo "👉 Ejecuta Cypress CLI:  npx cypress run"
