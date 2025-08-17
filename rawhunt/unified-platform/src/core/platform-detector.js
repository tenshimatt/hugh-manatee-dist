// Platform Detection Logic
// Determines whether a request is for Rawgle or GoHunta

export class PlatformDetector {
  /**
   * Detect platform from request
   * @param {Request} request 
   * @returns {'rawgle' | 'gohunta'}
   */
  static detect(request) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    const userAgent = request.headers.get('user-agent') || '';
    
    // Host-based detection (primary method)
    if (host.includes('rawgle')) {
      return 'rawgle';
    }
    if (host.includes('gohunta')) {
      return 'gohunta';
    }
    
    // Header-based detection (for API calls)
    const platformHeader = request.headers.get('x-platform');
    if (platformHeader === 'rawgle' || platformHeader === 'gohunta') {
      return platformHeader;
    }
    
    // User-Agent detection (mobile apps)
    if (userAgent.includes('RawgleApp')) {
      return 'rawgle';
    }
    if (userAgent.includes('GoHuntaApp')) {
      return 'gohunta';
    }
    
    // URL path detection (fallback)
    if (url.pathname.startsWith('/rawgle') || url.pathname.includes('/api/v1/rawgle')) {
      return 'rawgle';
    }
    if (url.pathname.startsWith('/gohunta') || url.pathname.includes('/api/v1/gohunta')) {
      return 'gohunta';
    }
    
    // Default to rawgle for backwards compatibility
    return 'rawgle';
  }
  
  /**
   * Get platform configuration from database
   * @param {'rawgle' | 'gohunta'} platform 
   * @param {D1Database} db 
   * @returns {Promise<Object>}
   */
  static async getConfig(platform, db) {
    try {
      const result = await db
        .prepare('SELECT * FROM platform_config WHERE platform = ? AND active = TRUE')
        .bind(platform)
        .first();
      
      if (!result) {
        throw new Error(`Platform configuration not found: ${platform}`);
      }
      
      return {
        platform: result.platform,
        name: result.name,
        displayName: result.display_name,
        description: result.description,
        features: JSON.parse(result.features),
        theme: JSON.parse(result.theme),
        settings: result.settings ? JSON.parse(result.settings) : {}
      };
    } catch (error) {
      console.error('Error fetching platform config:', error);
      // Return default config to prevent failures
      return this.getDefaultConfig(platform);
    }
  }
  
  /**
   * Get default platform configuration
   * @param {'rawgle' | 'gohunta'} platform 
   * @returns {Object}
   */
  static getDefaultConfig(platform) {
    const configs = {
      rawgle: {
        platform: 'rawgle',
        name: 'rawgle',
        displayName: 'Rawgle',
        description: 'Raw feeding community and marketplace',
        features: {
          feeding_logs: true,
          paws_rewards: true,
          nft_profiles: true,
          nutrition_calculator: true,
          meal_planner: true
        },
        theme: {
          primary_color: '#FF6B6B',
          secondary_color: '#4ECDC4',
          accent_color: '#45B7D1'
        },
        settings: {}
      },
      gohunta: {
        platform: 'gohunta',
        name: 'gohunta',
        displayName: 'GoHunta',
        description: 'Hunting and gun dog community platform',
        features: {
          hunt_logs: true,
          gps_tracking: true,
          training_sessions: true,
          game_tracking: true,
          weather_integration: true
        },
        theme: {
          primary_color: '#FF7700',
          secondary_color: '#228B22',
          accent_color: '#D2B48C'
        },
        settings: {}
      }
    };
    
    return configs[platform] || configs.rawgle;
  }
  
  /**
   * Check if platform supports a specific feature
   * @param {Object} platformConfig 
   * @param {string} feature 
   * @returns {boolean}
   */
  static hasFeature(platformConfig, feature) {
    return platformConfig.features[feature] === true;
  }
  
  /**
   * Get platform-specific database table names
   * @param {'rawgle' | 'gohunta'} platform 
   * @returns {Object}
   */
  static getTableNames(platform) {
    const commonTables = {
      users: 'users',
      pets: 'pets',
      suppliers: 'suppliers',
      products: 'products',
      community_posts: 'community_posts',
      community_comments: 'community_comments',
      reviews: 'reviews'
    };
    
    const platformSpecificTables = {
      rawgle: {
        ...commonTables,
        feeding_logs: 'feeding_logs',
        paws_transactions: 'paws_transactions',
        nft_records: 'nft_records'
      },
      gohunta: {
        ...commonTables,
        hunt_logs: 'hunt_logs',
        game_harvested: 'game_harvested',
        training_sessions: 'training_sessions',
        training_goals: 'training_goals'
      }
    };
    
    return platformSpecificTables[platform] || commonTables;
  }
  
  /**
   * Validate platform-specific data
   * @param {'rawgle' | 'gohunta'} platform 
   * @param {Object} data 
   * @param {string} dataType 
   * @returns {boolean}
   */
  static validatePlatformData(platform, data, dataType) {
    const validators = {
      rawgle: {
        feeding_log: (data) => {
          return data.pet_id && 
                 data.feeding_date && 
                 data.food_type &&
                 data.amount_oz > 0;
        },
        paws_transaction: (data) => {
          return data.user_id &&
                 data.transaction_type &&
                 typeof data.amount === 'number' &&
                 data.reason;
        }
      },
      gohunta: {
        hunt_log: (data) => {
          return data.user_id &&
                 data.hunt_date &&
                 data.location_name &&
                 data.hunting_type;
        },
        training_session: (data) => {
          return data.dog_id &&
                 data.session_date &&
                 data.training_type &&
                 data.exercise_type;
        }
      }
    };
    
    const validator = validators[platform]?.[dataType];
    return validator ? validator(data) : true;
  }
  
  /**
   * Get platform-specific error messages
   * @param {'rawgle' | 'gohunta'} platform 
   * @param {string} errorCode 
   * @returns {string}
   */
  static getErrorMessage(platform, errorCode) {
    const messages = {
      rawgle: {
        INVALID_FEEDING_DATA: 'Invalid feeding log data. Please check pet, date, food type, and amount.',
        INSUFFICIENT_PAWS: 'Insufficient PAWS tokens for this transaction.',
        NFT_MINT_FAILED: 'Failed to mint NFT. Please try again later.',
        NUTRITION_CALC_ERROR: 'Error calculating nutrition. Please verify input data.'
      },
      gohunta: {
        INVALID_HUNT_DATA: 'Invalid hunt log data. Please check date, location, and hunting type.',
        GPS_DATA_ERROR: 'GPS data is invalid or corrupted.',
        TRAINING_SESSION_ERROR: 'Invalid training session data. Please check dog and exercise details.',
        WEATHER_API_ERROR: 'Unable to fetch weather data. Please try again.'
      }
    };
    
    return messages[platform]?.[errorCode] || 'An unexpected error occurred.';
  }
}