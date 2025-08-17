/**
 * GoHunta.com Habit Formation Framework
 * 
 * Comprehensive framework for building and maintaining user habits based on
 * behavioral psychology principles and hunter-specific behavior patterns.
 */

export interface HabitFormationPlan {
  userId: string;
  targetHabit: TargetHabit;
  currentPhase: HabitPhase;
  formationStrategy: FormationStrategy;
  triggers: HabitTrigger[];
  rewards: HabitReward[];
  progressTracking: ProgressTracking;
  challenges: HabitChallenge[];
  adaptations: HabitAdaptation[];
  timeline: HabitTimeline;
  successMetrics: HabitSuccessMetric[];
  riskMitigation: HabitRiskMitigation[];
  lastUpdated: Date;
}

export interface TargetHabit {
  id: string;
  name: string;
  description: string;
  category: HabitCategory;
  difficulty: HabitDifficulty;
  frequency: HabitFrequency;
  duration: HabitDuration;
  context: HabitContext;
  personalRelevance: PersonalRelevance;
  behavioralRequirements: BehavioralRequirement[];
}

export enum HabitCategory {
  TRAINING_CONSISTENCY = 'training-consistency',
  HUNT_LOGGING = 'hunt-logging',
  COMMUNITY_ENGAGEMENT = 'community-engagement',
  SKILL_DEVELOPMENT = 'skill-development',
  EQUIPMENT_MAINTENANCE = 'equipment-maintenance',
  SAFETY_PRACTICES = 'safety-practices',
  KNOWLEDGE_SHARING = 'knowledge-sharing',
  GOAL_REVIEWING = 'goal-reviewing'
}

export enum HabitDifficulty {
  EASY = 'easy',           // 1-2 minutes, minimal effort
  MODERATE = 'moderate',   // 5-10 minutes, some planning
  CHALLENGING = 'challenging', // 15-30 minutes, dedicated time
  ADVANCED = 'advanced'    // 30+ minutes, significant commitment
}

export interface HabitFrequency {
  type: 'daily' | 'weekly' | 'bi-weekly' | 'custom';
  occurrences: number;
  flexibilityWindow: number; // hours of acceptable variance
  minimumStreak: number;
}

export interface HabitDuration {
  minimum: number; // minutes
  target: number;
  maximum: number;
  buildUpStrategy: 'gradual' | 'immediate' | 'adaptive';
}

export interface HabitContext {
  environment: string[];
  timeOfDay: string[];
  dayOfWeek: string[];
  season: string[];
  prerequisiteActivities: string[];
  conflictingActivities: string[];
}

export interface PersonalRelevance {
  hunterPersonality: HunterPersonalityType;
  motivationAlignment: MotivationAlignment;
  valueAlignment: ValueAlignment;
  goalSupport: GoalSupport;
  lifestyleIntegration: LifestyleIntegration;
}

export interface MotivationAlignment {
  intrinsicFactors: string[];
  extrinsicFactors: string[];
  motivationalFraming: string;
  resistanceFactors: string[];
}

export enum HabitPhase {
  PREPARATION = 'preparation',     // Planning and setup
  INITIATION = 'initiation',       // First attempts, high attention
  DEVELOPMENT = 'development',     // Building consistency, some automation
  STABILIZATION = 'stabilization', // Automatic behavior forming
  MAINTENANCE = 'maintenance',     // Habit established, minimal attention
  RENEWAL = 'renewal'              // Refreshing or evolving established habits
}

export interface FormationStrategy {
  approach: FormationApproach;
  personalityAdaptation: PersonalityAdaptation;
  phaseStrategies: PhaseStrategy[];
  contingencyPlans: ContingencyPlan[];
  supportSystems: SupportSystem[];
}

export enum FormationApproach {
  GRADUAL_BUILDING = 'gradual-building',
  IMMEDIATE_IMMERSION = 'immediate-immersion',
  STACKING = 'stacking',
  REPLACEMENT = 'replacement',
  ENVIRONMENTAL_DESIGN = 'environmental-design'
}

export interface PersonalityAdaptation {
  personalityType: HunterPersonalityType;
  adaptedApproach: string;
  motivationalTactics: string[];
  communicationStyle: string;
  rewardPreferences: string[];
}

export interface PhaseStrategy {
  phase: HabitPhase;
  duration: number; // days
  objectives: string[];
  tactics: Tactic[];
  successCriteria: PhaseCriteria[];
  transitions: PhaseTransition[];
}

export interface Tactic {
  name: string;
  description: string;
  implementation: string;
  frequency: string;
  psychologicalBasis: string;
  expectedOutcome: string;
}

export interface HabitTrigger {
  id: string;
  type: TriggerType;
  condition: TriggerCondition;
  strength: TriggerStrength;
  reliability: number; // 0-1 scale
  context: TriggerContext;
  personalization: TriggerPersonalization;
}

export enum TriggerType {
  TIME_BASED = 'time-based',
  LOCATION_BASED = 'location-based',
  EVENT_BASED = 'event-based',
  EMOTIONAL_STATE = 'emotional-state',
  SOCIAL_CUE = 'social-cue',
  ENVIRONMENTAL = 'environmental',
  TECHNOLOGY_PROMPT = 'technology-prompt'
}

export interface TriggerCondition {
  primary: string;
  secondary?: string[];
  contextualModifiers: string[];
  exclusionCriteria: string[];
}

export enum TriggerStrength {
  WEAK = 'weak',       // Gentle reminder
  MODERATE = 'moderate', // Clear prompt
  STRONG = 'strong',    // Compelling cue
  POWERFUL = 'powerful' // Irresistible trigger
}

export interface TriggerContext {
  huntingSeason: boolean;
  weatherDependency: boolean;
  socialContext: string;
  equipmentRequired: string[];
  locationConstraints: string[];
}

export interface HabitReward {
  id: string;
  type: RewardType;
  timing: RewardTiming;
  value: RewardValue;
  personalization: RewardPersonalization;
  sustainability: RewardSustainability;
}

export enum RewardType {
  INTRINSIC = 'intrinsic',         // Internal satisfaction
  IMMEDIATE_EXTERNAL = 'immediate-external', // Quick external reward
  DELAYED_EXTERNAL = 'delayed-external',     // Future benefit
  SOCIAL = 'social',               // Recognition/community
  PROGRESS = 'progress',           // Advancement indicator
  UNLOCKS = 'unlocks'             // Feature/content access
}

export interface RewardTiming {
  immediate: boolean;
  delayed: number; // hours
  frequency: RewardFrequency;
  variableSchedule: boolean;
}

export enum RewardFrequency {
  EVERY_TIME = 'every-time',
  INTERMITTENT = 'intermittent',
  MILESTONE = 'milestone',
  RANDOM = 'random'
}

export interface ProgressTracking {
  metrics: TrackingMetric[];
  visualizations: ProgressVisualization[];
  milestones: HabitMilestone[];
  feedback: ProgressFeedback[];
  analytics: HabitAnalytics;
}

export interface TrackingMetric {
  name: string;
  type: 'frequency' | 'duration' | 'quality' | 'consistency' | 'impact';
  measurement: string;
  target: number;
  current: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface HabitMilestone {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  isAchieved: boolean;
  achievedDate?: Date;
  celebration: CelebrationConfig;
}

export interface CelebrationConfig {
  type: 'notification' | 'visual-effect' | 'social-share' | 'reward-unlock';
  intensity: 'subtle' | 'moderate' | 'grand';
  personalization: CelebrationPersonalization;
}

export interface HabitChallenge {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  duration: number; // days
  participants: ChallengeParticipant[];
  rewards: ChallengeReward[];
  progress: ChallengeProgress;
}

export enum ChallengeType {
  PERSONAL = 'personal',
  PEER_GROUP = 'peer-group',
  COMMUNITY = 'community',
  SEASONAL = 'seasonal'
}

export interface HabitAdaptation {
  trigger: AdaptationTrigger;
  modification: HabitModification;
  rationale: string;
  implementation: AdaptationImplementation;
  monitoring: AdaptationMonitoring;
}

export interface AdaptationTrigger {
  condition: string;
  threshold: number;
  timeframe: number;
  sensitivity: 'low' | 'medium' | 'high';
}

export interface HabitModification {
  aspect: 'frequency' | 'duration' | 'timing' | 'context' | 'rewards' | 'triggers';
  change: 'increase' | 'decrease' | 'modify' | 'add' | 'remove';
  magnitude: number;
  description: string;
}

export class HabitFormationFramework {
  private habitPlans: Map<string, HabitFormationPlan> = new Map();
  private habitTemplates: Map<string, HabitTemplate> = new Map();
  private habitProgress: Map<string, HabitProgressData> = new Map();

  constructor() {
    this.initializeHabitTemplates();
  }

  /**
   * Create personalized habit formation plan
   */
  createHabitPlan(userId: string, targetHabit: TargetHabit, userProfile: UserBehaviorProfile): HabitFormationPlan {
    const plan: HabitFormationPlan = {
      userId,
      targetHabit,
      currentPhase: HabitPhase.PREPARATION,
      formationStrategy: this.designFormationStrategy(targetHabit, userProfile),
      triggers: this.designHabitTriggers(targetHabit, userProfile),
      rewards: this.designHabitRewards(targetHabit, userProfile),
      progressTracking: this.setupProgressTracking(targetHabit),
      challenges: this.recommendHabitChallenges(targetHabit, userProfile),
      adaptations: this.planHabitAdaptations(targetHabit, userProfile),
      timeline: this.createHabitTimeline(targetHabit),
      successMetrics: this.defineSuccessMetrics(targetHabit),
      riskMitigation: this.identifyRiskMitigation(targetHabit, userProfile),
      lastUpdated: new Date()
    };

    this.habitPlans.set(userId, plan);
    this.initializeProgressTracking(userId, plan);
    
    return plan;
  }

  /**
   * Progress user through habit formation phases
   */
  advanceHabitPhase(userId: string): HabitFormationPlan {
    const plan = this.habitPlans.get(userId);
    if (!plan) {
      throw new Error('Habit plan not found');
    }

    const currentProgress = this.habitProgress.get(userId);
    if (!currentProgress) {
      throw new Error('Progress data not found');
    }

    // Check if ready for next phase
    if (this.isReadyForNextPhase(plan, currentProgress)) {
      const nextPhase = this.getNextPhase(plan.currentPhase);
      plan.currentPhase = nextPhase;
      
      // Update strategy for new phase
      this.adaptStrategyForPhase(plan, nextPhase);
      
      // Celebrate phase transition
      this.celebratePhaseAdvancement(userId, nextPhase);
      
      plan.lastUpdated = new Date();
    }

    return plan;
  }

  /**
   * Track habit performance and provide feedback
   */
  trackHabitPerformance(userId: string, habitEvent: HabitEvent): HabitPerformanceFeedback {
    const plan = this.habitPlans.get(userId);
    if (!plan) {
      throw new Error('Habit plan not found');
    }

    // Update progress data
    this.updateProgressData(userId, habitEvent);
    
    // Calculate performance metrics
    const performance = this.calculateHabitPerformance(userId, plan);
    
    // Generate feedback
    const feedback: HabitPerformanceFeedback = {
      userId,
      habitId: plan.targetHabit.id,
      performance,
      streakInfo: this.calculateStreakInfo(userId),
      improvements: this.identifyImprovements(performance, plan),
      encouragement: this.generateEncouragement(performance, plan),
      adaptationSuggestions: this.suggestAdaptations(performance, plan),
      nextSteps: this.recommendNextSteps(performance, plan),
      generatedDate: new Date()
    };

    // Check for automatic adaptations
    this.checkAutomaticAdaptations(userId, performance);
    
    return feedback;
  }

  /**
   * Analyze habit strength and formation progress
   */
  analyzeHabitStrength(userId: string): HabitStrengthAnalysis {
    const plan = this.habitPlans.get(userId);
    const progress = this.habitProgress.get(userId);
    
    if (!plan || !progress) {
      throw new Error('Habit data not found');
    }

    const analysis: HabitStrengthAnalysis = {
      userId,
      habitId: plan.targetHabit.id,
      overallStrength: this.calculateOverallHabitStrength(progress),
      components: {
        automaticity: this.calculateAutomaticity(progress),
        consistency: this.calculateConsistency(progress),
        stability: this.calculateStability(progress),
        resilience: this.calculateResilience(progress)
      },
      phaseProgress: this.calculatePhaseProgress(plan, progress),
      strengthTrend: this.calculateStrengthTrend(progress),
      projectedCompletion: this.projectHabitCompletion(plan, progress),
      riskFactors: this.identifyCurrentRiskFactors(plan, progress),
      strengthFactors: this.identifyStrengthFactors(plan, progress),
      recommendations: this.generateStrengthRecommendations(plan, progress)
    };

    return analysis;
  }

  /**
   * Design intervention for habit disruption recovery
   */
  recoverFromHabitDisruption(userId: string, disruptionContext: DisruptionContext): HabitRecoveryPlan {
    const plan = this.habitPlans.get(userId);
    if (!plan) {
      throw new Error('Habit plan not found');
    }

    const recoveryPlan: HabitRecoveryPlan = {
      userId,
      habitId: plan.targetHabit.id,
      disruptionType: disruptionContext.type,
      disruptionSeverity: this.assessDisruptionSeverity(disruptionContext, plan),
      recoveryStrategy: this.designRecoveryStrategy(disruptionContext, plan),
      modifiedTriggers: this.adaptTriggersForRecovery(plan.triggers, disruptionContext),
      temporaryRewards: this.designRecoveryRewards(plan.rewards, disruptionContext),
      recoveryTimeline: this.estimateRecoveryTimeline(disruptionContext, plan),
      supportMeasures: this.recommendRecoverySupport(disruptionContext, plan),
      monitoring: this.setupRecoveryMonitoring(disruptionContext, plan),
      createdDate: new Date()
    };

    // Implement recovery adjustments
    this.implementRecoveryAdjustments(userId, recoveryPlan);
    
    return recoveryPlan;
  }

  private initializeHabitTemplates(): void {
    // Daily Dog Training Template
    this.habitTemplates.set('daily-dog-training', {
      id: 'daily-dog-training',
      name: 'Daily Dog Training',
      description: 'Consistent daily training sessions to build and maintain dog skills',
      category: HabitCategory.TRAINING_CONSISTENCY,
      difficulty: HabitDifficulty.MODERATE,
      baseFrequency: { type: 'daily', occurrences: 1, flexibilityWindow: 4, minimumStreak: 7 },
      baseDuration: { minimum: 10, target: 20, maximum: 45, buildUpStrategy: 'gradual' },
      triggers: [
        {
          type: TriggerType.TIME_BASED,
          condition: { primary: 'morning_routine', contextualModifiers: ['after_coffee'] },
          strength: TriggerStrength.MODERATE
        },
        {
          type: TriggerType.LOCATION_BASED,
          condition: { primary: 'training_area', contextualModifiers: ['equipment_ready'] },
          strength: TriggerStrength.STRONG
        }
      ],
      rewards: [
        {
          type: RewardType.INTRINSIC,
          timing: { immediate: true, frequency: RewardFrequency.EVERY_TIME }
        },
        {
          type: RewardType.PROGRESS,
          timing: { immediate: false, delayed: 1, frequency: RewardFrequency.MILESTONE }
        }
      ],
      personalityAdaptations: {
        [HunterPersonalityType.ACHIEVEMENT_ORIENTED]: {
          emphasis: 'progress_tracking',
          rewards: 'achievement_based',
          messaging: 'goal_focused'
        },
        [HunterPersonalityType.TRADITION_PRESERVING]: {
          emphasis: 'heritage_connection',
          rewards: 'respect_based',
          messaging: 'tradition_honoring'
        }
      }
    });

    // Hunt Logging Template
    this.habitTemplates.set('post-hunt-logging', {
      id: 'post-hunt-logging',
      name: 'Post-Hunt Logging',
      description: 'Recording hunt details immediately after each hunting session',
      category: HabitCategory.HUNT_LOGGING,
      difficulty: HabitDifficulty.EASY,
      baseFrequency: { type: 'custom', occurrences: 1, flexibilityWindow: 2, minimumStreak: 3 },
      baseDuration: { minimum: 3, target: 7, maximum: 15, buildUpStrategy: 'immediate' },
      triggers: [
        {
          type: TriggerType.EVENT_BASED,
          condition: { primary: 'hunt_completion', contextualModifiers: ['before_packing'] },
          strength: TriggerStrength.POWERFUL
        }
      ],
      rewards: [
        {
          type: RewardType.IMMEDIATE_EXTERNAL,
          timing: { immediate: true, frequency: RewardFrequency.EVERY_TIME }
        }
      ],
      personalityAdaptations: {
        [HunterPersonalityType.ACHIEVEMENT_ORIENTED]: {
          emphasis: 'performance_analysis',
          rewards: 'data_insights',
          messaging: 'improvement_focused'
        },
        [HunterPersonalityType.COMMUNITY_FOCUSED]: {
          emphasis: 'sharing_preparation',
          rewards: 'community_recognition',
          messaging: 'contribution_focused'
        }
      }
    });
  }

  private designFormationStrategy(habit: TargetHabit, userProfile: UserBehaviorProfile): FormationStrategy {
    const personalityAdaptation = this.adaptForPersonality(userProfile.primaryType);
    const approach = this.selectFormationApproach(habit, userProfile);
    
    return {
      approach,
      personalityAdaptation,
      phaseStrategies: this.createPhaseStrategies(approach, habit),
      contingencyPlans: this.createContingencyPlans(habit, userProfile),
      supportSystems: this.designSupportSystems(habit, userProfile)
    };
  }

  private calculateOverallHabitStrength(progress: HabitProgressData): number {
    const components = {
      consistency: this.calculateConsistency(progress) * 0.3,
      frequency: this.calculateFrequencyScore(progress) * 0.25,
      duration: this.calculateDurationScore(progress) * 0.2,
      automaticity: this.calculateAutomaticity(progress) * 0.15,
      stability: this.calculateStability(progress) * 0.1
    };

    return Object.values(components).reduce((sum, value) => sum + value, 0);
  }

  private isReadyForNextPhase(plan: HabitFormationPlan, progress: HabitProgressData): boolean {
    const phaseStrategy = plan.formationStrategy.phaseStrategies.find(s => s.phase === plan.currentPhase);
    if (!phaseStrategy) return false;

    // Check if all success criteria are met
    return phaseStrategy.successCriteria.every(criteria => 
      this.evaluatePhaseCriteria(criteria, progress)
    );
  }

  private evaluatePhaseCriteria(criteria: PhaseCriteria, progress: HabitProgressData): boolean {
    // Implementation would evaluate specific criteria against progress data
    return true; // Simplified for example
  }
}

// Supporting interfaces
interface HabitTemplate {
  id: string;
  name: string;
  description: string;
  category: HabitCategory;
  difficulty: HabitDifficulty;
  baseFrequency: HabitFrequency;
  baseDuration: HabitDuration;
  triggers: any[];
  rewards: any[];
  personalityAdaptations: Record<HunterPersonalityType, any>;
}

interface HabitEvent {
  userId: string;
  habitId: string;
  timestamp: Date;
  duration: number;
  quality: number; // 0-1 scale
  context: Record<string, any>;
  completionStatus: 'completed' | 'partial' | 'skipped';
}

interface HabitProgressData {
  userId: string;
  habitId: string;
  startDate: Date;
  totalAttempts: number;
  successfulAttempts: number;
  currentStreak: number;
  longestStreak: number;
  averageDuration: number;
  consistencyScore: number;
  lastActivity: Date;
  phaseHistory: PhaseHistory[];
}

interface HabitPerformanceFeedback {
  userId: string;
  habitId: string;
  performance: PerformanceMetrics;
  streakInfo: StreakInfo;
  improvements: string[];
  encouragement: string;
  adaptationSuggestions: string[];
  nextSteps: string[];
  generatedDate: Date;
}

interface HabitStrengthAnalysis {
  userId: string;
  habitId: string;
  overallStrength: number;
  components: StrengthComponents;
  phaseProgress: number;
  strengthTrend: 'increasing' | 'decreasing' | 'stable';
  projectedCompletion: Date;
  riskFactors: string[];
  strengthFactors: string[];
  recommendations: string[];
}

interface StrengthComponents {
  automaticity: number;
  consistency: number;
  stability: number;
  resilience: number;
}

interface DisruptionContext {
  type: 'seasonal' | 'life-event' | 'illness' | 'schedule-change' | 'motivation-loss';
  severity: 'minor' | 'moderate' | 'major';
  expectedDuration: number; // days
  context: Record<string, any>;
}

interface HabitRecoveryPlan {
  userId: string;
  habitId: string;
  disruptionType: string;
  disruptionSeverity: string;
  recoveryStrategy: string;
  modifiedTriggers: HabitTrigger[];
  temporaryRewards: HabitReward[];
  recoveryTimeline: number;
  supportMeasures: string[];
  monitoring: any;
  createdDate: Date;
}

export default HabitFormationFramework;