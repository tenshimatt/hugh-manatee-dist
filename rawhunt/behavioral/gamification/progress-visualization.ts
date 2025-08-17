/**
 * GoHunta.com Progress Visualization System
 * 
 * Creates compelling visual representations of user progress that align with
 * hunter psychology and motivation patterns to encourage continued engagement.
 */

export interface ProgressVisualizationConfig {
  userId: string;
  visualType: VisualizationType;
  dataSource: string;
  timeframe: TimeframeConfig;
  personalizations: PersonalizationConfig;
  motivationalFraming: MotivationalFraming;
  interactivity: InteractivityConfig;
}

export enum VisualizationType {
  SKILL_TREE = 'skill-tree',
  PROGRESS_RINGS = 'progress-rings',
  ACHIEVEMENT_GALLERY = 'achievement-gallery',
  STREAK_CALENDAR = 'streak-calendar',
  PERFORMANCE_DASHBOARD = 'performance-dashboard',
  JOURNEY_MAP = 'journey-map',
  COMPARISON_CHART = 'comparison-chart',
  MILESTONE_TIMELINE = 'milestone-timeline'
}

export interface TimeframeConfig {
  period: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'yearly' | 'all-time';
  comparison: 'none' | 'previous-period' | 'previous-year' | 'personal-best';
  trendAnalysis: boolean;
  goalProjection: boolean;
}

export interface PersonalizationConfig {
  hunterPersonality: HunterPersonalityType;
  preferredMetrics: string[];
  colorScheme: ColorScheme;
  complexityLevel: 'simple' | 'moderate' | 'detailed';
  motivationalStyle: 'competitive' | 'collaborative' | 'personal';
}

export interface MotivationalFraming {
  primaryMessage: string;
  secondaryMessage: string;
  encouragementLevel: 'subtle' | 'moderate' | 'strong';
  focusArea: 'progress' | 'achievement' | 'comparison' | 'potential';
  celebrationTriggers: string[];
}

export interface InteractivityConfig {
  drillDown: boolean;
  goalSetting: boolean;
  sharing: boolean;
  comparisons: boolean;
  projections: boolean;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  neutral: string;
  background: string;
}

export interface ProgressData {
  userId: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  historicalData: HistoricalDataPoint[];
  milestones: Milestone[];
  streaks: Streak[];
  achievements: AchievementProgress[];
  comparisons: ComparisonData[];
  projections: ProjectionData[];
}

export interface HistoricalDataPoint {
  date: Date;
  value: number;
  context?: Record<string, any>;
  quality?: 'excellent' | 'good' | 'average' | 'needs-improvement';
}

export interface Milestone {
  id: string;
  name: string;
  targetValue: number;
  achievedDate?: Date;
  isCompleted: boolean;
  reward?: string;
  significance: 'minor' | 'major' | 'legendary';
}

export interface Streak {
  type: string;
  currentLength: number;
  longestLength: number;
  startDate: Date;
  lastActiveDate: Date;
  isActive: boolean;
}

export interface AchievementProgress {
  achievementId: string;
  name: string;
  progress: number;
  maxProgress: number;
  category: string;
  isCompleted: boolean;
  completedDate?: Date;
}

export interface ComparisonData {
  type: 'peers' | 'regional' | 'historical' | 'expert';
  metric: string;
  userValue: number;
  comparisonValue: number;
  percentile?: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ProjectionData {
  metric: string;
  currentTrajectory: number;
  projectedValue: number;
  projectionDate: Date;
  confidence: number;
  requiredImprovement?: number;
}

export class ProgressVisualizationSystem {
  private visualizations: Map<string, ProgressVisualization> = new Map();
  private userConfigs: Map<string, ProgressVisualizationConfig> = new Map();

  /**
   * Create personalized progress visualization
   */
  createVisualization(config: ProgressVisualizationConfig, data: ProgressData): ProgressVisualization {
    const visualization: ProgressVisualization = {
      id: this.generateVisualizationId(config),
      config,
      data,
      elements: this.generateVisualizationElements(config, data),
      interactions: this.generateInteractions(config),
      animations: this.generateAnimations(config),
      messages: this.generateMotivationalMessages(config, data),
      createdDate: new Date(),
      lastUpdate: new Date()
    };

    this.visualizations.set(visualization.id, visualization);
    return visualization;
  }

  /**
   * Generate skill tree visualization for dog training progress
   */
  generateSkillTree(userId: string, skillArea: string): SkillTreeVisualization {
    const progressData = this.getProgressData(userId, skillArea);
    const skills = this.getSkillHierarchy(skillArea);

    const skillTree: SkillTreeVisualization = {
      userId,
      skillArea,
      rootSkills: [],
      branches: [],
      unlockedSkills: new Set(),
      currentLevel: this.calculateSkillLevel(progressData),
      availablePoints: this.calculateSkillPoints(progressData),
      totalProgress: this.calculateTotalProgress(skills, progressData)
    };

    // Build skill tree structure
    for (const skill of skills) {
      const skillNode: SkillNode = {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        level: skill.level,
        isUnlocked: this.isSkillUnlocked(userId, skill.id, progressData),
        isCompleted: this.isSkillCompleted(userId, skill.id, progressData),
        prerequisites: skill.prerequisites,
        children: skill.children,
        progress: this.getSkillProgress(userId, skill.id, progressData),
        unlockRequirements: skill.unlockRequirements,
        rewards: skill.rewards,
        position: skill.position
      };

      if (skill.level === 0) {
        skillTree.rootSkills.push(skillNode);
      }
    }

    this.buildSkillBranches(skillTree, skills);
    return skillTree;
  }

  /**
   * Generate achievement gallery visualization
   */
  generateAchievementGallery(userId: string): AchievementGalleryVisualization {
    const achievements = this.getUserAchievements(userId);
    const categories = this.groupAchievementsByCategory(achievements);

    const gallery: AchievementGalleryVisualization = {
      userId,
      categories: [],
      featured: this.getFeaturedAchievements(achievements),
      recent: this.getRecentAchievements(achievements, 5),
      statistics: {
        total: achievements.length,
        completed: achievements.filter(a => a.isCompleted).length,
        inProgress: achievements.filter(a => a.progress > 0 && !a.isCompleted).length,
        notStarted: achievements.filter(a => a.progress === 0).length
      },
      rarity: this.calculateRarityDistribution(achievements)
    };

    for (const [categoryName, categoryAchievements] of categories.entries()) {
      gallery.categories.push({
        name: categoryName,
        achievements: categoryAchievements.map(a => this.createAchievementCard(a)),
        completionRate: this.calculateCategoryCompletion(categoryAchievements),
        displayOrder: this.getCategoryDisplayOrder(categoryName)
      });
    }

    return gallery;
  }

  /**
   * Generate performance dashboard visualization
   */
  generatePerformanceDashboard(userId: string): PerformanceDashboardVisualization {
    const metrics = this.getKeyPerformanceMetrics(userId);
    const timeframe = this.getUserPreferredTimeframe(userId);

    const dashboard: PerformanceDashboardVisualization = {
      userId,
      timeframe,
      primaryMetrics: this.generatePrimaryMetricCards(metrics.primary),
      secondaryMetrics: this.generateSecondaryMetricCards(metrics.secondary),
      trends: this.generateTrendAnalysis(metrics, timeframe),
      goals: this.generateGoalProgress(userId),
      insights: this.generatePerformanceInsights(metrics),
      recommendations: this.generateActionRecommendations(metrics),
      lastUpdate: new Date()
    };

    return dashboard;
  }

  /**
   * Generate streak calendar visualization
   */
  generateStreakCalendar(userId: string, activity: string): StreakCalendarVisualization {
    const streakData = this.getStreakData(userId, activity);
    const calendarData = this.generateCalendarData(streakData);

    const calendar: StreakCalendarVisualization = {
      userId,
      activity,
      currentStreak: streakData.currentLength,
      longestStreak: streakData.longestLength,
      totalDays: streakData.totalActiveDays,
      consistency: this.calculateConsistencyScore(streakData),
      calendarGrid: calendarData,
      streakMilestones: this.getStreakMilestones(streakData),
      motivationalMessage: this.generateStreakMessage(streakData)
    };

    return calendar;
  }

  /**
   * Generate journey map visualization
   */
  generateJourneyMap(userId: string): JourneyMapVisualization {
    const journey = this.getUserJourney(userId);
    const phases = this.identifyJourneyPhases(journey);

    const journeyMap: JourneyMapVisualization = {
      userId,
      startDate: journey.startDate,
      currentPhase: journey.currentPhase,
      phases: phases.map(phase => ({
        id: phase.id,
        name: phase.name,
        description: phase.description,
        startDate: phase.startDate,
        endDate: phase.endDate,
        isCompleted: phase.isCompleted,
        isCurrent: phase.id === journey.currentPhase,
        milestones: phase.milestones,
        achievements: phase.achievements,
        challenges: phase.challenges,
        growth: this.calculatePhaseGrowth(phase)
      })),
      overallProgress: this.calculateJourneyProgress(journey),
      nextMilestone: this.getNextMilestone(journey),
      keyInsights: this.generateJourneyInsights(journey)
    };

    return journeyMap;
  }

  /**
   * Update visualization with new data
   */
  updateVisualization(visualizationId: string, newData: Partial<ProgressData>): ProgressVisualization {
    const visualization = this.visualizations.get(visualizationId);
    if (!visualization) {
      throw new Error('Visualization not found');
    }

    // Merge new data
    visualization.data = { ...visualization.data, ...newData };
    
    // Regenerate elements with updated data
    visualization.elements = this.generateVisualizationElements(visualization.config, visualization.data);
    
    // Update motivational messages
    visualization.messages = this.generateMotivationalMessages(visualization.config, visualization.data);
    
    // Update animations if significant progress
    if (this.hasSignificantProgress(visualization.data, newData)) {
      visualization.animations = this.generateCelebrationAnimations(visualization.config);
    }

    visualization.lastUpdate = new Date();
    return visualization;
  }

  /**
   * Get personalized visualization recommendations
   */
  getVisualizationRecommendations(userId: string, context: VisualizationContext): VisualizationRecommendation[] {
    const userProfile = this.getUserProfile(userId);
    const currentVisualization = this.getCurrentVisualization(userId);
    const engagementData = this.getVisualizationEngagement(userId);

    const recommendations: VisualizationRecommendation[] = [];

    // Recommend based on personality type
    if (userProfile.personalityType === HunterPersonalityType.ACHIEVEMENT_ORIENTED) {
      recommendations.push({
        type: VisualizationType.PERFORMANCE_DASHBOARD,
        reason: 'Focus on metrics and goal achievement',
        priority: 1,
        expectedEngagement: 0.85
      });
    }

    if (userProfile.personalityType === HunterPersonalityType.COMMUNITY_FOCUSED) {
      recommendations.push({
        type: VisualizationType.COMPARISON_CHART,
        reason: 'Community comparison and social elements',
        priority: 1,
        expectedEngagement: 0.78
      });
    }

    // Recommend based on current progress patterns
    if (this.hasConsistentActivity(engagementData)) {
      recommendations.push({
        type: VisualizationType.STREAK_CALENDAR,
        reason: 'Celebrate and maintain consistency',
        priority: 2,
        expectedEngagement: 0.82
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private generateVisualizationElements(config: ProgressVisualizationConfig, data: ProgressData): VisualizationElement[] {
    const elements: VisualizationElement[] = [];

    switch (config.visualType) {
      case VisualizationType.PROGRESS_RINGS:
        elements.push(...this.generateProgressRings(data, config));
        break;
      case VisualizationType.SKILL_TREE:
        elements.push(...this.generateSkillTreeElements(data, config));
        break;
      case VisualizationType.ACHIEVEMENT_GALLERY:
        elements.push(...this.generateGalleryElements(data, config));
        break;
      default:
        elements.push(...this.generateDefaultElements(data, config));
    }

    return elements;
  }

  private generateMotivationalMessages(config: ProgressVisualizationConfig, data: ProgressData): MotivationalMessage[] {
    const messages: MotivationalMessage[] = [];
    const framing = config.motivationalFraming;

    // Generate primary motivational message
    messages.push({
      type: 'primary',
      content: this.generatePersonalizedMessage(framing.primaryMessage, data, config.personalizations.hunterPersonality),
      urgency: 'normal',
      displayDuration: 5000,
      position: 'top'
    });

    // Generate celebration messages for achievements
    for (const trigger of framing.celebrationTriggers) {
      if (this.shouldTriggerCelebration(trigger, data)) {
        messages.push({
          type: 'celebration',
          content: this.generateCelebrationMessage(trigger, data),
          urgency: 'high',
          displayDuration: 8000,
          position: 'center',
          animation: 'celebration'
        });
      }
    }

    return messages;
  }

  private generatePersonalizedMessage(template: string, data: ProgressData, personality: HunterPersonalityType): string {
    const personalityMessages = {
      [HunterPersonalityType.ACHIEVEMENT_ORIENTED]: [
        "You're crushing your goals! Keep up the excellent performance.",
        "Your consistency is paying off - look at that progress!",
        "You're in the top tier of dedicated hunters. Outstanding work!"
      ],
      [HunterPersonalityType.COMMUNITY_FOCUSED]: [
        "Your contributions are making a real difference in the community!",
        "Fellow hunters appreciate your knowledge sharing and support.",
        "You're building connections that make hunting better for everyone."
      ],
      [HunterPersonalityType.TRADITION_PRESERVING]: [
        "You're carrying forward the proud tradition of ethical hunting.",
        "Your respect for the heritage shines through in everything you do.",
        "Future generations will benefit from the wisdom you're sharing."
      ],
      [HunterPersonalityType.INNOVATION_SEEKING]: [
        "Your innovative approach is setting new standards!",
        "You're pioneering techniques that others will follow.",
        "Your efficiency improvements are impressive - keep experimenting!"
      ]
    };

    const messages = personalityMessages[personality];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

// Supporting interfaces
interface ProgressVisualization {
  id: string;
  config: ProgressVisualizationConfig;
  data: ProgressData;
  elements: VisualizationElement[];
  interactions: InteractionHandler[];
  animations: AnimationSequence[];
  messages: MotivationalMessage[];
  createdDate: Date;
  lastUpdate: Date;
}

interface SkillTreeVisualization {
  userId: string;
  skillArea: string;
  rootSkills: SkillNode[];
  branches: SkillBranch[];
  unlockedSkills: Set<string>;
  currentLevel: number;
  availablePoints: number;
  totalProgress: number;
}

interface VisualizationElement {
  id: string;
  type: string;
  data: any;
  style: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  interactive: boolean;
}

interface MotivationalMessage {
  type: 'primary' | 'secondary' | 'celebration' | 'encouragement';
  content: string;
  urgency: 'low' | 'normal' | 'high';
  displayDuration: number;
  position: 'top' | 'center' | 'bottom';
  animation?: string;
}

interface VisualizationRecommendation {
  type: VisualizationType;
  reason: string;
  priority: number;
  expectedEngagement: number;
}

export default ProgressVisualizationSystem;