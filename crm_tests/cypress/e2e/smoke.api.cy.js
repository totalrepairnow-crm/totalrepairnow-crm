describe('CRM API — Smoke', () => {
  let token;
  let clientId;

  const email = Cypress.env('ADMIN_USER') || 'admin@totalrepairnow.com';
  const pass  = Cypress.env('ADMIN_PASS') || 'Alfa12345.';

  it('health (invoices/health) 200', () => {
    cy.request({ method: 'GET', url: '/api/invoices/health', failOnStatusCode: false })
      .then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.have.property('ok', true);
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

  it('lista clientes y selecciona uno', () => {
    cy.request({
      method: 'GET',
      url: '/api/clients',
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      const items = Array.isArray(res.body) ? res.body : (res.body.items || []);
      expect(items.length, 'clients length').to.be.greaterThan(0);
      clientId = items[0].id;
      expect(clientId).to.be.a('number');
    });
  });

  it('lista servicios del cliente', () => {
    cy.request({
      method: 'GET',
      url: `/api/clients/${clientId}/services`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      // algunos backends devuelven [] si no hay servicios
      expect([200, 404]).to.include(res.status);
    });
  });
});
