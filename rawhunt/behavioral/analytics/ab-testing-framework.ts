/**
 * GoHunta.com A/B Testing Framework
 * 
 * Behavioral science-driven A/B testing framework for optimizing user engagement,
 * retention, and psychological satisfaction through controlled experiments.
 */

export interface ABTest {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  psychologicalBasis: PsychologicalBasis;
  targetMetrics: TargetMetric[];
  variants: TestVariant[];
  audience: AudienceConfig;
  duration: TestDuration;
  status: TestStatus;
  createdBy: string;
  createdDate: Date;
  startDate?: Date;
  endDate?: Date;
  configuration: TestConfiguration;
  results?: TestResults;
}

export interface PsychologicalBasis {
  principle: string; // e.g., "Social Proof", "Loss Aversion", "Progress Motivation"
  theory: string; // e.g., "Self-Determination Theory", "Flow Theory"
  personalityTargets: HunterPersonalityType[];
  expectedBehavior: string;
  literatureReferences: string[];
}

export interface TargetMetric {
  name: string;
  type: 'primary' | 'secondary' | 'guardrail';
  metricId: string;
  expectedChange: number; // percentage
  minimumDetectableEffect: number;
  direction: 'increase' | 'decrease' | 'either';
  psychologicalRelevance: string;
}

export interface TestVariant {
  id: string;
  name: string;
  description: string;
  treatmentType: TreatmentType;
  configuration: VariantConfiguration;
  allocationPercentage: number;
  psychologicalMechanism: string;
  implementationDetails: ImplementationDetails;
}

export enum TreatmentType {
  CONTROL = 'control',
  UI_CHANGE = 'ui-change',
  CONTENT_VARIATION = 'content-variation',
  FEATURE_FLAG = 'feature-flag',
  ALGORITHM_CHANGE = 'algorithm-change',
  NOTIFICATION_TIMING = 'notification-timing',
  GAMIFICATION_ELEMENT = 'gamification-element',
  SOCIAL_PROOF = 'social-proof'
}

export interface VariantConfiguration {
  features: Record<string, any>;
  content: Record<string, string>;
  styling: Record<string, any>;
  behavior: Record<string, any>;
  triggers: TriggerConfig[];
}

export interface TriggerConfig {
  event: string;
  conditions: Record<string, any>;
  action: string;
  timing: TimingConfig;
}

export interface TimingConfig {
  delay?: number;
  frequency?: 'once' | 'daily' | 'weekly' | 'per-session';
  conditions?: string[];
}

export interface ImplementationDetails {
  technicalRequirements: string[];
  dependencies: string[];
  risks: string[];
  rollbackPlan: string;
}

export interface AudienceConfig {
  targetUserCount: number;
  selectionCriteria: SelectionCriteria;
  exclusionCriteria: ExclusionCriteria;
  personalityWeighting: Record<HunterPersonalityType, number>;
  geographic?: GeographicFilter;
  temporal?: TemporalFilter;
}

export interface SelectionCriteria {
  userTypes: HunterPersonalityType[];
  experienceLevel: ('beginner' | 'intermediate' | 'advanced' | 'expert')[];
  engagementLevel: ('low' | 'medium' | 'high')[];
  seasonalActivity: boolean;
  customFilters: CustomFilter[];
}

export interface ExclusionCriteria {
  recentTestParticipants: boolean;
  highChurnRisk: boolean;
  inactiveUsers: boolean;
  betaUsers: boolean;
  customExclusions: CustomFilter[];
}

export interface CustomFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface TestDuration {
  plannedDays: number;
  minimumDays: number;
  maximumDays: number;
  earlyStoppingRules: EarlyStoppingRule[];
  seasonalConsiderations: string[];
}

export interface EarlyStoppingRule {
  condition: string;
  threshold: number;
  action: 'stop' | 'extend' | 'adjust';
  rationale: string;
}

export enum TestStatus {
  DRAFT = 'draft',
  READY = 'ready',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ANALYZING = 'analyzing'
}

export interface TestConfiguration {
  statisticalPower: number;
  significanceLevel: number;
  minimumSampleSize: number;
  trafficAllocation: TrafficAllocation;
  randomizationMethod: RandomizationMethod;
  stratification?: StratificationConfig;
}

export interface TrafficAllocation {
  method: 'equal' | 'weighted' | 'adaptive';
  rules: AllocationRule[];
}

export interface AllocationRule {
  segment: string;
  allocation: Record<string, number>; // variant -> percentage
}

export enum RandomizationMethod {
  SIMPLE = 'simple',
  BLOCKED = 'blocked',
  STRATIFIED = 'stratified',
  CLUSTER = 'cluster'
}

export interface StratificationConfig {
  factors: string[];
  balancing: 'exact' | 'approximate';
}

export interface TestResults {
  summary: ResultSummary;
  variantResults: VariantResults[];
  statisticalAnalysis: StatisticalAnalysis;
  behavioralAnalysis: BehavioralAnalysis;
  recommendations: TestRecommendation[];
  nextSteps: string[];
  generatedDate: Date;
}

export interface ResultSummary {
  winner: string | null;
  confidence: number;
  primaryMetricImprovement: number;
  statisticalSignificance: boolean;
  practicalSignificance: boolean;
  unexpectedFindings: string[];
}

export interface VariantResults {
  variantId: string;
  participantCount: number;
  metrics: MetricResult[];
  behaviorMetrics: BehaviorMetric[];
  psychologicalMetrics: PsychologicalMetric[];
  segmentedResults: SegmentResult[];
}

export interface MetricResult {
  metricId: string;
  name: string;
  value: number;
  confidence: number;
  improvement: number;
  significanceLevel: number;
  pValue: number;
  effect: 'positive' | 'negative' | 'neutral';
}

export interface BehaviorMetric {
  behavior: string;
  frequency: number;
  change: number;
  significance: number;
  context: string;
}

export interface PsychologicalMetric {
  aspect: string; // e.g., "motivation", "satisfaction", "trust"
  score: number;
  change: number;
  significance: number;
  interpretation: string;
}

export interface SegmentResult {
  segment: string;
  participantCount: number;
  results: MetricResult[];
  insights: string[];
}

export interface StatisticalAnalysis {
  power: number;
  effectSize: number;
  confidenceIntervals: ConfidenceInterval[];
  bayesianAnalysis?: BayesianAnalysis;
  multipleComparisonsAdjustment: boolean;
}

export interface ConfidenceInterval {
  metricId: string;
  lowerBound: number;
  upperBound: number;
  level: number; // e.g., 95
}

export interface BayesianAnalysis {
  posteriorProbabilities: Record<string, number>;
  expectedLoss: Record<string, number>;
  valueOfInformation: number;
}

export interface BehavioralAnalysis {
  engagementPatterns: EngagementPattern[];
  learningOutcomes: LearningOutcome[];
  socialBehaviorChanges: SocialBehaviorChange[];
  habitFormationImpact: HabitFormationImpact;
  psychologicalInsights: PsychologicalInsight[];
}

export interface EngagementPattern {
  pattern: string;
  frequency: number;
  variance: string;
  significance: string;
  implications: string[];
}

export interface LearningOutcome {
  skillArea: string;
  improvement: number;
  retention: number;
  application: number;
  confidence: number;
}

export interface SocialBehaviorChange {
  behavior: string;
  direction: 'increased' | 'decreased' | 'unchanged';
  magnitude: number;
  networkEffects: string[];
}

export interface HabitFormationImpact {
  habitStrength: number;
  consistency: number;
  triggerResponseImprovement: number;
  longTermProjection: number;
}

export interface PsychologicalInsight {
  insight: string;
  supportingEvidence: string[];
  implication: string;
  actionability: string;
  confidence: number;
}

export interface TestRecommendation {
  type: 'implement' | 'iterate' | 'abandon' | 'investigate';
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  action: string;
  expectedImpact: string;
  risks: string[];
  resources: string[];
}

export class ABTestingFramework {
  private activeTests: Map<string, ABTest> = new Map();
  private testHistory: Map<string, ABTest> = new Map();
  private participantAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId

  /**
   * Create and configure new A/B test
   */
  createTest(testConfig: Omit<ABTest, 'id' | 'status' | 'createdDate'>): ABTest {
    const test: ABTest = {
      ...testConfig,
      id: this.generateTestId(),
      status: TestStatus.DRAFT,
      createdDate: new Date()
    };

    this.validateTestConfiguration(test);
    this.testHistory.set(test.id, test);
    
    return test;
  }

  /**
   * Start A/B test with user assignment
   */
  startTest(testId: string): void {
    const test = this.testHistory.get(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    if (test.status !== TestStatus.READY) {
      throw new Error('Test is not ready to start');
    }

    test.status = TestStatus.RUNNING;
    test.startDate = new Date();

    // Calculate end date
    test.endDate = new Date(test.startDate.getTime() + test.duration.plannedDays * 24 * 60 * 60 * 1000);

    this.activeTests.set(testId, test);
    this.initializeUserAssignments(test);
  }

  /**
   * Assign user to test variant
   */
  assignUserToVariant(userId: string, testId: string): string | null {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== TestStatus.RUNNING) {
      return null;
    }

    // Check if user already assigned
    const userAssignments = this.participantAssignments.get(userId) || new Map();
    if (userAssignments.has(testId)) {
      return userAssignments.get(testId)!;
    }

    // Check if user qualifies for test
    if (!this.isUserEligible(userId, test)) {
      return null;
    }

    // Assign variant based on configuration
    const variantId = this.determineVariant(userId, test);
    
    // Store assignment
    userAssignments.set(testId, variantId);
    this.participantAssignments.set(userId, userAssignments);

    return variantId;
  }

  /**
   * Track test event for analysis
   */
  trackTestEvent(userId: string, testId: string, eventType: string, properties: Record<string, any>): void {
    const assignment = this.participantAssignments.get(userId)?.get(testId);
    if (!assignment) {
      return; // User not in test
    }

    const test = this.activeTests.get(testId);
    if (!test) {
      return;
    }

    const event: TestEvent = {
      testId,
      userId,
      variantId: assignment,
      eventType,
      properties,
      timestamp: new Date()
    };

    this.recordTestEvent(event);
    this.updateRealTimeMetrics(test, event);
    this.checkEarlyStoppingConditions(test);
  }

  /**
   * Analyze test results
   */
  analyzeTestResults(testId: string): TestResults {
    const test = this.testHistory.get(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    const testEvents = this.getTestEvents(testId);
    const participants = this.getTestParticipants(testId);

    // Calculate variant results
    const variantResults = test.variants.map(variant => 
      this.calculateVariantResults(variant, testEvents, participants)
    );

    // Perform statistical analysis
    const statisticalAnalysis = this.performStatisticalAnalysis(test, variantResults);

    // Perform behavioral analysis
    const behavioralAnalysis = this.performBehavioralAnalysis(test, testEvents, participants);

    // Generate recommendations
    const recommendations = this.generateRecommendations(test, variantResults, statisticalAnalysis, behavioralAnalysis);

    const results: TestResults = {
      summary: this.generateResultSummary(variantResults, statisticalAnalysis),
      variantResults,
      statisticalAnalysis,
      behavioralAnalysis,
      recommendations,
      nextSteps: this.generateNextSteps(recommendations),
      generatedDate: new Date()
    };

    test.results = results;
    return results;
  }

  /**
   * Create psychological experiment for hunter behavior
   */
  createPsychologicalExperiment(
    principle: string, 
    targetPersonality: HunterPersonalityType,
    feature: string
  ): ABTest {
    const psychologicalTests = {
      'social_proof': this.createSocialProofTest(targetPersonality, feature),
      'progress_motivation': this.createProgressMotivationTest(targetPersonality, feature),
      'achievement_framing': this.createAchievementFramingTest(targetPersonality, feature),
      'community_recognition': this.createCommunityRecognitionTest(targetPersonality, feature),
      'habit_formation': this.createHabitFormationTest(targetPersonality, feature)
    };

    const testCreator = psychologicalTests[principle as keyof typeof psychologicalTests];
    if (!testCreator) {
      throw new Error(`Unknown psychological principle: ${principle}`);
    }

    return testCreator;
  }

  /**
   * Monitor test performance in real-time
   */
  monitorTestPerformance(testId: string): TestPerformanceMetrics {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error('Active test not found');
    }

    const events = this.getRecentTestEvents(testId, 3600000); // Last hour
    const participants = this.getCurrentParticipantCount(testId);

    return {
      testId,
      status: test.status,
      daysSinceStart: this.calculateDaysSinceStart(test),
      participantCount: participants,
      conversionRates: this.calculateCurrentConversionRates(test, events),
      significanceProgress: this.calculateSignificanceProgress(test, events),
      earlyStoppingFlags: this.checkEarlyStoppingFlags(test, events),
      recommendations: this.generateRealTimeRecommendations(test, events),
      lastUpdate: new Date()
    };
  }

  private validateTestConfiguration(test: ABTest): void {
    // Validate allocation percentages sum to 100
    const totalAllocation = test.variants.reduce((sum, variant) => sum + variant.allocationPercentage, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Variant allocations must sum to 100%');
    }

    // Validate minimum sample size
    if (test.configuration.minimumSampleSize < 100) {
      throw new Error('Minimum sample size must be at least 100');
    }

    // Validate duration
    if (test.duration.minimumDays < 7) {
      throw new Error('Minimum test duration must be at least 7 days');
    }
  }

  private isUserEligible(userId: string, test: ABTest): boolean {
    const userProfile = this.getUserProfile(userId);
    if (!userProfile) {
      return false;
    }

    const criteria = test.audience.selectionCriteria;
    
    // Check personality type
    if (!criteria.userTypes.includes(userProfile.personalityType)) {
      return false;
    }

    // Check experience level
    if (!criteria.experienceLevel.includes(userProfile.experienceLevel)) {
      return false;
    }

    // Check engagement level
    if (!criteria.engagementLevel.includes(userProfile.engagementLevel)) {
      return false;
    }

    // Check exclusion criteria
    if (this.isUserExcluded(userId, test.audience.exclusionCriteria)) {
      return false;
    }

    return true;
  }

  private determineVariant(userId: string, test: ABTest): string {
    const hash = this.hashUserId(userId, test.id);
    const randomValue = (hash % 10000) / 10000; // 0-1 range

    let cumulativePercentage = 0;
    for (const variant of test.variants) {
      cumulativePercentage += variant.allocationPercentage / 100;
      if (randomValue <= cumulativePercentage) {
        return variant.id;
      }
    }

    return test.variants[0].id; // Fallback to first variant
  }

  private createSocialProofTest(personality: HunterPersonalityType, feature: string): ABTest {
    return this.createTest({
      name: `Social Proof Impact - ${feature}`,
      description: `Testing the impact of social proof elements on ${feature} engagement`,
      hypothesis: 'Adding social proof elements will increase engagement through community validation',
      psychologicalBasis: {
        principle: 'Social Proof',
        theory: 'Social Influence Theory',
        personalityTargets: [personality],
        expectedBehavior: 'Increased engagement through peer validation',
        literatureReferences: ['Cialdini, R. (2007). Influence: The Psychology of Persuasion']
      },
      targetMetrics: [
        {
          name: 'Feature Engagement Rate',
          type: 'primary',
          metricId: 'feature-engagement',
          expectedChange: 15,
          minimumDetectableEffect: 5,
          direction: 'increase',
          psychologicalRelevance: 'Social validation drives behavior'
        }
      ],
      variants: [
        {
          id: 'control',
          name: 'Control',
          description: 'Standard interface without social proof',
          treatmentType: TreatmentType.CONTROL,
          configuration: { features: {} },
          allocationPercentage: 50,
          psychologicalMechanism: 'Baseline behavior',
          implementationDetails: { technicalRequirements: [], dependencies: [], risks: [], rollbackPlan: 'N/A' }
        },
        {
          id: 'social-proof',
          name: 'Social Proof',
          description: 'Interface with community activity indicators',
          treatmentType: TreatmentType.UI_CHANGE,
          configuration: {
            features: { showCommunityActivity: true, showPeerComparisons: true }
          },
          allocationPercentage: 50,
          psychologicalMechanism: 'Social validation and peer influence',
          implementationDetails: { technicalRequirements: ['activity-data'], dependencies: ['community-service'], risks: ['performance-impact'], rollbackPlan: 'Feature flag disable' }
        }
      ],
      audience: {
        targetUserCount: 1000,
        selectionCriteria: {
          userTypes: [personality],
          experienceLevel: ['intermediate', 'advanced'],
          engagementLevel: ['medium', 'high'],
          seasonalActivity: true,
          customFilters: []
        },
        exclusionCriteria: {
          recentTestParticipants: true,
          highChurnRisk: true,
          inactiveUsers: true,
          betaUsers: false,
          customExclusions: []
        },
        personalityWeighting: { [personality]: 1 } as any
      },
      duration: {
        plannedDays: 14,
        minimumDays: 7,
        maximumDays: 28,
        earlyStoppingRules: [
          {
            condition: 'statistical_significance',
            threshold: 0.95,
            action: 'stop',
            rationale: 'Clear winner determined'
          }
        ],
        seasonalConsiderations: []
      },
      configuration: {
        statisticalPower: 0.8,
        significanceLevel: 0.05,
        minimumSampleSize: 500,
        trafficAllocation: {
          method: 'equal',
          rules: []
        },
        randomizationMethod: RandomizationMethod.SIMPLE
      },
      createdBy: 'behavioral-framework'
    });
  }

  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashUserId(userId: string, testId: string): number {
    // Simple hash function for consistent user assignment
    const str = userId + testId;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

interface TestEvent {
  testId: string;
  userId: string;
  variantId: string;
  eventType: string;
  properties: Record<string, any>;
  timestamp: Date;
}

interface TestPerformanceMetrics {
  testId: string;
  status: TestStatus;
  daysSinceStart: number;
  participantCount: number;
  conversionRates: Record<string, number>;
  significanceProgress: number;
  earlyStoppingFlags: string[];
  recommendations: string[];
  lastUpdate: Date;
}

export default ABTestingFramework;