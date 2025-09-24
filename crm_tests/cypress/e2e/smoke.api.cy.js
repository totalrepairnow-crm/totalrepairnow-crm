// crm_tests/cypress/e2e/smoke.api.cy.js

// ---- Helpers de URL y auth ----
function buildUrl(path = '') {
  const baseUrl  = (Cypress.env('BASE_URL')  || 'https://crm.totalrepairnow.com').replace(/\/+$/, '');
  const basePath = (Cypress.env('BASE_PATH') || 'api').replace(/^\/+/, '').replace(/\/+$/, '');
  const rest     = (path || '').replace(/^\/+/, '');
  const url      = basePath ? `${baseUrl}/${basePath}/${rest}` : `${baseUrl}/${rest}`;
  cy.log(`Resolved URL: ${url}`);
  return url;
}

function creds() {
  return {
    username: Cypress.env('ADMIN_USER') || 'admin@totalrepairnow.com',
    password: Cypress.env('ADMIN_PASS') || 'Alfa12345.',
  };
}

// ---- Suite ----
describe('CRM API — Smoke', () => {
  let token;     // JWT
  let clientId;  // primer cliente

  it('health (invoices/health) responde 200', () => {
    cy.request({
      method: 'GET',
      url: buildUrl('invoices/health'),
      failOnStatusCode: false,  // Para ver el cuerpo si algo falla
    }).then((res) => {
      expect(res.status, `status de health: ${res.status}`).to.eq(200);
      // health puede devolver {} o {ok:true} según tu handler; no lo forzamos
    });
  });

  it('login devuelve token', () => {
    const { username, password } = creds();
    cy.request({
      method: 'POST',
      url: buildUrl('login'),
      body: { username, password },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status, `status de login: ${res.status}`).to.eq(200);
      expect(res.body, 'login response').to.have.property('token');
      token = res.body.token;
    });
  });

  it('lista clients y toma el primero', () => {
    cy.request({
      method: 'GET',
      url: buildUrl('clients'),
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status, `status de clients: ${res.status}`).to.eq(200);
      expect(res.body).to.be.an('array').and.to.have.length.greaterThan(0);
      clientId = res.body[0].id;
      expect(clientId).to.be.a('number');
    });
  });

  it('lista services del cliente', () => {
    cy.request({
      method: 'GET',
      url: buildUrl(`clients/${clientId}/services`),
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status, `status de services: ${res.status}`).to.eq(200);
      expect(res.body).to.be.an('array');
    });
  });

  it('crea un service y lo re-lista', () => {
    const payload = { service_name: 'Initial Review', status: 'open' };

    cy.request({
      method: 'POST',
      url: buildUrl(`clients/${clientId}/services`),
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status, `status de create service: ${res.status}`).to.eq(201);
      expect(res.body).to.have.property('id');
    }).then(() => {
      return cy.request({
        method: 'GET',
        url: buildUrl(`clients/${clientId}/services`),
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      });
    }).then((res2) => {
      expect(res2.status, `status de relist services: ${res2.status}`).to.eq(200);
      const names = (res2.body || []).map(s => s.service_name);
      expect(names).to.include('Initial Review');
    });
  });
});
