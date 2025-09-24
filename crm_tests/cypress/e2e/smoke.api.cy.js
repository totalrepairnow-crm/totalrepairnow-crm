// cypress/e2e/smoke.api.cy.js

function norm(v, fallback) {
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim();
  if (s === '' || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null') return fallback;
  return s;
}

function buildUrl(path = '') {
  const baseUrl  = norm(Cypress.env('BASE_URL'),  'https://crm.totalrepairnow.com').replace(/\/+$/, '');
  const basePath = norm(Cypress.env('BASE_PATH'), 'api').replace(/^\/+|\/+$/g, '');
  const rest     = String(path || '').replace(/^\/+/, '');
  const url      = basePath ? `${baseUrl}/${basePath}/${rest}` : `${baseUrl}/${rest}`;
  cy.log(`ENV BASE_URL=${baseUrl} BASE_PATH=${basePath} → ${url}`);
  return url;
}

describe('CRM API — Smoke', () => {
  let token;
  let clientId;

  it('health (invoices/health) responde 200', () => {
    cy.request({
      method: 'GET',
      url: buildUrl('invoices/health'),
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 204]).to.include(res.status);
      expect(res.body).to.satisfy((b) => typeof b === 'object' || b === undefined);
    });
  });

  it('login ok', () => {
    const email = norm(Cypress.env('ADMIN_USER'), 'admin@totalrepairnow.com');
    const password = norm(Cypress.env('ADMIN_PASS'), 'Alfa12345.');

    cy.request({
      method: 'POST',
      url: buildUrl('login'),
      body: { email, password }, // el backend normaliza email/username
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201]);
      const t = res.body?.token || res.body?.data?.token;
      expect(t, 'jwt token').to.be.a('string').and.have.length.greaterThan(10);
      token = t;
    });
  });

  it('lista clientes y toma uno', () => {
    cy.request({
      method: 'GET',
      url: buildUrl('clients'),
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array').and.not.empty;
      clientId = res.body[0].id;
      expect(clientId).to.be.a('number');
    });
  });

  it('lista servicios del cliente', () => {
    cy.request({
      method: 'GET',
      url: buildUrl(`clients/${clientId}/services`),
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
    });
  });

  // (opcional) crear servicio y re-listar
  // it('crea servicio y aparece al listar', () => {
  //   const payload = { service_name: 'Initial Review', status: 'open' };
  //   cy.request({
  //     method: 'POST',
  //     url: buildUrl(`clients/${clientId}/services`),
  //     headers: { Authorization: `Bearer ${token}` },
  //     body: payload,
  //     failOnStatusCode: false,
  //   }).then((res) => {
  //     expect(res.status).to.be.oneOf([200, 201]);
  //     return cy.request({
  //       method: 'GET',
  //       url: buildUrl(`clients/${clientId}/services`),
  //       headers: { Authorization: `Bearer ${token}` },
  //       failOnStatusCode: false,
  //     });
  //   }).then((res2) => {
  //     expect(res2.status).to.eq(200);
  //     const names = (res2.body || []).map((s) => s.service_name);
  //     expect(names).to.include('Initial Review');
  //   });
  // });
});
