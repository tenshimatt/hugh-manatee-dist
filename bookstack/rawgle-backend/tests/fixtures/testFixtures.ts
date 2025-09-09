import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
  passwordHash: string;
  emailVerified: boolean;
  accountType: 'user' | 'business' | 'admin';
  pawsTokens: number;
}

export interface TestPet {
  id: string;
  userId: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  activityLevel: 'low' | 'moderate' | 'high';
}

export interface TestStore {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  storeType: string;
  hasDelivery: boolean;
}

export interface TestBlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  categoryId: string;
  featured: boolean;
  published: boolean;
}

export class TestFixtures {
  constructor(private pool: Pool) {}

  // Test Users
  static readonly TEST_USERS: TestUser[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      passwordHash: bcrypt.hashSync('password123', 10),
      emailVerified: true,
      accountType: 'user',
      pawsTokens: 100
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Jane Admin',
      email: 'admin@example.com',
      password: 'admin123',
      passwordHash: bcrypt.hashSync('admin123', 10),
      emailVerified: true,
      accountType: 'admin',
      pawsTokens: 500
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Pet Business',
      email: 'business@example.com',
      password: 'business123',
      passwordHash: bcrypt.hashSync('business123', 10),
      emailVerified: true,
      accountType: 'business',
      pawsTokens: 200
    }
  ];

  // Test Pets
  static readonly TEST_PETS: TestPet[] = [
    {
      id: '44444444-4444-4444-4444-444444444444',
      userId: '11111111-1111-1111-1111-111111111111',
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      age: 3,
      weight: 30.5,
      activityLevel: 'high'
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      userId: '11111111-1111-1111-1111-111111111111',
      name: 'Whiskers',
      species: 'cat',
      breed: 'Persian',
      age: 2,
      weight: 4.2,
      activityLevel: 'low'
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      userId: '22222222-2222-2222-2222-222222222222',
      name: 'Rex',
      species: 'dog',
      breed: 'German Shepherd',
      age: 5,
      weight: 35.0,
      activityLevel: 'moderate'
    }
  ];

  // Test Stores (mimicking real migrated data)
  static readonly TEST_STORES: TestStore[] = [
    {
      id: '77777777-7777-7777-7777-777777777777',
      name: 'Petco - Manhattan',
      address: '860 Broadway',
      city: 'New York',
      state: 'NY',
      zipCode: '10003',
      latitude: 40.7359,
      longitude: -73.9911,
      storeType: 'chain_store',
      hasDelivery: true
    },
    {
      id: '88888888-8888-8888-8888-888888888888',
      name: 'Raw Feeding Miami',
      address: '1234 Biscayne Blvd',
      city: 'Miami',
      state: 'FL',
      zipCode: '33132',
      latitude: 25.7617,
      longitude: -80.1918,
      storeType: 'specialty_store',
      hasDelivery: false
    },
    {
      id: '99999999-9999-9999-9999-999999999999',
      name: 'Premium Pet Foods LA',
      address: '9876 Sunset Strip',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90069',
      latitude: 34.0900,
      longitude: -118.3617,
      storeType: 'premium_store',
      hasDelivery: true
    }
  ];

  // Test Blog Posts
  static readonly TEST_BLOG_POSTS: TestBlogPost[] = [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Complete Guide to Raw Feeding',
      slug: 'complete-guide-raw-feeding',
      content: 'Raw feeding is a natural approach to pet nutrition...',
      author: 'Dr. Sarah Johnson',
      categoryId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      featured: true,
      published: true
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      title: 'Understanding Pet Allergies',
      slug: 'understanding-pet-allergies',
      content: 'Pet allergies can significantly impact your furry friend\'s quality of life...',
      author: 'Dr. Mike Wilson',
      categoryId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      featured: false,
      published: true
    }
  ];

  async createTestUsers(): Promise<TestUser[]> {
    for (const user of TestFixtures.TEST_USERS) {
      await this.pool.query(`
        INSERT INTO users (id, name, email, password_hash, email_verified, account_type, paws_tokens)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          email_verified = EXCLUDED.email_verified,
          account_type = EXCLUDED.account_type,
          paws_tokens = EXCLUDED.paws_tokens
      `, [user.id, user.name, user.email, user.passwordHash, user.emailVerified, user.accountType, user.pawsTokens]);
    }
    return TestFixtures.TEST_USERS;
  }

  async createTestPets(): Promise<TestPet[]> {
    for (const pet of TestFixtures.TEST_PETS) {
      await this.pool.query(`
        INSERT INTO pets (id, user_id, name, species, breed, age, weight, activity_level)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          species = EXCLUDED.species,
          breed = EXCLUDED.breed,
          age = EXCLUDED.age,
          weight = EXCLUDED.weight,
          activity_level = EXCLUDED.activity_level
      `, [pet.id, pet.userId, pet.name, pet.species, pet.breed, pet.age, pet.weight, pet.activityLevel]);
    }
    return TestFixtures.TEST_PETS;
  }

  async createTestStores(): Promise<TestStore[]> {
    for (const store of TestFixtures.TEST_STORES) {
      await this.pool.query(`
        INSERT INTO stores (id, name, address, city, state, zip_code, latitude, longitude, store_type, has_delivery)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          zip_code = EXCLUDED.zip_code,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          store_type = EXCLUDED.store_type,
          has_delivery = EXCLUDED.has_delivery
      `, [store.id, store.name, store.address, store.city, store.state, store.zipCode, store.latitude, store.longitude, store.storeType, store.hasDelivery]);
    }
    return TestFixtures.TEST_STORES;
  }

  async createBlogCategories(): Promise<void> {
    await this.pool.query(`
      INSERT INTO blog_categories (id, name, slug, description)
      VALUES 
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Nutrition', 'nutrition', 'Pet nutrition and feeding guides'),
        ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Health', 'health', 'Pet health and wellness information')
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description
    `);
  }

  async createTestBlogPosts(): Promise<TestBlogPost[]> {
    await this.createBlogCategories();
    
    for (const post of TestFixtures.TEST_BLOG_POSTS) {
      await this.pool.query(`
        INSERT INTO blog_posts (id, title, slug, content, author, category_id, featured, published)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          content = EXCLUDED.content,
          author = EXCLUDED.author,
          category_id = EXCLUDED.category_id,
          featured = EXCLUDED.featured,
          published = EXCLUDED.published
      `, [post.id, post.title, post.slug, post.content, post.author, post.categoryId, post.featured, post.published]);
    }
    return TestFixtures.TEST_BLOG_POSTS;
  }

  async createFeedingSchedules(): Promise<void> {
    await this.pool.query(`
      INSERT INTO feeding_schedules (id, pet_id, name, meal_times, portion_size, food_type)
      VALUES 
        ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444', 'Morning & Evening', '{08:00:00,18:00:00}', 1.5, 'Raw Mix'),
        ('ffffffff-ffff-ffff-ffff-ffffffffffff', '55555555-5555-5555-5555-555555555555', 'Three Meals', '{07:00:00,12:00:00,19:00:00}', 0.3, 'Cat Raw Food')
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        meal_times = EXCLUDED.meal_times,
        portion_size = EXCLUDED.portion_size,
        food_type = EXCLUDED.food_type
    `);
  }

  async createFeedingEntries(): Promise<void> {
    await this.pool.query(`
      INSERT INTO feeding_entries (id, pet_id, schedule_id, fed_at, portion_given, food_type, notes)
      VALUES 
        (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW() - INTERVAL '1 day', 1.5, 'Raw Mix', 'Ate well'),
        (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW() - INTERVAL '12 hours', 1.5, 'Raw Mix', 'Normal feeding'),
        (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', NOW() - INTERVAL '6 hours', 0.3, 'Cat Raw Food', 'Left some food')
    `);
  }

  async seedAllTestData(): Promise<void> {
    await this.createTestUsers();
    await this.createTestPets();
    await this.createTestStores();
    await this.createTestBlogPosts();
    await this.createFeedingSchedules();
    await this.createFeedingEntries();
  }

  // Helper methods for test assertions
  static getTestUserByEmail(email: string): TestUser | undefined {
    return TestFixtures.TEST_USERS.find(user => user.email === email);
  }

  static getTestPetById(id: string): TestPet | undefined {
    return TestFixtures.TEST_PETS.find(pet => pet.id === id);
  }

  static getTestStoreById(id: string): TestStore | undefined {
    return TestFixtures.TEST_STORES.find(store => store.id === id);
  }
}