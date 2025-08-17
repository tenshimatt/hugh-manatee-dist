export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PETS: '/pets',
  PET_DETAIL: '/pets/:id',
  ADD_PET: '/pets/add',
  FEEDING: '/feeding',
  AI_MEDICAL: '/ai-medical',
  PAWS_WALLET: '/paws',
  NFT_GALLERY: '/nfts',
  NFT_MARKETPLACE: '/marketplace',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
};

export const PET_TYPES = {
  DOG: 'dog',
  CAT: 'cat',
  BIRD: 'bird',
  FISH: 'fish',
  RABBIT: 'rabbit',
  HAMSTER: 'hamster',
  OTHER: 'other',
};

export const FEEDING_TYPES = {
  DRY_FOOD: 'dry_food',
  WET_FOOD: 'wet_food',
  RAW_FOOD: 'raw_food',
  TREATS: 'treats',
  SUPPLEMENTS: 'supplements',
};

export const REWARD_TYPES = {
  PROFILE_COMPLETION: 'profile_completion',
  DAILY_FEEDING: 'daily_feeding',
  WEEKLY_CONSISTENCY: 'weekly_consistency',
  MONTHLY_HEALTH_REPORT: 'monthly_health_report',
  AI_CONSULTATION: 'ai_consultation',
  NFT_MINTING: 'nft_minting',
};

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
};

export const NFT_TYPES = {
  PET_PROFILE: 'pet_profile',
  MILESTONE: 'milestone',
  MEMORIAL: 'memorial',
  ACHIEVEMENT: 'achievement',
};

export const HEALTH_EMERGENCY_KEYWORDS = [
  'emergency',
  'urgent',
  'bleeding',
  'poisoned',
  'choking',
  'unconscious',
  'seizure',
  'difficulty breathing',
  'hit by car',
  'severe pain',
];

export const API_ENDPOINTS = {
  AUTH: '/auth',
  PETS: '/pets',
  FEEDING: '/feeding',
  AI_MEDICAL: '/ai-medical',
  PAWS: '/paws',
  NFT: '/nft',
  ANALYTICS: '/analytics',
  SUBSCRIPTION: '/subscription',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'rawgle_token',
  USER_PREFERENCES: 'rawgle_preferences',
  THEME: 'rawgle_theme',
};