# Rawgle Platform - UI/UX Implementation Guide

## 🎨 Design System & CTAs

### Primary Brand Colors
```css
:root {
  --rawgle-primary: #E85D04;     /* Vibrant orange - energy, appetite */
  --rawgle-secondary: #370617;   /* Deep burgundy - premium, trust */
  --rawgle-accent: #FAA307;      /* Golden yellow - optimism, health */
  --rawgle-success: #52B788;     /* Fresh green - natural, healthy */
  --rawgle-warning: #F77F00;     /* Warm orange - attention */
  --rawgle-danger: #D62828;      /* Alert red - avoid/warning */
  --rawgle-neutral: #6C757D;     /* Gray - secondary info */
}
```

## 📱 Page-by-Page CTAs & User Flows

### 1. Homepage (Guest)
```typescript
const homepageGuest = {
  hero: {
    headline: "Feed Raw. Feed Right.",
    subhead: "Personalized raw food matching for your dog",
    primaryCTA: "Build Your Dog's Profile", // → /onboarding
    secondaryCTA: "Watch How It Works"     // → Video modal
  },
  
  sections: [
    {
      title: "Trusted by 50,000+ Dogs",
      ctas: ["Read Success Stories", "View Reviews"]
    },
    {
      title: "Learn Raw Feeding",
      ctas: ["Start Learning", "Download Guide"]
    },
    {
      title: "Find Local Suppliers",
      ctas: ["Browse Suppliers", "Check Delivery Areas"]
    }
  ],
  
  floatingCTA: "Get Started Free" // Sticky bottom button
};
```

### 2. Homepage (Logged In)
```typescript
const homepageUser = {
  dashboard: {
    greeting: "Welcome back, {userName}!",
    petCards: [
      {
        petName: "Rex",
        ctas: [
          "Update Profile",
          "View Recommendations",
          "Log Feeding"
        ]
      }
    ],
    primaryCTA: "Add Another Dog"
  },
  
  quickActions: [
    "Order Again",        // → Previous order
    "Write a Review",     // → Review modal
    "Join Discussion",    // → Community
    "Track Progress"      // → Analytics
  ],
  
  recommendations: {
    title: "New Matches for Rex",
    ctas: ["View All", "Update Preferences"]
  }
};
```

### 3. Onboarding Flow
```typescript
const onboardingFlow = {
  steps: [
    {
      title: "Let's Get Started",
      fields: ["email", "password"],
      cta: "Create Account",
      skip: "Browse as Guest"
    },
    {
      title: "Tell Us About Your Dog",
      progress: 33,
      fields: ["name", "breed", "age", "weight"],
      cta: "Continue",
      back: "Previous"
    },
    {
      title: "Health & Preferences",
      progress: 66,
      fields: ["activity", "conditions", "restrictions"],
      cta: "Continue",
      back: "Previous"
    },
    {
      title: "Your Location",
      progress: 100,
      fields: ["address", "delivery_notes"],
      cta: "Get Recommendations",
      back: "Previous",
      alternative: "Use Current Location"
    }
  ],
  
  completion: {
    title: "Perfect Matches Found!",
    message: "We found 12 great options for {petName}",
    primaryCTA: "View Recommendations",
    secondaryCTA: "Complete Profile Later"
  }
};
```

### 4. Dog Profile Page
```typescript
const dogProfilePage = {
  header: {
    title: "{petName}'s Profile",
    badges: ["Verified", "Active Feeder"],
    ctas: ["Edit Profile", "Share", "Print QR Tag"]
  },
  
  sections: {
    overview: {
      ctas: ["Update Photo", "Edit Details"]
    },
    health: {
      ctas: ["Add Condition", "Update Weight", "Log Medication"]
    },
    feeding: {
      ctas: ["Log Today's Meal", "View History", "Set Reminder"]
    },
    recommendations: {
      title: "Food Matches",
      ctas: ["Refresh Matches", "Set Alerts", "Compare All"]
    }
  },
  
  floatingCTA: "Find Best Food" // Always visible
};
```

### 5. Recommendation Results
```typescript
const recommendationResults = {
  header: {
    title: "Matches for {petName}",
    filters: ["Price", "Distance", "Rating", "Ingredients"],
    ctas: ["Save Search", "Email Results"]
  },
  
  categories: {
    recommended: {
      badge: "Best Matches",
      itemCTAs: [
        "Order Now",          // Primary
        "View Details",       // Secondary
        "Save for Later",     // Tertiary
        "Compare"            // Icon only
      ]
    },
    alternatives: {
      badge: "Also Consider",
      itemCTAs: ["Learn More", "Add to Compare"]
    },
    avoid: {
      badge: "Not Suitable",
      itemCTAs: ["Why Not?", "Find Alternatives"]
    }
  },
  
  emptyState: {
    message: "No matches in your area",
    ctas: ["Expand Search Area", "Request Supplier"]
  }
};
```

### 6. Product/Supplier Review Page
```typescript
const reviewPage = {
  header: {
    rating: 4.8,
    reviewCount: 234,
    ctas: ["Write Review", "Ask Question"]
  },
  
  filters: [
    "Most Helpful",
    "Newest",
    "Verified Purchases",
    "With Photos"
  ],
  
  reviewCard: {
    ctas: [
      "Helpful",           // 👍
      "Not Helpful",       // 👎
      "Reply",            // For suppliers
      "Report"            // Flag icon
    ]
  },
  
  writeReview: {
    title: "Share Your Experience",
    sections: [
      "Overall Rating",
      "What We Loved",
      "What Could Improve",
      "Photos/Videos"
    ],
    primaryCTA: "Submit Review",
    incentive: "Earn 50 points!"
  }
};
```

### 7. Community Hub
```typescript
const communityHub = {
  header: {
    greeting: "Welcome to the Pack!",
    stats: ["2.5k Online", "45k Members"],
    ctas: ["New Post", "My Groups", "Notifications"]
  },
  
  channels: {
    suggested: {
      title: "Recommended for You",
      items: [
        {
          name: "Labrador Owners",
          cta: "Join Group"
        },
        {
          name: "London Raw Feeders",
          cta: "Join Group"
        }
      ]
    },
    
    active: {
      title: "Your Communities",
      itemCTAs: ["View", "Mute", "Leave"]
    }
  },
  
  posts: {
    createCTA: "Share Your Story",
    interactionCTAs: [
      "Like",              // ❤️
      "Comment",           // 💬
      "Share",             // 🔄
      "Save"               // 🔖
    ]
  }
};
```

### 8. Educational Content
```typescript
const educationHub = {
  header: {
    title: "Learn Raw Feeding",
    progress: "3 of 10 completed",
    ctas: ["Continue Learning", "Browse Topics"]
  },
  
  topics: {
    card: {
      badges: ["New", "Popular", "Essential"],
      ctas: ["Start Reading", "Watch Video", "Save"]
    },
    
    completed: {
      badge: "✓ Completed",
      ctas: ["Review", "Take Quiz", "Get Certificate"]
    }
  },
  
  article: {
    header: {
      readTime: "8 min read",
      ctas: ["Save", "Share", "Print"]
    },
    
    content: {
      videoPlayer: {
        ctas: ["Play", "Download", "Transcript"]
      },
      
      calloutBoxes: [
        {
          type: "tip",
          cta: "Learn More"
        },
        {
          type: "warning",
          cta: "Read Safety Guide"
        }
      ]
    },
    
    footer: {
      primaryCTA: "Mark Complete",
      secondaryCTAs: [
        "Next Article →",
        "Ask Expert",
        "Join Discussion"
      ]
    }
  }
};
```

### 9. Shop/Marketplace
```typescript
const marketplace = {
  header: {
    banner: "New User Special: 20% Off Starter Kit",
    ctas: ["Shop Now", "Learn More"]
  },
  
  categories: {
    featured: {
      title: "Popular Right Now",
      itemCTAs: ["Quick Add", "View Details"]
    }
  },
  
  productCard: {
    badges: ["Bestseller", "Low Stock", "Sale"],
    ctas: [
      "Add to Cart",       // Primary
      "Quick View",        // Secondary
      "Add to List"        // Heart icon
    ]
  },
  
  cart: {
    upsell: "Add a scale for accurate portions?",
    ctas: [
      "Checkout",          // Primary
      "Save for Later",    // Secondary
      "Apply Code"         // Tertiary
    ]
  },
  
  checkout: {
    trust: "🔒 Secure Checkout",
    ctas: [
      "Place Order",
      "Save & Subscribe (Save 10%)",
      "Continue Shopping"
    ]
  }
};
```

### 10. Supplier Portal
```typescript
const supplierPortal = {
  dashboard: {
    greeting: "Welcome back, {businessName}",
    metrics: ["Orders Today", "Rating", "Response Time"],
    ctas: [
      "Update Inventory",   // Primary
      "View Orders",        // Secondary
      "Message Center",     // Badge: 3
      "Promote Products"    // Upgrade prompt
    ]
  },
  
  listings: {
    status: ["Active", "Low Stock", "Out of Stock"],
    bulkActions: [
      "Update Prices",
      "Mark In Stock",
      "Export List"
    ],
    itemCTAs: [
      "Edit",
      "Duplicate",
      "Promote",
      "Archive"
    ]
  },
  
  analytics: {
    timeframes: ["Today", "Week", "Month", "Year"],
    ctas: [
      "Download Report",
      "Schedule Email",
      "Compare Periods"
    ]
  }
};
```

## 🎮 Gamification CTAs

### Badge Unlocks
```typescript
const badgeNotification = {
  animation: "slideIn + confetti",
  content: {
    icon: "🏆",
    title: "Badge Earned!",
    message: "First Review Hero",
    points: "+50 points"
  },
  ctas: [
    "View All Badges",    // Primary
    "Share",              // Secondary
    "Continue"            // Dismiss
  ]
};
```

### Level Up
```typescript
const levelUpModal = {
  animation: "scaleIn + glow",
  content: {
    title: "Level Up! 🎉",
    newLevel: 5,
    reward: "Unlocked: Expert Badge + 10% Discount",
    progress: "230 points to Level 6"
  },
  ctas: [
    "Claim Reward",       // Primary
    "View Benefits",      // Secondary
    "Share Achievement"   // Social
  ]
};
```

## 📱 Mobile-Specific CTAs

### Bottom Navigation
```typescript
const mobileNav = {
  items: [
    { icon: "🏠", label: "Home", badge: null },
    { icon: "🐕", label: "Pets", badge: null },
    { icon: "🔍", label: "Discover", badge: "New" },
    { icon: "💬", label: "Community", badge: "3" },
    { icon: "👤", label: "Profile", badge: null }
  ],
  
  floatingAction: {
    icon: "+",
    options: [
      "Log Feeding",
      "Add Review",
      "Ask Question"
    ]
  }
};
```

### Pull Actions
```typescript
const pullToRefresh = {
  states: [
    { threshold: 0, text: "Pull to refresh" },
    { threshold: 50, text: "Release to refresh" },
    { threshold: 100, text: "Fetching new matches..." }
  ]
};
```

## ⚡ Micro-Interactions

### Button States
```typescript
const buttonStates = {
  default: {
    bg: "primary",
    text: "white",
    shadow: "sm"
  },
  hover: {
    bg: "primary-dark",
    shadow: "md",
    scale: 1.02
  },
  active: {
    bg: "primary-darker",
    shadow: "none",
    scale: 0.98
  },
  loading: {
    spinner: true,
    text: "Processing...",
    disabled: true
  },
  success: {
    bg: "success",
    text: "✓ Done!",
    duration: 2000
  }
};
```

### Form Feedback
```typescript
const formFeedback = {
  validation: {
    valid: {
      border: "success",
      icon: "✓",
      message: "Looks good!"
    },
    invalid: {
      border: "danger",
      icon: "!",
      message: "Please check this field"
    }
  },
  
  submission: {
    processing: "Saving your information...",
    success: "Saved successfully!",
    error: "Something went wrong. Try again?"
  }
};
```

## 🔔 Notification CTAs

### In-App Notifications
```typescript
const notifications = {
  types: {
    recommendation: {
      icon: "🎯",
      title: "New match for Rex!",
      ctas: ["View Now", "Dismiss"]
    },
    
    social: {
      icon: "💬",
      title: "{user} replied to your post",
      ctas: ["Reply", "View Thread"]
    },
    
    order: {
      icon: "📦",
      title: "Order shipped!",
      ctas: ["Track Order", "OK"]
    },
    
    achievement: {
      icon: "🏆",
      title: "You've earned a badge!",
      ctas: ["Claim", "Later"]
    }
  }
};
```

## 🎯 Conversion Optimization

### Exit Intent
```typescript
const exitIntent = {
  trigger: "mouseLeave + 5s delay",
  modal: {
    title: "Wait! Don't leave empty-pawed 🐾",
    offer: "Get 15% off your first order",
    ctas: [
      "Claim Discount",    // Primary
      "No Thanks"          // Secondary
    ]
  }
};
```

### Abandoned Cart
```typescript
const abandonedCart = {
  email: {
    subject: "You left something behind...",
    preview: "Complete your order and save 10%",
    ctas: [
      "Complete Order",    // Primary button
      "View Cart",         // Secondary button
      "Need Help?"         // Text link
    ]
  }
};
```

## 🌐 Localization

### Regional CTAs
```typescript
const regionalCTAs = {
  US: {
    currency: "$",
    shipping: "Free shipping over $50",
    cta: "Shop Now"
  },
  UK: {
    currency: "£",
    shipping: "Free delivery over £40",
    cta: "Shop Now"
  },
  EU: {
    currency: "€",
    shipping: "Free shipping over €45",
    cta: "Shop Now"
  }
};
```

---

**Remember**: Every CTA should create value for the user while driving them toward their goals (better nutrition for their dog) and our goals (engagement, retention, revenue).

*"Make every click count toward healthier, happier dogs."* 🐕✨