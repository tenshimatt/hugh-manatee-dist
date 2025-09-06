// Custom commands for Cypress
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password') => {
  cy.session(
    [email, password],
    () => {
      cy.visit('/login')
      cy.get('[data-testid="email-input"]').type(email)
      cy.get('[data-testid="password-input"]').type(password)
      cy.get('[data-testid="login-submit"]').click()
      cy.url().should('not.include', '/login')
    },
    {
      validate: () => {
        cy.getCookie('auth-token').should('exist')
      },
    }
  )
})

Cypress.Commands.add('mockApi', (method, url, response) => {
  cy.intercept(method, url, response).as('mockedRequest')
})

// Accessibility testing command
Cypress.Commands.add('checkA11y', (context = null, options = {}) => {
  cy.checkA11y(context, {
    rules: {
      'color-contrast': { enabled: true },
      'focusable-content': { enabled: true },
    },
    ...options,
  })
})

// Performance testing
Cypress.Commands.add('lighthouse', (thresholds = {}) => {
  const defaultThresholds = {
    performance: 70,
    accessibility: 90,
    'best-practices': 80,
    seo: 80,
  }
  
  cy.lighthouse({ ...defaultThresholds, ...thresholds })
})