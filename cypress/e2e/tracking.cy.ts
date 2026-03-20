describe('Tracking Page', () => {
  beforeEach(() => {
    // Log in as client
    cy.request('POST', '/api/auth/register', {
      firstName: 'Track',
      lastName: 'Tester',
      email: `cy_track_${Date.now()}@example.com`,
      password: 'Password123!',
    }).then((res) => {
      const { token, user } = res.body.data;
      localStorage.setItem(
        'kesmoving-auth',
        JSON.stringify({ state: { token, user }, version: 0 })
      );

      // Create a booking so we have a real booking ID
      cy.request({
        method: 'POST',
        url: '/api/bookings',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          moveDate: '2099-12-01T00:00:00.000Z',
          moveSize: '2-bedroom',
          pickupAddress: {
            street: '10 Pine Rd',
            city: 'Ottawa',
            province: 'ON',
            postalCode: 'K1A 0B1',
            country: 'Canada',
          },
          destinationAddress: {
            street: '20 Elm St',
            city: 'Gatineau',
            province: 'QC',
            postalCode: 'J8P 1A1',
            country: 'Canada',
          },
          contactPhone: '613-555-0200',
        },
      }).then((bookingRes) => {
        const bookingId = bookingRes.body.data._id;
        cy.wrap(bookingId).as('bookingId');
      });
    });
  });

  it('renders the tracking page container', function () {
    cy.visit(`/track/${this.bookingId}`);
    // Map container or fallback message should be visible
    cy.get('[data-testid="tracking-map"], #tracking-map, .tracking-container, [class*="map"]', {
      timeout: 8000,
    }).should('exist');
  });

  it('shows a status indicator', function () {
    cy.visit(`/track/${this.bookingId}`);
    cy.contains(/live|offline|tracking/i, { timeout: 8000 }).should('be.visible');
  });
});
