# Route Planning & GPS Integration Features
# Testing GPS route planning, mapping, and offline functionality

@route-planning @core-module
Feature: Route Planning & GPS Integration
  As a hunting guide and dog handler
  I want to plan and track hunting routes with GPS integration
  So that I can navigate safely and efficiently in the field

  Background:
    Given I am logged in as a hunter
    And GPS services are available
    And I am on the route planning page

  @route-creation @smoke
  Scenario: Create a new hunting route
    When I click "Plan New Route"
    And I fill in the route details with:
      | field          | value                    |
      | route_name     | Morning Pheasant Hunt    |
      | hunt_type      | upland_birds            |
      | difficulty     | moderate                |
      | estimated_time | 3 hours                 |
      | terrain        | mixed_field_forest      |
    And I set waypoints on the map:
      | point_type     | coordinates           | notes                |
      | start_point    | 44.9537, -93.0900    | Parking area        |
      | cover_area     | 44.9580, -93.0850    | Dense cover patch   |
      | water_source   | 44.9560, -93.0820    | Creek crossing      |
      | end_point      | 44.9520, -93.0880    | Return loop         |
    And I save the route
    Then I should see a success message "Route saved successfully"
    And the route should appear in my route list
    And GPS waypoints should be stored correctly

  @route-validation @negative
  Scenario: Route creation validation errors
    When I click "Plan New Route"
    And I submit the route without required fields
    Then I should see validation errors for:
      | field       | error_message              |
      | route_name  | Route name is required     |
      | hunt_type   | Hunt type must be selected |
    And waypoints validation should require:
      | requirement    | error_message                        |
      | start_point    | Start point is required              |
      | valid_coords   | Coordinates must be valid GPS format |

  @offline-functionality @critical
  Scenario: Offline route planning and navigation
    Given I have downloaded offline maps for the hunting area
    And I have saved routes available locally
    When the device goes offline
    And I open the route planning interface
    Then I should see all cached routes
    And I should be able to view route details offline
    And GPS tracking should continue to work
    And I should see an "offline mode" indicator
    But I should not be able to upload new routes

  @gps-tracking @real-time
  Scenario: Real-time GPS tracking during hunt
    Given I have an active route "Morning Pheasant Hunt"
    When I start GPS tracking
    Then my current position should be displayed on the map
    And distance to next waypoint should be calculated
    And estimated time to completion should update
    And I should receive proximity alerts for waypoints
    When I deviate more than 200 meters from route
    Then I should see a course correction suggestion

  @safety-features @emergency
  Scenario: Emergency safety features
    Given I am actively tracking a route
    When I activate emergency mode
    Then my GPS coordinates should be logged every 30 seconds
    And emergency contacts should be automatically notified
    And my last known position should be shared
    And the app should preserve battery for extended tracking

  @weather-integration @environmental
  Scenario: Weather-aware route planning
    When I plan a new route
    Then current weather conditions should be displayed
    And weather forecast for hunt time should be shown
    And I should see weather-based recommendations:
      | condition      | recommendation                |
      | high_wind      | Suggest sheltered areas      |
      | rain_forecast  | Recommend gear adjustments   |
      | temperature    | Suggest hydration breaks     |

  @sharing-collaboration @social
  Scenario: Share routes with hunting partners
    Given I have created a route "Duck Blind Circuit"
    When I click "Share Route"
    And I select sharing options:
      | option           | value                    |
      | permission_level | view_and_copy           |
      | expiry_date      | 2024-12-31              |
      | share_with       | hunting_group_members   |
    And I generate the share link
    Then hunting partners should receive route access
    And they should be able to view and copy the route
    And route usage analytics should be tracked

  @land-access @legal-compliance
  Scenario: Public land boundary verification
    When I plan a route that crosses property boundaries
    Then the system should display:
      | boundary_type    | indicator_color | warning_level |
      | public_land      | green          | none          |
      | private_land     | red            | high          |
      | restricted_area  | yellow         | medium        |
    And I should see boundary crossing warnings
    And links to hunting regulations should be provided

  @mobile-optimization @field-use
  Scenario: Mobile route planning in field conditions
    Given I am using a mobile device with gloves
    And I have limited battery life
    When I access route planning features
    Then all buttons should be large and touch-friendly
    And the interface should work with glove input
    And battery optimization mode should be available
    And voice commands should be functional for basic navigation

  @performance @rural-connectivity
  Scenario: Route planning with poor connectivity
    Given I am in an area with intermittent 2G connectivity
    When I load the route planning interface
    Then essential features should load within 10 seconds
    And offline maps should be prioritized for loading
    And GPS functionality should work without cellular data
    And route synchronization should queue for when connectivity returns

  @data-export @backup
  Scenario: Export route data for backup
    Given I have multiple saved routes
    When I select "Export Routes"
    And I choose export format "GPX"
    Then a downloadable file should be generated
    And it should contain all route waypoints and metadata
    And the file should be compatible with standard GPS devices
    And export should include hunting-specific notes and markers