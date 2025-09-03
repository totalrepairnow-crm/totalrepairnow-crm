const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // ⚙️ Por defecto probamos contra PROD; puedes sobreescribir con la env CRM_BASE_URL
    baseUrl: process.env.CRM_BASE_URL || 'https://crm.totalrepairnow.com',

    // Dónde están los specs
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',

    // Archivo de soporte que ya tienes
    supportFile: 'cypress/support/e2e.js',

    // Desactiva video para servidores headless
    video: false,
  },
});
