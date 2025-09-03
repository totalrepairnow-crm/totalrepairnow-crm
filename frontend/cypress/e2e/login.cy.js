// cypress/e2e/login.cy.js

// Util: JWT "válido" para el frontend (exp en 2030). La firma da igual si tu front no la verifica.
function makeDummyJwt() {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const payload = btoa(
    JSON.stringify({
      sub: 'e2e',
      iat: 1735689600, // 2025-01-01
      exp: 1893456000, // 2030-01-01
    })
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const signature = 'e2e'; // placeholder
  return `${header}.${payload}.${signature}`;
}

describe('Auth / Login flow', () => {
  it('redirects unauthenticated user from / to /login', () => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.location('pathname').should('eq', '/login');
  });

  it('stays on /login on invalid credentials (no backend mocking)', () => {
    cy.clearLocalStorage();
    cy.visit('/login');

    // Ajusta selectores si tus inputs difieren:
    // intentamos por name, luego por type/placeholder
    cy.get('input[name="email"], input[type="email"], input[placeholder*="email" i]')
      .first()
      .type('fake@user.test');
    cy.get('input[name="password"], input[type="password"], input[placeholder*="password" i]')
      .first()
      .type('wrongpass');
    cy.get('button[type="submit"], button:contains("Login"), button:contains("Iniciar")')
      .first()
      .click();

    // Sin mock de backend, asumimos que no se setea token, así que seguimos en /login
    cy.location('pathname', { timeout: 4000 }).should('eq', '/login');
  });

  it('allows access to / with a valid token in localStorage', () => {
    const jwt = makeDummyJwt();

    cy.clearLocalStorage();
    cy.visit('/login'); // visitamos algo del dominio para tener window

    cy.window().then((win) => {
      // Intentamos cubrir las llaves más comunes
      win.localStorage.setItem('token', jwt);
      win.localStorage.setItem('authToken', jwt);
      win.localStorage.setItem('access_token', jwt);
    });

    cy.visit('/');

    // Debe permitir acceso (no estar en /login)
    cy.location('pathname', { timeout: 4000 }).should('not.eq', '/login');

    // Si tu Dashboard tiene un header/título conocido, puedes afirmarlo:
    // cy.contains(/dashboard/i).should('exist');
  });
});
