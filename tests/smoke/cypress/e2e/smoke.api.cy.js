// crm_tests/cypress/e2e/smoke.api.cy.js
// Ejecuta con envs (en GitHub o local):
//  CYPRESS_BASE_URL=https://crm.totalrepairnow.com \
//  CYPRESS_ADMIN_USER="admin@totalrepairnow.com" \
//  CYPRESS_ADMIN_PASS="TU_PASSWORD" \
//  npx cypress run --spec "cypress/e2e/smoke.api.cy.js"

describe('CRM API — Smoke', () => {
  const BASE = `${Cypress.env('BASE_URL')}/api`;
  const ADMIN_USER = Cypress.env('ADMIN_USER') || 'admin@totalrepairnow.com';
  const ADMIN_PASS = Cypress.env('ADMIN_PASS') || 'Alfa12345.';

  let token;
  let clientId;
  let createdServiceId;

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('health (invoices/health) responde 200', () => {
    cy.request(`${BASE}/invoices/health`).its('status').should('eq', 200);
  });

  it('puede hacer login y obtener token', () => {
    cy.request('POST', `${BASE}/login`, {
      // el backend acepta email/password; también soporta "username",
      // pero usamos "email" para ser explícitos.
      email: ADMIN_USER,
      password: ADMIN_PASS,
    }).then((res) => {
      expect(res.status).to.eq(200);
      token = res.body?.accessToken || res.body?.token;
      expect(token, 'JWT').to.be.a('string').and.have.length.greaterThan(10);
    });
  });

  it('lista clientes y toma uno', () => {
    cy.request({ url: `${BASE}/clients`, headers: auth() }).then((res) => {
      expect(res.status).to.eq(200);
      // /clients puede devolver {items:[...], ...} (paginado) o un array simple;
      const items = Array.isArray(res.body) ? res.body : res.body.items || [];
      expect(items.length, 'cantidad de clientes').to.be.greaterThan(0);
      clientId = items[0].id;
      expect(clientId, 'client id').to.be.a('number');
    });
  });

  it('lista servicios (autenticado)', () => {
    cy.request({ url: `${BASE}/services`, headers: auth() }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
    });
  });

  it('crea un servicio y lo verifica en el listado', () => {
    const name = `Smoke Service ${Date.now()}`;
    const payload = {
      client_id: clientId,
      service_name: name,
      description: name,
      quantity: 1,
      unit_price: 10,
      status: 'scheduled',
    };

    cy.request({
      method: 'POST',
      url: `${BASE}/services`,
      headers: auth(),
      body: payload,
    })
      .then((res) => {
        // En algunos entornos devuelve 200, en otros 201
        expect(res.status).to.be.within(200, 201);
        createdServiceId = res.body?.id;
        expect(createdServiceId, 'service id creado').to.be.a('number');

        return cy.request({ url: `${BASE}/services`, headers: auth() });
      })
      .then((res2) => {
        const rows = res2.body;
        // Verificamos por (client_id + nombre) para evitar falsos positivos
        const found = rows.some(
          (s) => s.client_id === clientId && s.service_name === payload.service_name,
        );
        expect(found, 'servicio recién creado visible en listado').to.eq(true);
      });
  });
});
