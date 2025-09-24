// crm_tests/cypress/e2e/smoke.api.cy.js
describe('CRM API — Smoke', () => {
  let token;
  let clientId;

  const email = Cypress.env('ADMIN_USER') || 'admin@totalrepairnow.com';
  const pass  = Cypress.env('ADMIN_PASS') || 'Alfa12345.';

  // 1) Health de invoices (no requiere auth)
  it('health (invoices/health) responde 200', () => {
    cy.request({
      method: 'GET',
      url: '/api/invoices/health',
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      // Aceptamos distintos formatos, pero si existe, que sea ok:true
      if (res.body && typeof res.body === 'object' && 'ok' in res.body) {
        expect(res.body.ok).to.eq(true);
      }
    });
  });

  // Helper: intenta login con email y, si no, con username
  function doLogin(user, password) {
    return cy.request({
      method: 'POST',
      url: '/api/login',
      body: { email: user, password },
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status === 200 && (res.body?.token || res.body?.accessToken)) {
        return res;
      }
      return cy.request({
        method: 'POST',
        url: '/api/login',
        body: { username: user, password },
        failOnStatusCode: false,
      });
    });
  }

  // 2) Login (no destructivo)
  it('login OK', () => {
    doLogin(email, pass).then((res) => {
      expect(res.status).to.eq(200);
      token = res.body?.accessToken || res.body?.token;
      expect(token, 'JWT token').to.be.a('string').and.have.length.greaterThan(20);
    });
  });

  // 3) Lista clientes (no CREA nada)
  it('lista clientes y toma uno', () => {
    cy.request({
      method: 'GET',
      url: '/api/clients',
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);           // esperamos 200
      expect(res.body).to.be.an('array');      // esperamos array
      if (Array.isArray(res.body) && res.body.length) {
        clientId = res.body[0].id;
        expect(clientId, 'first client id').to.satisfy(v => ['number', 'string'].includes(typeof v));
      }
    });
  });

  // 4) Lista servicios del cliente (no falla si el cliente no tiene servicios)
  it('lista servicios (autenticado)', () => {
    if (!clientId) {
      cy.log('No hay clientes para listar servicios, se omite sin fallo.');
      return;
    }
    cy.request({
      method: 'GET',
      url: `/api/clients/${clientId}/services`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 204]).to.include(res.status);
      if (res.status === 200) expect(res.body).to.be.an('array');
    });
  });
});
