describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('renders the login form', () => {
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('shows validation error on empty submit', () => {
    cy.get('button[type="submit"]').click();
    // Native HTML5 validation or custom error message
    cy.get('input[type="email"]').then(($el) => {
      expect(($el[0] as HTMLInputElement).validity.valid).to.be.false;
    });
  });

  it('shows error on invalid credentials', () => {
    cy.get('input[type="email"]').type('wrong@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.contains(/invalid|incorrect|unauthorized/i, { timeout: 6000 }).should('be.visible');
  });

  it('has a link to the registration page', () => {
    cy.get('a[href="/register"]').should('exist');
  });
});
