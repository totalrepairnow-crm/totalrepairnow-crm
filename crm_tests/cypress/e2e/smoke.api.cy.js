// crm_tests/cypress/e2e/smoke.api.cy.js
describe('CRM API — Smoke', () => {
  let token;
  let clientId;

  const email = Cypress.env('ADMIN_USER') || 'admin@totalrepairnow.com';
  const pass  = Cypress.env('ADMIN_PASS') || 'Alfa12345.';

  it('health (invoices/health) responde 200', () => {
    cy.request({
      method: 'GET',
      url: '/api/invoices/health',
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('ok', true);
    });
  });

  it('login OK (email/password)', () => {
    cy.request({
      method: 'POST',
      url: '/api/login',
      body: { email, password: pass },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.any.keys('accessToken', 'token');
      token = res.body.accessToken || res.body.token;
      expect(token).to.be.a('string').and.not.empty;
    });
  });

  it('lista clientes y toma uno', () => {
    cy.request({
      method: 'GET',
      url: '/api/clients',
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      // El backend puede devolver array o paginado {items:[]}
      const items = Array.isArray(res.body) ? res.body : (res.body.items || []);
      expect(items.length, 'cantidad de clientes').to.be.greaterThan(0);
      clientId = items[0].id;
      expect(clientId, 'first client id').to.be.a('number');
    });
  });

  it('lista servicios (autenticado)', () => {
    cy.request({
      method: 'GET',
      url: `/api/clients/${clientId}/services`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
    });
  });

  it('crea servicio y luego aparece en el listado', () => {
    const payload = { service_name: 'Initial Review', status: 'open' };

    cy.request({
      method: 'POST',
      url: `/api/clients/${clientId}/services`,
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
      failOnStatusCode: false,
    }).then((res) => {
      // algunos backends devuelven 201, otros 200 — aceptamos ambos
      expect([200, 201]).to.include(res.status);
      expect(res.body).to.have.property('id');
      return cy.request({
        method: 'GET',
        url: `/api/clients/${clientId}/services`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      });
    }).then((res2) => {
      expect(res2.status).to.eq(200);
      const names = (res2.body || []).map(s => s.service_name);
      expect(names).to.include('Initial Review');
    });
  });
});
