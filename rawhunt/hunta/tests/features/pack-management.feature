# Pack & Profile Management Features
# Testing dog profiles, handler info, and CRUD operations

@pack-management @core-module
Feature: Pack & Profile Management
  As a dog handler
  I want to manage my dogs' profiles and pack information
  So that I can track their training and hunting performance

  Background:
    Given I am logged in as a hunter
    And I am on the pack management page

  @dog-profile @smoke
  Scenario: Create a new dog profile
    When I click "Add New Dog"
    And I fill in the dog profile form with:
      | field           | value              |
      | name            | Duke               |
      | breed           | German Shorthaired |
      | age             | 3                  |
      | weight          | 65                 |
      | gender          | male               |
      | specialization  | pointing           |
      | training_level  | advanced           |
    And I upload a profile photo
    And I submit the dog profile form
    Then I should see a success message "Dog profile created"
    And "Duke" should appear in my pack list
    And the dog should have a profile photo

  @dog-profile @validation
  Scenario: Dog profile validation
    When I click "Add New Dog"
    And I submit the dog profile form without required fields
    Then I should see validation errors for:
      | field | error_message           |
      | name  | Name is required        |
      | breed | Breed is required       |

  @dog-profile @edit
  Scenario: Update dog profile
    Given I have a dog named "Duke" in my pack
    When I click on Duke's profile
    And I click "Edit Profile"
    And I update the form with:
      | field          | value        |
      | weight         | 68           |
      | training_level | expert       |
      | health_notes   | Hip cleared  |
    And I submit the updates
    Then I should see a success message "Profile updated"
    And the changes should be reflected in Duke's profile

  @dog-profile @delete
  Scenario: Remove dog from pack
    Given I have a dog named "Duke" in my pack
    When I click on Duke's profile
    And I click "Remove from Pack"
    And I confirm the deletion
    Then I should see a success message "Dog removed from pack"
    And "Duke" should not appear in my pack list

  @pack-overview
  Scenario: View pack overview
    Given I have multiple dogs in my pack:
      | name  | breed              | specialization | training_level |
      | Duke  | German Shorthaired | pointing       | advanced       |
      | Bella | Labrador Retriever | retrieving     | intermediate   |
      | Rex   | Bloodhound         | tracking       | expert         |
    When I view my pack overview
    Then I should see all 3 dogs listed
    And I should see a summary of their specializations
    And I should see their training levels

  @microchip @identification
  Scenario: Add microchip information
    Given I have a dog named "Duke" in my pack
    When I edit Duke's profile
    And I add microchip information:
      | field              | value           |
      | microchip_id       | 985112001234567 |
      | registration_number | AKC12345        |
    And I submit the updates
    Then the microchip information should be saved
    And I should be able to search by microchip ID

  @health-tracking
  Scenario: Track health information
    Given I have a dog named "Duke" in my pack
    When I edit Duke's profile
    And I add health notes: "Annual check-up 2024-01-15, all clear"
    And I submit the updates
    Then the health information should be saved
    And I should see health notes in the profile

  @offline @pack-management
  Scenario: Manage pack while offline
    Given I have cached dog profiles
    And the device goes offline
    When I view my pack list
    Then I should see all cached dog profiles
    And I should be able to view individual profiles
    But I should see "offline mode" indicator
    And I should not be able to upload new photos

  @mobile @pack-management
  Scenario: Mobile pack management
    Given I am using a mobile device
    And I have dogs in my pack
    When I view the pack list on mobile
    Then the dogs should be displayed in a mobile-friendly grid
    And I should be able to swipe between dog cards
    And tapping a dog should show quick actions menu

  @search @filtering
  Scenario: Search and filter pack
    Given I have multiple dogs with different attributes
    When I search for dogs by:
      | filter_type    | value        |
      | breed          | Retriever    |
      | specialization | tracking     |
      | training_level | advanced     |
    Then I should see only dogs matching the criteria
    And the filter count should be displayed

  @export @data-management
  Scenario: Export pack data
    Given I have multiple dogs in my pack
    When I click "Export Pack Data"
    And I select format "PDF"
    Then a PDF file should be generated
    And it should contain all dog profiles
    And it should include photos and health records