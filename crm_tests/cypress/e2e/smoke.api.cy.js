// crm_tests/cypress/e2e/smoke.api.cy.js
describe('CRM API — Smoke', () => {
  let token;
  let clientId;

  const email = Cypress.env('ADMIN_USER') || 'admin@totalrepairnow.com';
  const pass  = Cypress.env('ADMIN_PASS') || 'Alfa12345.';

  it('health (invoices/health o /health) responde 200', () => {
    // 1) Probar /api/invoices/health
    cy.request({
      method: 'GET',
      url: '/api/invoices/health',
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status === 200) {
        expect(res.body).to.satisfy((b) => b?.ok === true || b?.status === 'ok');
        return;
      }
      // 2) Fallback a /api/health
      return cy.request({
        method: 'GET',
        url: '/api/health',
        failOnStatusCode: false,
      }).then((res2) => {
        expect(res2.status).to.eq(200);
        expect(res2.body).to.satisfy((b) => b?.ok === true || b?.status === 'ok');
      });
    });
  });

  it('login OK', () => {
    cy.request('POST', '/api/login', { email, password: pass })
      .then((res) => {
        expect(res.status).to.eq(200);
        token = res.body.accessToken || res.body.token;
        expect(token, 'jwt').to.be.a('string').and.have.length.greaterThan(20);
      });
  });

  it('lista clientes y toma uno', () => {
    cy.request({
      method: 'GET',
      url: '/api/clients',
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      // API puede responder array o paginado; cubrimos ambos
      const items = Array.isArray(res.body) ? res.body : (res.body.items || []);
      expect(items, 'clients[]').to.be.an('array').and.to.have.length.greaterThan(0);
      clientId = items[0].id;
      expect(clientId, 'first client id').to.be.a('number');
    });
  });

  it('lista servicios (autenticado)', () => {
    // Si la API no expone /clients/:id/services, probamos /services con query
    cy.request({
      method: 'GET',
      url: `/api/clients/${clientId}/services`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      if (res.status === 200) {
        expect(res.body).to.be.an('array');
        return;
      }
      // Fallback: listar todos y filtrar por client_id (si existe ese shape)
      return cy.request({
        method: 'GET',
        url: `/api/services`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((res2) => {
        expect(res2.status).to.eq(200);
        const arr = Array.isArray(res2.body) ? res2.body : (res2.body.items || []);
        expect(arr).to.be.an('array');
      });
    });
  });
});
