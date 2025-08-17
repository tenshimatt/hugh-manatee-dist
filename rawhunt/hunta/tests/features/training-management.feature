# Training & Trial Management Features
# Testing dog training logs, progress tracking, and field trial management

@training-management @core-module
Feature: Training & Trial Management
  As a dog trainer and handler
  I want to log training sessions and track progress
  So that I can develop my dogs' hunting skills systematically

  Background:
    Given I am logged in as a trainer
    And I have dogs in my pack
    And I am on the training management page

  @training-session @smoke
  Scenario: Log a new training session
    When I click "New Training Session"
    And I select dog "Duke"
    And I fill in the training session with:
      | field            | value                      |
      | session_type     | field_work                |
      | skill_focus      | steadiness_to_wing        |
      | duration         | 45 minutes                |
      | location         | Training Field North      |
      | weather          | partly_cloudy_65F         |
      | conditions       | light_wind_dry_ground     |
    And I log training exercises:
      | exercise_name    | repetitions | success_rate | notes                    |
      | heel_work        | 10          | 90%         | Good focus              |
      | retrieve_marked  | 8           | 75%         | Needs work on delivery  |
      | point_steady     | 5           | 100%        | Excellent steadiness    |
    And I save the training session
    Then I should see a success message "Training session logged"
    And the session should appear in Duke's training history
    And progress metrics should be updated

  @progress-tracking @analytics
  Scenario: View training progress analytics
    Given I have logged multiple training sessions for "Duke"
    When I view Duke's progress dashboard
    Then I should see training metrics:
      | metric               | display_format    |
      | sessions_per_week    | chart_line       |
      | skill_improvements   | progress_bars    |
      | success_rates        | percentage       |
      | time_invested        | hours_total      |
    And I should see trend analysis for each skill
    And recommendations for next training focus should be provided

  @field-trial-prep @competition
  Scenario: Prepare for field trial competition
    Given I want to enter "Duke" in an AKC field trial
    When I access trial preparation tools
    And I select trial type "AKC Master Hunter"
    Then I should see required skills checklist:
      | skill_category      | requirement_level | current_status |
      | marking_ability     | advanced         | proficient     |
      | blind_retrieves     | expert           | needs_work     |
      | honor_steadiness    | advanced         | proficient     |
      | water_entries       | expert           | advanced       |
    And training recommendations should be generated
    And a preparation timeline should be created

  @video-analysis @advanced
  Scenario: Upload and analyze training videos
    Given I have recorded a training session
    When I upload a training video
    And I add video markers for:
      | timestamp | event_type      | notes                    |
      | 00:15     | retrieve_start  | Good initial response    |
      | 00:45     | delivery_issue  | Dropped bird early      |
      | 01:20     | correction      | Applied steady command   |
    And I tag relevant skills and behaviors
    Then the video should be linked to the training session
    And searchable video library should be updated
    And I should be able to share with other trainers

  @training-validation @negative
  Scenario: Training session validation errors
    When I attempt to log a training session
    And I leave required fields empty
    Then I should see validation errors for:
      | field        | error_message                    |
      | dog_id       | Dog selection is required        |
      | session_type | Training type must be specified  |
      | duration     | Duration must be positive number |
    And skill assessments should require:
      | field          | error_message                    |
      | success_rate   | Must be between 0% and 100%     |
      | exercise_name  | Exercise name cannot be empty    |

  @group-training @collaboration
  Scenario: Coordinate group training sessions
    When I create a group training session
    And I invite other handlers:
      | handler_name  | dogs_invited | role          |
      | Sarah Miller  | Bella, Rex   | participant   |
      | Mike Johnson  | Scout        | co_trainer    |
    And I set session details:
      | field           | value                    |
      | session_focus   | water_retrieves         |
      | skill_level     | intermediate_advanced   |
      | max_dogs        | 6                       |
      | equipment_needs | bumpers_launcher_decoys |
    And I send invitations
    Then participants should receive notifications
    And they should be able to RSVP with their dogs
    And shared equipment coordination should be available

  @weather-adaptability @environmental
  Scenario: Adapt training to weather conditions
    Given current weather is "heavy_rain_40F"
    When I plan a training session
    Then weather-appropriate exercises should be suggested:
      | weather_condition | suggested_exercises        | modifications              |
      | heavy_rain        | indoor_obedience          | skip_water_work           |
      | extreme_heat      | early_morning_short       | increase_water_breaks     |
      | snow_cold         | cold_weather_conditioning | paw_protection_reminder   |
    And safety recommendations should be displayed
    And session modification suggestions should be provided

  @skill-certification @standards
  Scenario: Track hunting skill certifications
    Given "Duke" has completed required training milestones
    When I apply for skill certification
    And I select certification type "NAVHDA Natural Ability"
    Then I should see certification requirements:
      | skill_area        | minimum_score | current_level |
      | nose_use         | 3            | 4            |
      | pointing         | 2            | 3            |
      | tracking         | 3            | 3            |
      | water_work       | 2            | 2            |
    And application documentation should be generated
    And testing appointment coordination should be available

  @offline-training @field-conditions
  Scenario: Log training sessions while offline
    Given I am in a remote training area without connectivity
    And I have the mobile app with offline capabilities
    When I log training activities
    Then all session data should be stored locally
    And I should be able to record:
      | data_type       | offline_capability |
      | session_notes   | full_text_entry   |
      | exercise_timing | stopwatch_function |
      | success_rates   | numerical_input    |
      | photos          | local_storage      |
    And data should sync when connectivity returns
    And offline indicator should be clearly visible

  @trainer-network @professional
  Scenario: Connect with professional trainers
    When I search for certified trainers in my area
    And I filter by:
      | criteria          | value                |
      | specialization    | retriever_training   |
      | certification     | AKC_approved        |
      | distance          | 50_miles            |
      | price_range       | moderate            |
    Then I should see trainer profiles with:
      | profile_element   | information_included        |
      | credentials       | certifications_experience  |
      | specialties       | breed_specific_skills      |
      | success_stories   | client_testimonials        |
      | availability      | calendar_integration       |
    And I should be able to book consultations
    And message trainers directly through the platform

  @mobile-field-use @practical
  Scenario: Use training tools during field session
    Given I am conducting a training session outdoors
    And I am using a mobile device
    When I need to log activities in real-time
    Then the interface should support:
      | functionality     | field_requirement           |
      | quick_timers      | start_stop_with_gloves      |
      | voice_notes       | hands_free_recording        |
      | photo_capture     | one_touch_camera           |
      | exercise_logging  | pre_configured_shortcuts    |
    And battery conservation mode should be available
    And screen brightness should auto-adjust for outdoor visibility