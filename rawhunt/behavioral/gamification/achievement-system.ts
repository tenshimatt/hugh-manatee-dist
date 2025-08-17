/**
 * GoHunta.com Achievement System
 * 
 * Comprehensive achievement and gamification system designed around
 * hunter psychology and motivation patterns to drive long-term engagement.
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  difficulty: DifficultyLevel;
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  prerequisites: string[]; // Other achievement IDs
  isSecret: boolean;
  timeframe?: TimeframeCriteria;
  personalityTargets: HunterPersonalityType[];
  motivationType: MotivationType;
  progressTrackable: boolean;
  shareability: ShareabilityLevel;
  createdDate: Date;
}

export enum AchievementCategory {
  HUNTING_SKILLS = 'hunting-skills',
  DOG_TRAINING = 'dog-training',
  COMMUNITY_CONTRIBUTION = 'community-contribution',
  KNOWLEDGE_SHARING = 'knowledge-sharing',
  CONSISTENCY = 'consistency',
  EXPLORATION = 'exploration',
  SAFETY = 'safety',
  ETHICS = 'ethics',
  SEASONAL = 'seasonal',
  MILESTONE = 'milestone'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  LEGENDARY = 'legendary'
}

export interface AchievementRequirement {
  type: RequirementType;
  target: number;
  metric: string;
  timeframe?: string;
  conditions?: Record<string, any>;
}

export enum RequirementType {
  COUNT = 'count',
  STREAK = 'streak',
  PERCENTAGE = 'percentage',
  RATING = 'rating',
  COMPLETION = 'completion',
  PARTICIPATION = 'participation'
}

export interface AchievementReward {
  type: RewardType;
  value: string | number;
  description: string;
  rarity: RewardRarity;
}

export enum RewardType {
  BADGE = 'badge',
  TITLE = 'title',
  POINTS = 'points',
  FEATURE_UNLOCK = 'feature-unlock',
  CUSTOMIZATION = 'customization',
  RECOGNITION = 'recognition',
  ACCESS = 'access'
}

export enum RewardRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface TimeframeCriteria {
  duration: number;
  unit: 'days' | 'weeks' | 'months' | 'seasons';
  recurring: boolean;
}

export enum HunterPersonalityType {
  ACHIEVEMENT_ORIENTED = 'achievement-oriented',
  COMMUNITY_FOCUSED = 'community-focused',
  TRADITION_PRESERVING = 'tradition-preserving',
  INNOVATION_SEEKING = 'innovation-seeking'
}

export enum MotivationType {
  COMPETENCE = 'competence',
  AUTONOMY = 'autonomy',
  RELATEDNESS = 'relatedness',
  RECOGNITION = 'recognition',
  MASTERY = 'mastery'
}

export enum ShareabilityLevel {
  PRIVATE = 'private',
  FRIENDS = 'friends',
  COMMUNITY = 'community',
  PUBLIC = 'public'
}

export interface UserAchievementProgress {
  userId: string;
  achievementId: string;
  currentProgress: number;
  maxProgress: number;
  startDate: Date;
  lastUpdate: Date;
  isCompleted: boolean;
  completedDate?: Date;
  milestones: AchievementMilestone[];
}

export interface AchievementMilestone {
  percentage: number;
  reached: boolean;
  reachedDate?: Date;
  reward?: AchievementReward;
}

export interface ProgressVisualization {
  userId: string;
  achievementId: string;
  visualType: VisualizationType;
  currentLevel: number;
  nextLevel: number;
  progressPercentage: number;
  recentGains: number;
  streakCount: number;
  personalBest: number;
  ranking?: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export enum VisualizationType {
  PROGRESS_BAR = 'progress-bar',
  LEVEL_SYSTEM = 'level-system',
  SKILL_TREE = 'skill-tree',
  BADGE_COLLECTION = 'badge-collection',
  STREAK_COUNTER = 'streak-counter',
  LEADERBOARD = 'leaderboard'
}

export class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map();
  private userProgress: Map<string, Map<string, UserAchievementProgress>> = new Map();
  private globalStats: Map<string, number> = new Map();

  constructor() {
    this.initializeAchievements();
  }

  /**
   * Initialize predefined achievements based on hunter psychology
   */
  private initializeAchievements(): void {
    // Hunting Skills Achievements
    this.createAchievement({
      id: 'first-successful-hunt',
      name: 'First Success',
      description: 'Log your first successful hunt',
      category: AchievementCategory.HUNTING_SKILLS,
      difficulty: DifficultyLevel.BEGINNER,
      requirements: [{
        type: RequirementType.COUNT,
        target: 1,
        metric: 'successful_hunts'
      }],
      rewards: [{
        type: RewardType.BADGE,
        value: 'first-success-badge',
        description: 'First Success Badge',
        rarity: RewardRarity.COMMON
      }],
      prerequisites: [],
      isSecret: false,
      personalityTargets: [HunterPersonalityType.ACHIEVEMENT_ORIENTED],
      motivationType: MotivationType.COMPETENCE,
      progressTrackable: true,
      shareability: ShareabilityLevel.COMMUNITY,
      createdDate: new Date()
    });

    this.createAchievement({
      id: 'hunting-streak-7',
      name: 'Weekly Warrior',
      description: 'Hunt successfully for 7 consecutive days',
      category: AchievementCategory.CONSISTENCY,
      difficulty: DifficultyLevel.INTERMEDIATE,
      requirements: [{
        type: RequirementType.STREAK,
        target: 7,
        metric: 'consecutive_hunt_days'
      }],
      rewards: [
        {
          type: RewardType.BADGE,
          value: 'weekly-warrior-badge',
          description: 'Weekly Warrior Badge',
          rarity: RewardRarity.UNCOMMON
        },
        {
          type: RewardType.POINTS,
          value: 500,
          description: '500 Dedication Points',
          rarity: RewardRarity.COMMON
        }
      ],
      prerequisites: ['first-successful-hunt'],
      isSecret: false,
      personalityTargets: [HunterPersonalityType.ACHIEVEMENT_ORIENTED],
      motivationType: MotivationType.MASTERY,
      progressTrackable: true,
      shareability: ShareabilityLevel.PUBLIC,
      createdDate: new Date()
    });

    // Dog Training Achievements
    this.createAchievement({
      id: 'training-consistency-30',
      name: 'Dedicated Trainer',
      description: 'Complete dog training sessions for 30 consecutive days',
      category: AchievementCategory.DOG_TRAINING,
      difficulty: DifficultyLevel.ADVANCED,
      requirements: [{
        type: RequirementType.STREAK,
        target: 30,
        metric: 'consecutive_training_days'
      }],
      rewards: [
        {
          type: RewardType.TITLE,
          value: 'Dedicated Trainer',
          description: 'Dedicated Trainer Title',
          rarity: RewardRarity.RARE
        },
        {
          type: RewardType.FEATURE_UNLOCK,
          value: 'advanced-training-analytics',
          description: 'Advanced Training Analytics',
          rarity: RewardRarity.RARE
        }
      ],
      prerequisites: [],
      isSecret: false,
      personalityTargets: [HunterPersonalityType.ACHIEVEMENT_ORIENTED, HunterPersonalityType.TRADITION_PRESERVING],
      motivationType: MotivationType.MASTERY,
      progressTrackable: true,
      shareability: ShareabilityLevel.COMMUNITY,
      createdDate: new Date()
    });

    // Community Achievements
    this.createAchievement({
      id: 'knowledge-sharer',
      name: 'Knowledge Sharer',
      description: 'Help 10 community members with helpful answers',
      category: AchievementCategory.COMMUNITY_CONTRIBUTION,
      difficulty: DifficultyLevel.INTERMEDIATE,
      requirements: [{
        type: RequirementType.COUNT,
        target: 10,
        metric: 'helpful_answers'
      }],
      rewards: [
        {
          type: RewardType.BADGE,
          value: 'knowledge-sharer-badge',
          description: 'Knowledge Sharer Badge',
          rarity: RewardRarity.UNCOMMON
        },
        {
          type: RewardType.RECOGNITION,
          value: 'community-helper',
          description: 'Community Helper Status',
          rarity: RewardRarity.UNCOMMON
        }
      ],
      prerequisites: [],
      isSecret: false,
      personalityTargets: [HunterPersonalityType.COMMUNITY_FOCUSED, HunterPersonalityType.TRADITION_PRESERVING],
      motivationType: MotivationType.RELATEDNESS,
      progressTrackable: true,
      shareability: ShareabilityLevel.COMMUNITY,
      createdDate: new Date()
    });

    // Seasonal Achievements
    this.createAchievement({
      id: 'season-completionist',
      name: 'Season Completionist',
      description: 'Hunt at least once per week throughout the entire hunting season',
      category: AchievementCategory.SEASONAL,
      difficulty: DifficultyLevel.EXPERT,
      requirements: [{
        type: RequirementType.PERCENTAGE,
        target: 90,
        metric: 'season_week_participation',
        timeframe: 'hunting_season'
      }],
      rewards: [
        {
          type: RewardType.TITLE,
          value: 'Season Master',
          description: 'Season Master Title',
          rarity: RewardRarity.EPIC
        },
        {
          type: RewardType.CUSTOMIZATION,
          value: 'season-master-theme',
          description: 'Exclusive Season Master Theme',
          rarity: RewardRarity.EPIC
        }
      ],
      prerequisites: ['hunting-streak-7'],
      isSecret: false,
      timeframe: {
        duration: 1,
        unit: 'seasons',
        recurring: true
      },
      personalityTargets: [HunterPersonalityType.ACHIEVEMENT_ORIENTED, HunterPersonalityType.TRADITION_PRESERVING],
      motivationType: MotivationType.MASTERY,
      progressTrackable: true,
      shareability: ShareabilityLevel.PUBLIC,
      createdDate: new Date()
    });

    // Secret Achievements
    this.createAchievement({
      id: 'perfect-storm',
      name: 'Perfect Storm',
      description: 'Complete a hunt in challenging weather conditions with 100% success rate',
      category: AchievementCategory.HUNTING_SKILLS,
      difficulty: DifficultyLevel.LEGENDARY,
      requirements: [
        {
          type: RequirementType.COMPLETION,
          target: 1,
          metric: 'challenging_weather_hunt',
          conditions: {
            weather: ['rain', 'snow', 'wind_high'],
            success_rate: 1.0
          }
        }
      ],
      rewards: [
        {
          type: RewardType.BADGE,
          value: 'perfect-storm-badge',
          description: 'Perfect Storm Badge',
          rarity: RewardRarity.LEGENDARY
        },
        {
          type: RewardType.POINTS,
          value: 2000,
          description: '2000 Master Points',
          rarity: RewardRarity.LEGENDARY
        }
      ],
      prerequisites: [],
      isSecret: true,
      personalityTargets: [HunterPersonalityType.ACHIEVEMENT_ORIENTED, HunterPersonalityType.INNOVATION_SEEKING],
      motivationType: MotivationType.MASTERY,
      progressTrackable: false,
      shareability: ShareabilityLevel.PUBLIC,
      createdDate: new Date()
    });
  }

  /**
   * Create a new achievement
   */
  createAchievement(achievementData: Omit<Achievement, 'id'> & { id: string }): Achievement {
    const achievement: Achievement = {
      ...achievementData,
      createdDate: new Date()
    };

    this.achievements.set(achievement.id, achievement);
    return achievement;
  }

  /**
   * Update user progress towards achievements
   */
  updateUserProgress(userId: string, metric: string, value: number, context?: Record<string, any>): void {
    const userProgressMap = this.userProgress.get(userId) || new Map();
    
    // Find achievements that use this metric
    const relevantAchievements = Array.from(this.achievements.values()).filter(
      achievement => achievement.requirements.some(req => req.metric === metric)
    );

    for (const achievement of relevantAchievements) {
      let progress = userProgressMap.get(achievement.id);
      
      if (!progress) {
        progress = this.initializeUserProgress(userId, achievement.id);
        userProgressMap.set(achievement.id, progress);
      }

      if (!progress.isCompleted) {
        this.calculateProgress(progress, achievement, metric, value, context);
        
        if (this.checkAchievementCompletion(progress, achievement)) {
          this.completeAchievement(userId, achievement.id);
        }
      }
    }

    this.userProgress.set(userId, userProgressMap);
  }

  /**
   * Get user's achievement progress
   */
  getUserAchievementProgress(userId: string, achievementId?: string): UserAchievementProgress | UserAchievementProgress[] {
    const userProgressMap = this.userProgress.get(userId);
    if (!userProgressMap) {
      return achievementId ? this.initializeUserProgress(userId, achievementId) : [];
    }

    if (achievementId) {
      return userProgressMap.get(achievementId) || this.initializeUserProgress(userId, achievementId);
    }

    return Array.from(userProgressMap.values());
  }

  /**
   * Get personalized achievement recommendations
   */
  getPersonalizedRecommendations(userId: string, personalityType: HunterPersonalityType): Achievement[] {
    const userProgressMap = this.userProgress.get(userId) || new Map();
    const completedAchievements = new Set(
      Array.from(userProgressMap.values())
        .filter(progress => progress.isCompleted)
        .map(progress => progress.achievementId)
    );

    return Array.from(this.achievements.values())
      .filter(achievement => 
        !completedAchievements.has(achievement.id) &&
        achievement.personalityTargets.includes(personalityType) &&
        this.arePrerequisitesMet(userId, achievement)
      )
      .sort((a, b) => {
        // Prioritize by difficulty and progress
        const aProgress = userProgressMap.get(a.id);
        const bProgress = userProgressMap.get(b.id);
        
        const aScore = (aProgress?.currentProgress || 0) / this.getDifficultyMultiplier(a.difficulty);
        const bScore = (bProgress?.currentProgress || 0) / this.getDifficultyMultiplier(b.difficulty);
        
        return bScore - aScore;
      })
      .slice(0, 5);
  }

  /**
   * Generate progress visualization for user
   */
  generateProgressVisualization(userId: string, achievementId: string): ProgressVisualization {
    const progress = this.getUserAchievementProgress(userId, achievementId) as UserAchievementProgress;
    const achievement = this.achievements.get(achievementId);
    
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    return {
      userId,
      achievementId,
      visualType: this.getOptimalVisualizationType(achievement),
      currentLevel: Math.floor(progress.currentProgress / 10), // Example level calculation
      nextLevel: Math.floor(progress.currentProgress / 10) + 1,
      progressPercentage: (progress.currentProgress / progress.maxProgress) * 100,
      recentGains: this.calculateRecentGains(progress),
      streakCount: this.calculateStreakCount(progress),
      personalBest: this.getPersonalBest(userId, achievement.category),
      ranking: this.getUserRanking(userId, achievementId),
      trend: this.calculateProgressTrend(progress)
    };
  }

  /**
   * Get achievement leaderboard
   */
  getLeaderboard(achievementId: string, limit: number = 10): LeaderboardEntry[] {
    const leaderboard: LeaderboardEntry[] = [];
    
    for (const [userId, userProgressMap] of this.userProgress.entries()) {
      const progress = userProgressMap.get(achievementId);
      if (progress) {
        leaderboard.push({
          userId,
          progress: progress.currentProgress,
          isCompleted: progress.isCompleted,
          completedDate: progress.completedDate,
          rank: 0 // Will be calculated after sorting
        });
      }
    }

    // Sort by progress and completion
    leaderboard.sort((a, b) => {
      if (a.isCompleted && !b.isCompleted) return -1;
      if (!a.isCompleted && b.isCompleted) return 1;
      if (a.isCompleted && b.isCompleted) {
        return (a.completedDate?.getTime() || 0) - (b.completedDate?.getTime() || 0);
      }
      return b.progress - a.progress;
    });

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboard.slice(0, limit);
  }

  private initializeUserProgress(userId: string, achievementId: string): UserAchievementProgress {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    const maxProgress = this.calculateMaxProgress(achievement);
    
    return {
      userId,
      achievementId,
      currentProgress: 0,
      maxProgress,
      startDate: new Date(),
      lastUpdate: new Date(),
      isCompleted: false,
      milestones: this.generateMilestones(maxProgress)
    };
  }

  private calculateProgress(
    progress: UserAchievementProgress, 
    achievement: Achievement, 
    metric: string, 
    value: number, 
    context?: Record<string, any>
  ): void {
    const requirement = achievement.requirements.find(req => req.metric === metric);
    if (!requirement) return;

    switch (requirement.type) {
      case RequirementType.COUNT:
        progress.currentProgress = Math.min(progress.currentProgress + value, requirement.target);
        break;
      case RequirementType.STREAK:
        // Streak logic would be more complex, considering consecutive days
        break;
      case RequirementType.PERCENTAGE:
        // Percentage calculation based on context
        break;
      default:
        progress.currentProgress = Math.min(progress.currentProgress + value, progress.maxProgress);
    }

    progress.lastUpdate = new Date();
    this.updateMilestones(progress);
  }

  private checkAchievementCompletion(progress: UserAchievementProgress, achievement: Achievement): boolean {
    return progress.currentProgress >= progress.maxProgress;
  }

  private completeAchievement(userId: string, achievementId: string): void {
    const userProgressMap = this.userProgress.get(userId);
    const progress = userProgressMap?.get(achievementId);
    
    if (progress && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedDate = new Date();
      
      // Trigger reward distribution
      this.distributeRewards(userId, achievementId);
      
      // Update global statistics
      this.updateGlobalStats(achievementId);
    }
  }

  private calculateMaxProgress(achievement: Achievement): number {
    return achievement.requirements.reduce((max, req) => Math.max(max, req.target), 1);
  }

  private generateMilestones(maxProgress: number): AchievementMilestone[] {
    const milestones: AchievementMilestone[] = [];
    const percentages = [25, 50, 75, 90];
    
    for (const percentage of percentages) {
      milestones.push({
        percentage,
        reached: false
      });
    }
    
    return milestones;
  }

  private arePrerequisitesMet(userId: string, achievement: Achievement): boolean {
    if (achievement.prerequisites.length === 0) return true;
    
    const userProgressMap = this.userProgress.get(userId);
    if (!userProgressMap) return false;
    
    return achievement.prerequisites.every(prereqId => {
      const progress = userProgressMap.get(prereqId);
      return progress?.isCompleted || false;
    });
  }

  private getDifficultyMultiplier(difficulty: DifficultyLevel): number {
    const multipliers = {
      [DifficultyLevel.BEGINNER]: 1,
      [DifficultyLevel.INTERMEDIATE]: 2,
      [DifficultyLevel.ADVANCED]: 4,
      [DifficultyLevel.EXPERT]: 8,
      [DifficultyLevel.LEGENDARY]: 16
    };
    return multipliers[difficulty];
  }
}

interface LeaderboardEntry {
  userId: string;
  progress: number;
  isCompleted: boolean;
  completedDate?: Date;
  rank: number;
}

export default AchievementSystem;