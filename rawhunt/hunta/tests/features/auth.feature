# Authentication Features
# Testing user registration, login, and role-based access

@auth @smoke
Feature: User Authentication
  As a hunting enthusiast
  I want to register and login to the platform
  So that I can access personalized hunting features

  Background:
    Given the Hunta platform is running
    And the database is clean

  @registration
  Scenario: Successful user registration
    Given I am on the registration page
    When I fill in the registration form with:
      | field      | value                    |
      | email      | hunter@example.com       |
      | username   | elite_hunter             |
      | password   | SecurePass123!           |
      | firstName  | John                     |
      | lastName   | Hunter                   |
      | role       | hunter                   |
    And I submit the registration form
    Then I should see a success message
    And I should be redirected to the dashboard
    And I should be logged in as "elite_hunter"

  @registration @validation
  Scenario Outline: Registration validation
    Given I am on the registration page
    When I fill in the registration form with:
      | field      | value        |
      | email      | <email>      |
      | username   | <username>   |
      | password   | <password>   |
    And I submit the registration form
    Then I should see an error message "<error_message>"

    Examples:
      | email              | username | password    | error_message                                |
      | invalid-email      | hunter1  | Pass123!    | Please enter a valid email address          |
      | test@example.com   |          | Pass123!    | Username is required                         |
      | test@example.com   | hunter1  | 123         | Password must be at least 8 characters      |
      | test@example.com   | hunter1  |             | Password is required                         |

  @login
  Scenario: Successful login
    Given a user exists with email "hunter@example.com" and password "SecurePass123!"
    And I am on the login page
    When I fill in the login form with:
      | field    | value                |
      | email    | hunter@example.com   |
      | password | SecurePass123!       |
    And I submit the login form
    Then I should see a success message
    And I should be redirected to the dashboard
    And I should be logged in

  @login @validation
  Scenario: Failed login with invalid credentials
    Given I am on the login page
    When I fill in the login form with:
      | field    | value                |
      | email    | wrong@example.com    |
      | password | WrongPassword        |
    And I submit the login form
    Then I should see an error message "Invalid credentials"
    And I should remain on the login page

  @logout
  Scenario: User logout
    Given I am logged in as a hunter
    When I click the logout button
    Then I should be logged out
    And I should be redirected to the home page

  @roles @authorization
  Scenario Outline: Role-based access control
    Given I am logged in as a "<role>"
    When I try to access the "<page>" page
    Then I should "<access_result>"

    Examples:
      | role    | page           | access_result        |
      | hunter  | admin-panel    | see access denied    |
      | trainer | training-logs  | have access          |
      | admin   | admin-panel    | have access          |
      | hunter  | profile        | have access          |

  @offline @auth
  Scenario: Authentication while offline
    Given I am logged in as a hunter
    And the device goes offline
    When I navigate to a protected page
    Then I should still have access to cached content
    And I should see an offline indicator

  @mobile @auth
  Scenario: Mobile authentication flow
    Given I am using a mobile device
    And I am on the mobile login page
    When I successfully log in
    Then the mobile navigation should be available
    And I should see mobile-optimized content