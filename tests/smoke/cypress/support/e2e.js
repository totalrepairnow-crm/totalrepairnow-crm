// ~/crm_tests/cypress/support/e2e.js

// Helper: intenta login en /api/login y si falla, prueba /api/auth/login
Cypress.Commands.add('apiLogin', (email, password) => {
  const tryLogin = (path) =>
    cy.request({
      method: 'POST',
      url: path,
      failOnStatusCode: false,
      body: { email, username: email, password },
      headers: { 'Content-Type': 'application/json' },
    });

  return tryLogin('/api/login').then((res1) => {
    if (res1.status === 200 && res1.body && res1.body.token) {
      return res1.body.token;
    }
    return tryLogin('/api/auth/login').then((res2) => {
      if (res2.status === 200 && res2.body && res2.body.token) {
        return res2.body.token;
      }
      throw new Error(
        `Login failed. /api/login => ${res1.status} ${JSON.stringify(res1.body)} ; ` +
        `/api/auth/login => ${res2.status} ${JSON.stringify(res2.body)}`
      );
    });
  });
});

