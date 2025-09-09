/**
 * Educational Platform Test Data Factory
 * Enterprise-grade test data generation for comprehensive testing
 * Following TDD_DOCUMENTATION.md specifications
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class EducationalPlatformTestData {
  static generateUsers(count = 1000) {
    const personas = [
      { type: 'newbie', experience: 0, engagement: 'high' },
      { type: 'intermediate', experience: 6, engagement: 'medium' },
      { type: 'expert', experience: 24, engagement: 'low' },
      { type: 'skeptic', experience: 0, engagement: 'questioning' },
      { type: 'multi-pet', pets: 3, engagement: 'high' }
    ];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `test-user-${i}`,
      email: `user${i}@rawgletest.com`,
      name: `Test User ${i}`,
      password: 'TestPass123!',
      passwordHash: bcrypt.hashSync('TestPass123!', 10),
      persona: personas[i % personas.length],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      coursesCompleted: Math.floor(Math.random() * 5),
      videoWatchTime: Math.floor(Math.random() * 10000),
      accountType: 'user',
      emailVerified: Math.random() > 0.2, // 80% verified
      pawsTokens: Math.floor(Math.random() * 500),
      subscriptionStatus: ['free', 'premium', 'enterprise'][Math.floor(Math.random() * 3)]
    }));
  }

  static generateCourses() {
    return [
      {
        id: 'raw-feeding-101',
        title: 'Raw Feeding Fundamentals',
        slug: 'raw-feeding-fundamentals',
        description: 'Complete beginner guide to raw feeding for dogs and cats',
        modules: 8,
        difficulty: 'beginner',
        estimatedHours: 12,
        price: 99.99,
        category: 'nutrition',
        instructor: 'Dr. Sarah Johnson',
        rating: 4.8,
        enrollmentCount: 1250,
        isActive: true,
        tags: ['nutrition', 'beginner', 'raw-feeding'],
        prerequisites: [],
        createdAt: new Date('2024-01-15')
      },
      {
        id: 'advanced-nutrition',
        title: 'Advanced Canine Nutrition',
        slug: 'advanced-canine-nutrition',
        description: 'Deep dive into nutritional requirements for different life stages',
        modules: 12,
        difficulty: 'advanced',
        estimatedHours: 20,
        price: 149.99,
        category: 'nutrition',
        instructor: 'Dr. Mike Wilson',
        rating: 4.9,
        enrollmentCount: 750,
        isActive: true,
        tags: ['nutrition', 'advanced', 'canine'],
        prerequisites: ['raw-feeding-101'],
        createdAt: new Date('2024-02-01')
      },
      {
        id: 'feline-feeding-mastery',
        title: 'Feline Feeding Mastery',
        slug: 'feline-feeding-mastery',
        description: 'Species-specific nutrition for cats of all ages',
        modules: 10,
        difficulty: 'intermediate',
        estimatedHours: 15,
        price: 119.99,
        category: 'nutrition',
        instructor: 'Dr. Lisa Chen',
        rating: 4.7,
        enrollmentCount: 650,
        isActive: true,
        tags: ['nutrition', 'intermediate', 'feline'],
        prerequisites: ['raw-feeding-101'],
        createdAt: new Date('2024-03-01')
      }
    ];
  }

  static generateVideoContent() {
    const courses = this.generateCourses();
    const videos = [];
    
    courses.forEach(course => {
      for (let moduleNum = 1; moduleNum <= course.modules; moduleNum++) {
        const lessonsPerModule = Math.floor(Math.random() * 5) + 3; // 3-7 lessons per module
        
        for (let lessonNum = 1; lessonNum <= lessonsPerModule; lessonNum++) {
          videos.push({
            id: uuidv4(),
            courseId: course.id,
            moduleNumber: moduleNum,
            lessonNumber: lessonNum,
            title: `${course.title} - Module ${moduleNum}, Lesson ${lessonNum}`,
            slug: `${course.slug}-m${moduleNum}-l${lessonNum}`,
            duration: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
            videoUrl: `https://cdn.rawgle.com/videos/${course.slug}/${moduleNum}/${lessonNum}.mp4`,
            thumbnailUrl: `https://cdn.rawgle.com/thumbnails/${course.slug}/${moduleNum}/${lessonNum}.jpg`,
            transcript: `This is the transcript for ${course.title} module ${moduleNum} lesson ${lessonNum}`,
            viewCount: Math.floor(Math.random() * 5000),
            averageWatchTime: Math.floor(Math.random() * 1500) + 300,
            isPublished: true,
            createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
          });
        }
      }
    });
    
    return videos;
  }

  static generateBreeds() {
    const breeds = [
      'Labrador Retriever', 'German Shepherd', 'Golden Retriever',
      'French Bulldog', 'Bulldog', 'Poodle', 'Beagle', 'Rottweiler',
      'Yorkshire Terrier', 'Dachshund', 'Siberian Husky', 'Great Dane',
      'Chihuahua', 'Border Collie', 'Australian Shepherd', 'Shih Tzu'
    ];
    
    return breeds.map(breed => ({
      breed,
      species: breed.includes('Cat') || breed.includes('Persian') || breed.includes('Siamese') ? 'cat' : 'dog',
      weightRange: this.getBreedWeightRange(breed),
      activityLevel: this.getBreedActivityLevel(breed),
      commonIssues: this.getBreedHealthIssues(breed),
      nutritionNotes: `Specific nutrition recommendations for ${breed}`,
      lifeExpectancy: this.getBreedLifeExpectancy(breed)
    }));
  }

  static getBreedWeightRange(breed) {
    const weightRanges = {
      'Chihuahua': { min: 1.5, max: 3 },
      'Yorkshire Terrier': { min: 2, max: 4 },
      'Dachshund': { min: 5, max: 15 },
      'French Bulldog': { min: 9, max: 14 },
      'Beagle': { min: 10, max: 15 },
      'Bulldog': { min: 18, max: 25 },
      'Border Collie': { min: 14, max: 20 },
      'Australian Shepherd': { min: 16, max: 32 },
      'Labrador Retriever': { min: 25, max: 36 },
      'Golden Retriever': { min: 25, max: 34 },
      'German Shepherd': { min: 22, max: 40 },
      'Rottweiler': { min: 35, max: 60 },
      'Great Dane': { min: 45, max: 90 }
    };
    
    return weightRanges[breed] || { min: 10, max: 30 };
  }

  static getBreedActivityLevel(breed) {
    const highEnergyBreeds = ['Border Collie', 'Australian Shepherd', 'Siberian Husky', 'German Shepherd'];
    const lowEnergyBreeds = ['Bulldog', 'French Bulldog', 'Great Dane', 'Shih Tzu'];
    
    if (highEnergyBreeds.includes(breed)) return 'high';
    if (lowEnergyBreeds.includes(breed)) return 'low';
    return 'moderate';
  }

  static getBreedHealthIssues(breed) {
    const healthIssues = {
      'German Shepherd': ['Hip dysplasia', 'Elbow dysplasia', 'Bloat'],
      'Labrador Retriever': ['Hip dysplasia', 'Elbow dysplasia', 'Eye conditions'],
      'Golden Retriever': ['Hip dysplasia', 'Heart conditions', 'Cancer predisposition'],
      'Bulldog': ['Breathing issues', 'Hip dysplasia', 'Skin allergies'],
      'Great Dane': ['Bloat', 'Heart conditions', 'Bone cancer']
    };
    
    return healthIssues[breed] || ['General breed-specific considerations'];
  }

  static getBreedLifeExpectancy(breed) {
    const lifeExpectancies = {
      'Chihuahua': { min: 14, max: 16 },
      'Great Dane': { min: 8, max: 10 },
      'German Shepherd': { min: 9, max: 13 },
      'Labrador Retriever': { min: 10, max: 12 },
      'Golden Retriever': { min: 10, max: 12 }
    };
    
    return lifeExpectancies[breed] || { min: 10, max: 15 };
  }

  static generateWebinarData() {
    return [
      {
        id: uuidv4(),
        title: 'Introduction to Raw Feeding: Live Q&A',
        slug: 'intro-raw-feeding-qa',
        description: 'Join Dr. Sarah Johnson for a comprehensive introduction to raw feeding with live Q&A session',
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        duration: 90, // minutes
        maxAttendees: 500,
        registrationCount: 342,
        instructor: 'Dr. Sarah Johnson',
        category: 'nutrition',
        price: 0, // Free webinar
        status: 'scheduled',
        registrationDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        zoomMeetingId: 'test-zoom-123456789',
        recordingUrl: null,
        materials: [
          { name: 'Feeding Guidelines PDF', url: 'https://cdn.rawgle.com/materials/feeding-guidelines.pdf' },
          { name: 'Transition Checklist', url: 'https://cdn.rawgle.com/materials/transition-checklist.pdf' }
        ]
      },
      {
        id: uuidv4(),
        title: 'Advanced Nutrition Calculations',
        slug: 'advanced-nutrition-calculations',
        description: 'Deep dive into calculating precise nutritional requirements for different dog breeds and life stages',
        scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Two weeks
        duration: 120,
        maxAttendees: 200,
        registrationCount: 156,
        instructor: 'Dr. Mike Wilson',
        category: 'nutrition',
        price: 29.99,
        status: 'scheduled',
        registrationDeadline: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
        zoomMeetingId: 'test-zoom-987654321',
        recordingUrl: null,
        prerequisites: ['raw-feeding-101'],
        materials: []
      }
    ];
  }

  static generateGlossaryTerms() {
    return [
      {
        id: uuidv4(),
        term: 'BARF',
        definition: 'Biologically Appropriate Raw Food - a philosophy of feeding dogs and cats a diet primarily composed of raw meat, bones, organs, and vegetables.',
        category: 'feeding-methods',
        audioUrl: 'https://cdn.rawgle.com/audio/glossary/barf.mp3',
        relatedTerms: ['Raw feeding', 'Prey model', 'Species-appropriate diet'],
        difficulty: 'beginner',
        usage: 'Many pet owners choose the BARF diet for its naturalistic approach to pet nutrition.'
      },
      {
        id: uuidv4(),
        term: 'Prey Model Raw',
        definition: 'A raw feeding approach that mimics what animals would eat in the wild, consisting of whole prey animals or their parts in specific ratios.',
        category: 'feeding-methods',
        audioUrl: 'https://cdn.rawgle.com/audio/glossary/prey-model-raw.mp3',
        relatedTerms: ['BARF', 'Whole prey', '80/10/10'],
        difficulty: 'intermediate',
        usage: 'Prey Model Raw feeding follows the 80/10/10 ratio of muscle meat, organ meat, and raw meaty bones.'
      },
      {
        id: uuidv4(),
        term: 'Nutritional Ketosis',
        definition: 'A metabolic state where the body uses ketones as a primary fuel source, sometimes achieved through specific raw feeding protocols.',
        category: 'metabolism',
        audioUrl: 'https://cdn.rawgle.com/audio/glossary/nutritional-ketosis.mp3',
        relatedTerms: ['Metabolism', 'Ketones', 'Low-carb feeding'],
        difficulty: 'advanced',
        usage: 'Some advanced raw feeders aim for mild nutritional ketosis in their pets for therapeutic benefits.'
      },
      {
        id: uuidv4(),
        term: 'Transitioning',
        definition: 'The gradual process of switching a pet from their current diet to a new feeding regimen, typically done over 7-14 days.',
        category: 'feeding-process',
        audioUrl: 'https://cdn.rawgle.com/audio/glossary/transitioning.mp3',
        relatedTerms: ['Diet change', 'Gradual switch', 'Digestive adaptation'],
        difficulty: 'beginner',
        usage: 'Proper transitioning helps prevent digestive upset when switching to raw feeding.'
      }
    ];
  }

  static generateMythBusterContent() {
    return [
      {
        id: uuidv4(),
        mythTitle: 'Raw meat makes dogs aggressive',
        mythDescription: 'Many people believe that feeding raw meat to dogs will make them more aggressive or trigger predatory instincts.',
        truthExplanation: 'There is no scientific evidence linking raw meat consumption to increased aggression in domestic dogs. Aggression is primarily influenced by genetics, socialization, training, and environmental factors.',
        category: 'behavior',
        difficulty: 'beginner',
        scientificStudies: [
          {
            title: 'Diet and Canine Behavior: A Comprehensive Review',
            authors: 'Johnson, S. et al.',
            journal: 'Journal of Veterinary Behavior',
            year: 2023,
            summary: 'Large-scale study found no correlation between raw meat consumption and aggressive behavior in domestic dogs.'
          }
        ],
        expertQuotes: [
          {
            expert: 'Dr. Sarah Johnson, Veterinary Behaviorist',
            quote: 'In my 15 years of practice, I have never observed increased aggression in dogs fed raw diets compared to those on commercial kibble.'
          }
        ],
        relatedMyths: ['Raw food causes dominance issues', 'Dogs become wild on raw diets'],
        debunkingEvidence: [
          'Thousands of dogs on raw diets show normal, non-aggressive behavior',
          'Aggression is not linked to diet composition in scientific literature',
          'Domestication has fundamentally changed dog behavior regardless of diet'
        ]
      },
      {
        id: uuidv4(),
        mythTitle: 'Raw diets are nutritionally incomplete',
        mythDescription: 'Critics claim that raw diets cannot provide complete and balanced nutrition compared to commercial pet foods.',
        truthExplanation: 'Well-planned raw diets can be nutritionally complete. The key is understanding nutritional requirements and ensuring proper balance of proteins, fats, vitamins, and minerals.',
        category: 'nutrition',
        difficulty: 'intermediate',
        scientificStudies: [
          {
            title: 'Nutritional Analysis of Home-Prepared Raw Diets',
            authors: 'Chen, L. et al.',
            journal: 'Pet Nutrition Science',
            year: 2024,
            summary: 'Study of 200 home-prepared raw diets found that 85% met or exceeded AAFCO nutritional requirements when properly formulated.'
          }
        ],
        expertQuotes: [
          {
            expert: 'Dr. Mike Wilson, Pet Nutritionist',
            quote: 'The challenge is not whether raw diets can be complete, but ensuring pet owners have the knowledge to formulate them correctly.'
          }
        ],
        relatedMyths: ['Raw diets lack essential vitamins', 'Only commercial foods are balanced'],
        debunkingEvidence: [
          'Proper raw diet formulation meets AAFCO standards',
          'Wild carnivores thrive on raw prey diets',
          'Many commercial foods have had recalls for nutritional deficiencies'
        ]
      }
    ];
  }

  static generateStudyDatabaseEntries() {
    return [
      {
        id: uuidv4(),
        title: 'Long-term Health Outcomes in Dogs Fed Raw vs. Commercial Diets',
        authors: ['Dr. Sarah Johnson', 'Dr. Mike Wilson', 'Dr. Lisa Chen'],
        journal: 'Journal of Veterinary Nutrition',
        publicationDate: new Date('2024-03-15'),
        doi: '10.1234/jvn.2024.001',
        abstract: 'A comprehensive 5-year longitudinal study comparing health outcomes between dogs fed raw diets versus commercial kibble. Study included 1,200 dogs across multiple breeds and age groups.',
        category: 'nutrition',
        studyType: 'longitudinal',
        sampleSize: 1200,
        duration: '5 years',
        keyFindings: [
          'Raw-fed dogs showed 23% fewer dental issues',
          'No significant difference in digestive problems between groups',
          'Raw-fed dogs had shinier coats according to owner surveys',
          'No difference in lifespan between diet groups'
        ],
        methodology: 'Double-blind randomized controlled trial with annual health assessments',
        limitations: ['Self-reported owner compliance', 'Geographic clustering in urban areas'],
        tags: ['raw feeding', 'health outcomes', 'longitudinal study', 'dental health'],
        fullTextUrl: 'https://research.rawgle.com/studies/longterm-health-outcomes-2024.pdf',
        citationCount: 45,
        qualityScore: 8.7, // Out of 10
        isOpenAccess: true
      },
      {
        id: uuidv4(),
        title: 'Bacterial Load Analysis in Commercial vs. Home-Prepared Raw Pet Foods',
        authors: ['Dr. Jennifer Martinez', 'Dr. Robert Chang'],
        journal: 'Food Safety in Pet Nutrition',
        publicationDate: new Date('2024-01-10'),
        doi: '10.1234/fspn.2024.002',
        abstract: 'Microbiological analysis of pathogen levels in commercial raw pet foods compared to home-prepared raw diets, with focus on Salmonella, E. coli, and Listeria detection.',
        category: 'food-safety',
        studyType: 'cross-sectional',
        sampleSize: 500,
        duration: '18 months',
        keyFindings: [
          'Commercial raw foods had 15% lower pathogen detection rates',
          'Proper handling reduced pathogen risk by 80% in home-prepared diets',
          'No correlation between pathogen presence and pet illness reports',
          'Freezing protocols significantly reduced bacterial loads'
        ],
        methodology: 'Laboratory analysis of food samples with statistical modeling',
        limitations: ['Limited geographic sampling', 'Single time-point analysis'],
        tags: ['food safety', 'pathogens', 'commercial vs home-prepared', 'bacteria'],
        fullTextUrl: 'https://research.rawgle.com/studies/bacterial-load-analysis-2024.pdf',
        citationCount: 23,
        qualityScore: 7.9,
        isOpenAccess: false
      }
    ];
  }

  // Performance test data generators
  static generateHighVolumeUsers(count = 10000) {
    const baseUsers = this.generateUsers(count);
    return baseUsers.map((user, index) => ({
      ...user,
      concurrentSessionId: `session-${Math.floor(index / 100)}`, // 100 users per session
      loadTestGroup: index % 5, // 5 different load test groups
      simulatedBehavior: [
        'course_browser', 'video_watcher', 'webinar_attendee', 
        'myth_researcher', 'glossary_user'
      ][index % 5]
    }));
  }

  static generateLoadTestScenarios() {
    return [
      {
        name: 'course_enrollment_spike',
        description: 'Simulate simultaneous course enrollments during promotion',
        virtualUsers: 1000,
        rampUpTime: 60, // seconds
        testDuration: 300, // seconds
        targetEndpoints: ['/api/v1/courses/enroll', '/api/v1/courses/list'],
        expectedThroughput: 100, // requests per second
        maxResponseTime: 500 // milliseconds
      },
      {
        name: 'video_streaming_load',
        description: 'Test concurrent video streaming capacity',
        virtualUsers: 5000,
        rampUpTime: 120,
        testDuration: 600,
        targetEndpoints: ['/api/v1/videos/stream', '/api/v1/videos/progress'],
        expectedThroughput: 500,
        maxResponseTime: 200
      },
      {
        name: 'webinar_registration_burst',
        description: 'Sudden spike in webinar registrations',
        virtualUsers: 2000,
        rampUpTime: 30,
        testDuration: 180,
        targetEndpoints: ['/api/v1/webinars/register', '/api/v1/webinars/list'],
        expectedThroughput: 200,
        maxResponseTime: 300
      }
    ];
  }
}

module.exports = {
  EducationalPlatformTestData
};