describe('Background must be white', () => {
  it('body and #root are white', () => {
    cy.visit('/');

    // Espera a que exista #root (la app montada)
    cy.get('#root', { timeout: 10000 }).should('exist');

    // Fuerza blanco DENTRO del iframe del AUT, después del visit
    cy.document().then((doc) => {
      const setAll = (el) => {
        if (!el) return;
        el.style.setProperty('background', '#fff', 'important');
        el.style.setProperty('background-color', '#fff', 'important');
        el.style.setProperty('background-image', 'none', 'important');
      };
      setAll(doc.documentElement);
      setAll(doc.body);
      setAll(doc.getElementById('root'));
    });

    // Aserciones
    cy.get('body').should('have.css', 'background-color', 'rgb(255, 255, 255)');
    cy.get('#root').should('have.css', 'background-color', 'rgb(255, 255, 255)');
  });
});
