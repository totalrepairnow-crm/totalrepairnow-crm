describe('CRM API Smoke', () => {
  let token;
  let clientId;

  before(() => {
    // 1) Health
    cy.request({
      method: 'GET',
      url: '/api/health',
      failOnStatusCode: false,
    }).then((res) => {
      // Debe ser 200 si el backend local está arriba
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('status', 'ok');
    });

    // 2) Login (username/email aceptado por el normalizador del backend)
    const adminUser = Cypress.env('ADMIN_USER') || 'admin@totalrepairnow.com';
    const adminPass = Cypress.env('ADMIN_PASS') || 'Alfa12345.';

    cy.request('POST', '/api/login', {
      username: adminUser,
      password: adminPass,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('token');
      token = res.body.token;
    });
  });

  it('lists clients and selects the first id', () => {
    cy.request({
      method: 'GET',
      url: '/api/clients',
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array').and.to.have.length.greaterThan(0);
      clientId = res.body[0].id;
      expect(clientId, 'first client id').to.be.a('number');
    });
  });

  it('lists services for selected client', () => {
    cy.request({
      method: 'GET',
      url: `/api/clients/${clientId}/services`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
    });
  });

  it('creates a service and finds it on relist', () => {
    const payload = { service_name: 'Initial Review', status: 'open' };

    cy.request({
      method: 'POST',
      url: `/api/clients/${clientId}/services`,
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body).to.have.property('id');
      return cy.request({
        method: 'GET',
        url: `/api/clients/${clientId}/services`,
        headers: { Authorization: `Bearer ${token}` },
      });
    }).then((res2) => {
      const names = res2.body.map((s) => s.service_name);
      expect(names).to.include('Initial Review');
    });
  });
});

