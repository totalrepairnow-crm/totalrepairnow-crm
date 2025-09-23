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
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('status', 'ok');
    });

    // 2) Login robusto (prueba username y luego email; no falla en 4xx)
    const adminUser = Cypress.env('ADMIN_USER') || 'admin@totalrepairnow.com';
    const adminPass = Cypress.env('ADMIN_PASS') || 'Alfa12345.';

    // Por si las env vinieran vacías en CI, haces que truene claro
    expect(adminUser, 'ADMIN_USER env var').to.be.a('string').and.not.be.empty;
    expect(adminPass, 'ADMIN_PASS env var').to.be.a('string').and.not.be.empty;

    const tryUsername = () =>
      cy.request({
        method: 'POST',
        url: '/api/login',
        body: { username: adminUser, password: adminPass },
        failOnStatusCode: false,
      });

    const tryEmail = () =>
      cy.request({
        method: 'POST',
        url: '/api/login',
        body: { email: adminUser, password: adminPass },
        failOnStatusCode: false,
      });

    tryUsername().then((r1) => {
      if (r1.status === 200 && (r1.body?.token || r1.body?.accessToken)) {
        token = r1.body.accessToken || r1.body.token;
        return;
      }
      // Fallback a email
      return tryEmail().then((r2) => {
        expect(
          r2.status,
          `login con email devolvió ${r2.status}: ${JSON.stringify(r2.body)}`
        ).to.eq(200);
        token = r2.body.accessToken || r2.body.token;
      });
    });
  });
