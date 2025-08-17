# Community & Knowledge Sharing Features
# Testing forums, expert Q&A, mentorship, and marketplace functionality

@community-knowledge @core-module
Feature: Community & Knowledge Sharing
  As a member of the hunting dog community
  I want to connect with other hunters and share knowledge
  So that I can learn from experienced hunters and contribute to the community

  Background:
    Given I am logged in as a hunter
    And I am on the community hub

  @expert-qa @knowledge-exchange
  Scenario: Ask expert trainers questions
    When I click "Ask an Expert"
    And I categorize my question:
      | category            | subcategory              |
      | training_issues     | pointing_steadiness     |
      | dog_behavior        | retrieving_problems     |
      | health_concerns     | working_dog_nutrition   |
      | equipment_advice    | gps_collar_selection    |
    And I write my question with details:
      | field               | content                                    |
      | question_title      | Young pointer breaking point on birds     |
      | detailed_question   | 18-month GSP consistently breaks point... |
      | dog_details         | Breed: GSP, Age: 18mo, Training: 6mo     |
      | attempts_tried      | Checkcord work, bird pen training         |
      | urgency_level       | moderate                                  |
    And I submit the question
    Then qualified experts should be notified
    And the question should appear in the expert Q&A feed
    And I should receive notifications when experts respond

  @success-stories @inspiration
  Scenario: Share hunting success stories
    When I create a new success story post
    And I include story details:
      | field               | content                                    |
      | hunt_type           | pheasant_opener                           |
      | dogs_involved       | Duke (GSP), Bella (Lab)                   |
      | location_general    | South Dakota prairie                       |
      | weather_conditions  | crisp_morning_light_frost                 |
      | success_metrics     | 8_birds_3_hours                          |
    And I add photos with captions:
      | photo_type          | caption                                    |
      | action_shot         | Duke on solid point in tall grass         |
      | retrieved_bird      | Bella with perfect pheasant delivery      |
      | team_photo          | Successful hunting party at day's end     |
    And I share lessons learned and tips
    Then the story should be published to the community
    And other hunters should be able to comment and react
    And the story should be searchable by hunt type and location

  @regional-groups @local-community
  Scenario: Join and participate in regional hunting groups
    When I search for hunting groups in my area
    And I filter by criteria:
      | filter_type         | selection                |
      | distance_radius     | 50_miles                |
      | hunt_types          | upland_waterfowl        |
      | group_size          | 10_to_25_members        |
      | activity_level      | weekly_active           |
      | membership_type     | open_to_new_members     |
    Then I should see relevant groups with details:
      | group_info          | information_shown        |
      | member_count        | active_vs_total         |
      | recent_activity     | posts_events_discussions |
      | group_focus         | specialties_interests   |
      | meeting_schedule    | regular_meetup_times    |
    And I should be able to request membership
    And preview group content before joining

  @mentorship-matching @skill-development
  Scenario: Find and connect with mentors
    Given I am a novice hunter seeking guidance
    When I access the mentorship program
    And I specify what I need help with:
      | mentorship_area     | experience_level     |
      | dog_training        | beginner            |
      | field_techniques    | novice              |
      | equipment_selection | intermediate        |
      | hunt_planning       | beginner            |
    And I set my preferences:
      | preference          | selection            |
      | communication_style | hands_on_learner    |
      | time_availability   | weekends_evenings   |
      | learning_pace       | steady_consistent   |
      | geographic_range    | 75_miles            |
    Then I should be matched with compatible mentors
    And mentor profiles should show expertise and teaching style
    And structured mentorship programs should be available

  @problem-solving @troubleshooting
  Scenario: Get help with training and behavioral issues
    When I post a problem in the troubleshooting forum:
      | issue_category      | specific_problem                      |
      | behavioral          | Dog refuses to enter cold water       |
      | training_plateau    | Retrieve delivery getting sloppy      |
      | equipment_failure   | GPS collar losing signal in timber    |
      | health_concern      | Excessive panting during training     |
    And I provide detailed context:
      | context_field       | information                           |
      | dog_background      | Age, breed, training history          |
      | problem_duration    | How long issue has persisted          |
      | environmental_factors| Weather, terrain, hunting pressure   |
      | previous_attempts   | What solutions have been tried        |
    Then community members should be able to respond with advice
    And similar past discussions should be suggested
    And expert practitioners should be tagged for complex issues

  @marketplace @equipment-exchange
  Scenario: Buy and sell hunting dog equipment
    When I list equipment for sale:
      | item_category       | item_details                          |
      | gps_equipment       | Garmin Alpha 100 + 2 collars         |
      | training_gear       | Canvas bumper set - 12 pieces         |
      | dog_accessories     | Neoprene vest - size large            |
      | books_media         | Training DVDs - Richard Wolters set   |
    And I provide item information:
      | field               | content                               |
      | condition           | excellent_lightly_used                |
      | usage_history       | 2_seasons_well_maintained             |
      | reason_selling      | upgrading_to_newer_model              |
      | price               | $450_obo                              |
      | shipping_options    | buyer_pays_local_pickup_available     |
    Then the listing should appear in the marketplace
    And interested buyers should be able to message me
    And secure payment processing should be available

  @knowledge-base @searchable-content
  Scenario: Search and contribute to community knowledge base
    When I search the knowledge base for "water training techniques"
    Then I should find organized content:
      | content_type        | examples                              |
      | expert_articles     | Professional trainer methods         |
      | community_posts     | Member-shared experiences             |
      | video_tutorials     | Step-by-step training demonstrations  |
      | discussion_threads  | Q&A about specific techniques         |
    And search results should be ranked by relevance and quality
    And I should be able to contribute my own knowledge
    And bookmark useful content for future reference

  @event-coordination @group-activities
  Scenario: Organize and join hunting events
    When I create a group hunting event:
      | event_type          | details                               |
      | training_day        | Group training session - all breeds  |
      | hunt_coordination   | Opening day pheasant hunt             |
      | seminar             | Guest expert on retriever training    |
      | fundraiser          | Conservation banquet planning         |
    And I set event parameters:
      | parameter           | value                                 |
      | date_time           | 2024-10-15_7:00am                   |
      | location            | Prairie View Training Grounds        |
      | max_participants    | 12_hunters_15_dogs                   |
      | skill_level         | all_levels_welcome                   |
      | cost_structure      | $25_per_person_covers_lunch          |
    Then the event should be published to the community
    And members should receive notifications based on interests
    And RSVP management should track attendance

  @community-moderation @quality-control
  Scenario: Handle inappropriate community content
    When someone posts content that violates community standards:
      | violation_type      | detection_method                      |
      | spam_advertising    | pattern_recognition                   |
      | harassment          | user_reporting                        |
      | misinformation      | community_fact_checking               |
      | inappropriate_language| automated_filtering                  |
    Then content should be flagged for review
    And community moderators should be notified
    And the poster should receive educational feedback
    And repeat offenders should face escalating consequences

  @mobile-community @social-interaction
  Scenario: Engage with community while in the field
    Given I'm actively hunting and want to share updates
    When I post a real-time update:
      | update_type         | content_example                       |
      | location_report     | "Great bird numbers at Prairie WMA"   |
      | training_success    | "Duke's first perfect water retrieve!" |
      | weather_alert       | "Storm moving in from west - heads up" |
      | safety_check        | "All good at Red Creek access"        |
    Then updates should post quickly even with limited connectivity
    And my hunting network should receive relevant notifications
    And GPS location should be optionally shareable
    And battery optimization should minimize power usage

  @privacy-safety @personal-protection
  Scenario: Control privacy and personal information sharing
    When I configure my privacy settings:
      | privacy_aspect      | setting_options                       |
      | location_sharing    | general_area_only_exact_never        |
      | contact_information | members_only_mentors_only_private     |
      | hunting_reports     | community_friends_only_private        |
      | photo_sharing       | automatic_manual_approval_off         |
    Then my personal information should be protected according to settings
    And I should control who can contact me directly
    And location information should never reveal specific hunting spots
    And photo metadata should be automatically stripped

  @expert-recognition @credibility
  Scenario: Recognize and verify expert contributors
    Given community members provide advice and guidance
    When experts demonstrate knowledge through:
      | recognition_factor  | measurement_method                    |
      | helpful_responses   | community_upvoting                    |
      | verified_credentials| certification_validation               |
      | consistent_quality  | moderator_review                      |
      | professional_status | industry_verification                 |
    Then expert status should be clearly indicated
    And their contributions should receive priority visibility
    And newcomers should be able to identify trusted advisors
    And expert matching for questions should be optimized