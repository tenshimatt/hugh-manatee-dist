# Gear Reviews & Loadout Planning Features
# Testing equipment reviews, loadout management, and gear recommendations

@gear-reviews @core-module
Feature: Gear Reviews & Loadout Planning
  As a hunting dog enthusiast
  I want to review gear and plan loadouts for hunting trips
  So that I can make informed equipment decisions and be properly prepared

  Background:
    Given I am logged in as a hunter
    And I am on the gear reviews page

  @gear-review @smoke
  Scenario: Write a comprehensive gear review
    When I click "Write Review"
    And I search for product "SportDog TEK 2.0 GPS Collar"
    And I fill in the review form with:
      | field           | value                           |
      | rating          | 4                              |
      | hunt_type       | upland_birds                   |
      | usage_duration  | 6_months                       |
      | dog_breed       | German Shorthaired Pointer     |
      | conditions      | all_weather_moderate_brush     |
    And I write detailed feedback:
      | section         | content                                    |
      | pros            | Excellent GPS accuracy, durable build     |
      | cons            | Battery life could be better              |
      | field_performance | Reliable tracking in dense cover        |
      | value_rating    | Worth the investment for serious hunters  |
    And I upload field photos showing the gear in use
    And I submit the review
    Then I should see a success message "Review published"
    And the review should appear in the product reviews
    And my reviewer profile should be updated

  @loadout-planning @preparation
  Scenario: Create hunting trip loadout
    When I click "Plan Loadout"
    And I select hunt parameters:
      | parameter       | value                    |
      | hunt_type       | waterfowl               |
      | duration        | full_day                |
      | weather         | cold_wet_windy          |
      | dog_count       | 2                       |
      | location_type   | marsh_boat_access       |
    Then the system should recommend essential gear:
      | gear_category   | recommended_items               | priority |
      | dog_protection  | neoprene_vest_boots           | high     |
      | retrieval_aids  | bumpers_whistle_leash         | high     |
      | weather_gear    | rain_jacket_waterproof_bag    | high     |
      | navigation      | gps_collar_backup_radio       | medium   |
      | first_aid       | dog_medical_kit               | medium   |
    And I should be able to customize the loadout
    And save it as "Waterfowl Full Day Setup"

  @gear-comparison @decision-support
  Scenario: Compare similar gear items
    Given I am researching GPS collars
    When I select items to compare:
      | product                    | price | rating | key_features              |
      | Garmin Alpha 100          | $699  | 4.5    | detailed_maps_long_range |
      | SportDog TEK 2.0          | $399  | 4.0    | affordable_reliable      |
      | Dogtra Pathfinder         | $549  | 4.2    | smartphone_integration   |
    Then I should see a comparison table with:
      | comparison_factor  | display_format    |
      | price_value        | cost_per_feature  |
      | user_ratings       | star_breakdown    |
      | feature_matrix     | checkmark_grid    |
      | field_reviews      | summary_quotes    |
    And filtering options should be available by:
      | filter_type       | options                           |
      | price_range       | budget_moderate_premium          |
      | hunt_type         | upland_waterfowl_tracking        |
      | dog_size          | small_medium_large               |

  @seasonal-recommendations @adaptive
  Scenario: Get season-specific gear suggestions
    Given it is "early_fall_dove_season"
    When I request gear recommendations
    Then seasonal suggestions should include:
      | season_factor     | gear_recommendations               |
      | temperature       | lightweight_breathable_clothing   |
      | hunting_pressure  | camouflage_scent_control          |
      | bird_behavior     | fast_action_training_gear         |
      | field_conditions  | thorn_protection_snake_boots      |
    And I should see local hunting conditions data
    And retailer availability should be displayed

  @budget-tracking @financial
  Scenario: Track gear expenses and budget planning
    Given I have set an annual gear budget of $1500
    When I add purchases to my gear log:
      | item                  | cost  | purchase_date | category        |
      | New GPS Collar        | $450  | 2024-03-15   | electronics     |
      | Training Bumpers      | $75   | 2024-03-20   | training_aids   |
      | Dog Boots             | $125  | 2024-04-01   | dog_protection  |
    Then my budget tracker should show:
      | budget_metric        | value      |
      | total_spent          | $650       |
      | remaining_budget     | $850       |
      | percentage_used      | 43%        |
      | monthly_average      | $216       |
    And spending category breakdown should be displayed
    And I should receive budget alerts when approaching limits

  @group-purchasing @community
  Scenario: Organize bulk gear purchases
    When I start a group purchase for "Premium Training Bumpers"
    And I set purchase parameters:
      | parameter         | value                    |
      | minimum_quantity  | 50                      |
      | target_discount   | 20%                     |
      | deadline          | 2024-05-01             |
      | shipping_split    | equal_among_participants |
    And I invite hunters from my network
    Then participants should receive notifications
    And they should be able to specify quantities needed
    And progress toward minimum order should be tracked
    And discount tiers should be clearly displayed

  @gear-validation @negative
  Scenario: Gear review validation and quality control
    When I attempt to submit a review
    And required fields are missing:
      | field          | error_message                     |
      | product_name   | Product selection is required     |
      | rating         | Overall rating must be provided   |
      | usage_time     | Usage duration is required        |
    Then validation errors should be displayed
    And the review should not be published
    When I submit a review with suspicious content:
      | issue_type        | detection_trigger                |
      | fake_review       | identical_text_patterns         |
      | spam_content      | excessive_promotional_language  |
      | offensive_lang    | inappropriate_language_filter   |
    Then the review should be flagged for moderation

  @rural-retailer @accessibility
  Scenario: Find gear from rural-friendly retailers
    Given I am located in a rural area with limited shopping options
    When I search for "dog training equipment"
    Then retailer options should prioritize:
      | retailer_feature  | importance_level |
      | rural_shipping    | high            |
      | return_policy     | high            |
      | customer_service  | medium          |
      | bulk_discounts    | medium          |
    And shipping costs should be clearly displayed
    And estimated delivery times should account for rural addresses
    And alternative pickup locations should be suggested

  @mobile-gear-access @field-reference
  Scenario: Access gear information in the field
    Given I am actively hunting and need gear reference
    And I have limited connectivity
    When I search for emergency gear solutions
    Then critical gear information should be cached offline:
      | info_type           | offline_availability    |
      | emergency_contacts  | full_access            |
      | gear_troubleshooting| basic_guides           |
      | replacement_sources | contact_info           |
      | safety_procedures   | complete_guides        |
    And battery-optimized display should be available
    And voice search should work for hands-free access

  @gear-maintenance @longevity
  Scenario: Track gear maintenance and lifecycle
    Given I own multiple pieces of hunting gear
    When I log maintenance activities:
      | item              | maintenance_type | date       | cost | notes                    |
      | GPS Collar        | battery_replace  | 2024-03-15| $25  | Original battery failed  |
      | Training Vest     | repair_tear      | 2024-04-01| $15  | Field damage from thorns |
      | Whistle           | cleaning         | 2024-04-10| $0   | Routine maintenance      |
    Then maintenance history should be tracked
    And replacement alerts should be set based on usage
    And total cost of ownership should be calculated
    And maintenance tips should be provided for each item

  @expert-recommendations @professional
  Scenario: Get recommendations from professional trainers
    When I request expert gear advice
    And I specify my needs:
      | requirement        | details                          |
      | experience_level   | intermediate                    |
      | primary_hunt_type  | upland_birds                    |
      | dog_breeds         | pointer_setter                  |
      | budget_range       | $500_to_1000                    |
      | geographic_region  | midwest_prairies                |
    Then I should receive recommendations from:
      | expert_type        | recommendation_focus            |
      | pro_trainers       | performance_proven_gear        |
      | guides             | field_tested_reliability       |
      | veterinarians      | dog_safety_health              |
      | experienced_hunters| practical_value_assessment     |
    And recommendations should include usage context and alternatives