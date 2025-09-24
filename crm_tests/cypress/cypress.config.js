const { defineConfig } = require('cypress');

function joinUrl(a = '', b = '') {
  const A = String(a).replace(/\/+$/, '');
  const B = String(b).replace(/^\/+/, '');
  if (!A && !B) return '/';
  if (!A) return '/' + B;
  if (!B) return A;
  return `${A}/${B}`;
}

const BASE_URL  = process.env.CYPRESS_BASE_URL  || 'https://crm.totalrepairnow.com';
const BASE_PATH = process.env.CYPRESS_BASE_PATH || '';
const COMPUTED  = joinUrl(BASE_URL, BASE_PATH);

module.exports = defineConfig({
  e2e: {
    baseUrl: COMPUTED,
    specPattern: 'e2e/**/*.cy.js',
    supportFile: false,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 15000,
    requestTimeout: 15000,
    responseTimeout: 15000,
  },
});
