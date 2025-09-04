const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Por defecto: LOCAL. Para forzar dominio, pásalo por CLI (ver comandos abajo).
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://127.0.0.1:3001',
    supportFile: 'cypress/support/e2e.js',
    retries: 1,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
  },
});

