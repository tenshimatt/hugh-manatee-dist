# Frontend-Backend Integration Features
# Testing integration between new frontend https://afc39a6e.rawgle-frontend.pages.dev/ and existing backend

@integration @critical @new-frontend
Feature: Frontend-Backend Integration
  As a project coordinator
  I want to ensure the new frontend integrates seamlessly with the existing backend
  So that all GoHunta platform features work correctly across the integrated system

  Background:
    Given the backend is connected to the new frontend
    And API endpoints are configured for the new frontend

  @integration @smoke @critical
  Scenario: Complete user journey through integrated platform
    When I log in through the new frontend
    And I perform CRUD operations through the new frontend
    Then data should be consistently stored and retrieved from backend
    And the user experience should be seamless

  @route-planning @integration
  Scenario: Route planning integration with new frontend
    Given I am on the route planning page of the new frontend
    When I create a route through the new frontend interface
    Then the route should be saved to the backend database
    And GPS data should be properly formatted and stored
    And route sharing should work between frontend and backend

  @training-management @integration
  Scenario: Training management integration
    Given I am on the training page of the new frontend
    When I log a training session through the new frontend
    Then the training session should be stored in the backend
    And progress analytics should be calculated correctly
    And training data should sync across all user sessions

  @gear-reviews @integration
  Scenario: Gear reviews integration
    Given I am on the gear reviews page of the new frontend
    When I submit a gear review through the new frontend
    Then the gear review should be saved to the backend
    And review ratings should be aggregated correctly
    And gear recommendations should reflect new review data

  @ethics-conservation @integration
  Scenario: Ethics and conservation content integration
    Given I am on the ethics page of the new frontend
    When I access ethics content through the new frontend
    Then ethics content should load from the backend
    And conservation tracking should work properly
    And educational progress should be saved

  @community @integration
  Scenario: Community features integration
    Given I am on the community page of the new frontend
    When I create a community post through the new frontend
    Then the community post should be saved to the backend
    And real-time updates should work across the platform
    And community moderation tools should be accessible

  @pack-management @integration
  Scenario: Pack management integration
    Given I am logged in through the new frontend
    When I manage my dog pack through the new interface
    And I add, edit, and update dog profiles
    Then all pack data should sync with the backend
    And dog profile photos should upload correctly
    And health records should be properly stored

  @authentication @security @integration
  Scenario: Authentication system integration
    When I log in through the new frontend
    Then the backend should authenticate my session
    And JWT tokens should be properly managed
    And session persistence should work across page refreshes
    And logout should clear all authentication data

  @performance @integration
  Scenario: Performance optimization with integrated system
    When I load pages on the new frontend with backend data
    Then pages should load within performance thresholds
    And backend API calls should be optimized
    And caching should reduce redundant requests
    And mobile performance should meet rural connectivity requirements

  @offline @integration
  Scenario: Offline functionality integration
    Given I have accessed content through the new frontend
    When I go offline
    Then cached data should be available from local storage
    And offline indicators should display correctly
    And data should sync when connectivity returns
    And offline functionality should work on mobile devices

  @error-handling @integration
  Scenario: Error handling across integrated system
    When the backend is temporarily unavailable
    Then the new frontend should handle errors gracefully
    And users should see informative error messages
    And retry mechanisms should work automatically
    And no data should be lost during temporary outages

  @cross-browser @integration
  Scenario: Cross-browser compatibility
    Given I test the integration across different browsers
    When I access all major platform features
    Then functionality should work consistently across browsers
    And API calls should succeed regardless of browser
    And responsive design should adapt properly

  @mobile @integration
  Scenario: Mobile device integration
    Given I access the new frontend from a mobile device
    When I use all major platform features
    Then mobile-optimized backend integration should work
    And touch interfaces should properly trigger API calls
    And mobile data usage should be optimized

  @data-validation @integration
  Scenario: Data validation across frontend and backend
    When I submit forms through the new frontend
    Then frontend validation should match backend validation
    And error messages should be consistent
    And data types should be properly handled
    And edge cases should be handled gracefully

  @real-time @integration
  Scenario: Real-time features integration
    Given multiple users are using the platform
    When one user makes updates through the new frontend
    Then other users should see updates in real-time
    And notification systems should work correctly
    And data conflicts should be resolved properly

  @backup-recovery @integration
  Scenario: Data backup and recovery integration
    When I create and modify data through the new frontend
    Then data should be properly backed up in the backend
    And recovery mechanisms should work if data is corrupted
    And user data should be restorable from backups

  @security @integration
  Scenario: Security integration between frontend and backend
    When I interact with the platform through the new frontend
    Then all API calls should use secure protocols
    And sensitive data should be properly encrypted
    And user permissions should be enforced consistently
    And security headers should be properly set

  @api-versioning @integration
  Scenario: API versioning compatibility
    Given the backend may update API versions
    When I use features through the new frontend
    Then API version compatibility should be maintained
    And graceful degradation should occur for deprecated features
    And users should be notified of upcoming API changes

  @load-testing @integration @performance
  Scenario: Load testing integrated system
    When multiple users access the platform simultaneously
    Then the integrated system should handle concurrent load
    And response times should remain within acceptable limits
    And no data corruption should occur under load
    And system should scale appropriately with demand

  @monitoring @integration
  Scenario: System monitoring and alerting
    When the integrated system is running
    Then monitoring should track frontend-backend communication
    And alerts should be triggered for integration failures
    And performance metrics should be collected continuously
    And health checks should verify end-to-end functionality