// Inyecta CSS en la ventana de la AUT antes de que la app ejecute sus estilos
Cypress.on('window:before:load', (win) => {
  try {
    const id = 'cypress-white-bg';
    if (!win.document.getElementById(id)) {
      const style = win.document.createElement('style');
      style.id = id;
      style.textContent = `
        html, body, #root {
          background: #fff !important;
          background-color: #fff !important;
          background-image: none !important;
        }
      `;
      win.document.head.appendChild(style);
    }
  } catch (e) {}
});

// Refuerzo por si algo reescribe luego de cargar
Cypress.on('window:load', (win) => {
  try {
    const setAll = (el) => {
      if (!el) return;
      el.style.setProperty('background', '#fff', 'important');
      el.style.setProperty('background-color', '#fff', 'important');
      el.style.setProperty('background-image', 'none', 'important');
    };
    setAll(win.document.documentElement);
    setAll(win.document.body);
    const root = win.document.getElementById('root');
    setAll(root);
  } catch (e) {}
});
