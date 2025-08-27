# Rawgle Platform - Complete Build Pseudocode
**Version**: 1.0  
**Date**: 2025-08-21  
**Purpose**: Comprehensive implementation guide for platform rebuild

## 📋 Project Overview

This pseudocode outlines the complete rebuild of the Rawgle platform, incorporating Claude AI, PAWS token system, supplier directory, and community features on Cloudflare Workers infrastructure.

---

## 🗄️ Database Schema Implementation

```sql
-- Phase 1: Core Tables
CREATE_DATABASE_SCHEMA:
  
  -- Users table with PAWS integration
  CREATE users TABLE:
    id: UUID PRIMARY KEY
    email: STRING UNIQUE NOT NULL
    password_hash: STRING NOT NULL  // bcrypt hashed
    name: STRING NOT NULL
    phone: STRING OPTIONAL
    avatar_url: STRING OPTIONAL
    paws_balance: INTEGER DEFAULT 0
    location: GEOGRAPHY OPTIONAL
    email_verified: BOOLEAN DEFAULT false
    created_at: TIMESTAMP
    updated_at: TIMESTAMP
    status: ENUM['active', 'suspended', 'deleted']
  
  -- Pet profiles for personalized recommendations
  CREATE pets TABLE:
    id: UUID PRIMARY KEY
    user_id: UUID FOREIGN_KEY users(id)
    name: STRING NOT NULL
    breed: STRING NOT NULL
    age_years: INTEGER
    age_months: INTEGER
    weight_kg: DECIMAL
    activity_level: ENUM['low', 'moderate', 'high', 'very_high']
    health_conditions: JSON_ARRAY
    dietary_restrictions: JSON_ARRAY
    photos: JSON_ARRAY
    created_at: TIMESTAMP
    updated_at: TIMESTAMP
  
  -- Suppliers (import from legacy system)
  CREATE suppliers TABLE:
    id: UUID PRIMARY KEY
    place_id: STRING UNIQUE  // Google Places ID
    name: STRING NOT NULL
    address: STRING NOT NULL
    city: STRING NOT NULL
    state: STRING NOT NULL
    country: STRING NOT NULL
    latitude: DECIMAL NOT NULL
    longitude: DECIMAL NOT NULL
    phone: STRING OPTIONAL
    website: STRING OPTIONAL
    rating: DECIMAL DEFAULT 0
    rating_count: INTEGER DEFAULT 0
    hours: JSON_OBJECT
    services: JSON_ARRAY
    verified: BOOLEAN DEFAULT false
    created_at: TIMESTAMP
    updated_at: TIMESTAMP
    
  -- Reviews system
  CREATE reviews TABLE:
    id: UUID PRIMARY KEY
    user_id: UUID FOREIGN_KEY users(id)
    supplier_id: UUID FOREIGN_KEY suppliers(id)
    pet_id: UUID FOREIGN_KEY pets(id) OPTIONAL
    rating: INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5)
    title: STRING NOT NULL
    content: TEXT NOT NULL
    photos: JSON_ARRAY OPTIONAL
    verified_purchase: BOOLEAN DEFAULT false
    helpful_votes: INTEGER DEFAULT 0
    created_at: TIMESTAMP
    updated_at: TIMESTAMP
  
  -- PAWS token transactions
  CREATE paws_transactions TABLE:
    id: UUID PRIMARY KEY
    user_id: UUID FOREIGN_KEY users(id)
    type: ENUM['earned', 'spent', 'transferred_in', 'transferred_out']
    amount: INTEGER NOT NULL
    description: STRING NOT NULL
    reference_type: STRING OPTIONAL  // 'review', 'order', 'referral'
    reference_id: UUID OPTIONAL
    created_at: TIMESTAMP
  
  -- User sessions for JWT management
  CREATE user_sessions TABLE:
    id: UUID PRIMARY KEY
    user_id: UUID FOREIGN_KEY users(id)
    token_hash: STRING NOT NULL
    expires_at: TIMESTAMP NOT NULL
    created_at: TIMESTAMP
  
  -- Orders system
  CREATE orders TABLE:
    id: UUID PRIMARY KEY
    user_id: UUID FOREIGN_KEY users(id)
    supplier_id: UUID FOREIGN_KEY suppliers(id)
    status: ENUM['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
    items: JSON_ARRAY NOT NULL
    total_amount: DECIMAL NOT NULL
    paws_used: INTEGER DEFAULT 0
    delivery_address: JSON_OBJECT
    notes: TEXT OPTIONAL
    created_at: TIMESTAMP
    updated_at: TIMESTAMP

  -- Notifications
  CREATE notifications TABLE:
    id: UUID PRIMARY KEY
    user_id: UUID FOREIGN_KEY users(id)
    type: STRING NOT NULL
    title: STRING NOT NULL
    message: TEXT NOT NULL
    read: BOOLEAN DEFAULT false
    action_url: STRING OPTIONAL
    created_at: TIMESTAMP
```

---

## 🔐 Authentication System Implementation

```javascript
// /src/services/auth.js
CLASS AuthService:
  
  CONSTRUCTOR(db, jwt_secret):
    this.db = db
    this.jwt_secret = jwt_secret
    this.bcrypt_rounds = 12
  
  METHOD register(email, password, name, phone):
    // Validate input
    VALIDATE_EMAIL(email)
    VALIDATE_PASSWORD_STRENGTH(password)
    
    // Check if user exists
    existing_user = db.query("SELECT id FROM users WHERE email = ?", [email])
    IF existing_user:
      THROW_ERROR("User already exists")
    
    // Hash password
    password_hash = bcrypt.hash(password, this.bcrypt_rounds)
    
    // Create user with welcome PAWS bonus
    user_id = UUID.generate()
    db.execute("INSERT INTO users (id, email, password_hash, name, phone, paws_balance) VALUES (?, ?, ?, ?, ?, ?)", 
               [user_id, email, password_hash, name, phone, 100])
    
    // Record welcome bonus transaction
    db.execute("INSERT INTO paws_transactions (id, user_id, type, amount, description) VALUES (?, ?, 'earned', 100, 'Welcome bonus')",
               [UUID.generate(), user_id])
    
    // Generate JWT token
    token = JWT.sign({user_id: user_id, email: email}, this.jwt_secret, {expires_in: '7d'})
    
    // Store session
    db.execute("INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
               [UUID.generate(), user_id, hash(token), DATE.add_days(7)])
    
    RETURN {user: {id: user_id, email: email, name: name, paws_balance: 100}, token: token}
  
  METHOD login(email, password):
    // Find user
    user = db.query("SELECT * FROM users WHERE email = ? AND status = 'active'", [email])
    IF NOT user:
      THROW_ERROR("Invalid credentials")
    
    // Verify password
    password_valid = bcrypt.compare(password, user.password_hash)
    IF NOT password_valid:
      THROW_ERROR("Invalid credentials")
    
    // Generate new token
    token = JWT.sign({user_id: user.id, email: user.email}, this.jwt_secret, {expires_in: '7d'})
    
    // Store session
    db.execute("INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
               [UUID.generate(), user.id, hash(token), DATE.add_days(7)])
    
    RETURN {
      user: {
        id: user.id, 
        email: user.email, 
        name: user.name, 
        paws_balance: user.paws_balance
      }, 
      token: token
    }
  
  METHOD verify_token(token):
    TRY:
      payload = JWT.verify(token, this.jwt_secret)
      
      // Check if session exists and is valid
      session = db.query("SELECT * FROM user_sessions WHERE token_hash = ? AND expires_at > NOW()", [hash(token)])
      IF NOT session:
        THROW_ERROR("Session expired")
      
      user = db.query("SELECT * FROM users WHERE id = ? AND status = 'active'", [payload.user_id])
      RETURN user
    CATCH error:
      THROW_ERROR("Invalid token")
  
  METHOD logout(token):
    db.execute("DELETE FROM user_sessions WHERE token_hash = ?", [hash(token)])
```

---

## 🗺️ Supplier System Implementation

```javascript
// /src/services/suppliers.js
CLASS SupplierService:
  
  CONSTRUCTOR(db):
    this.db = db
  
  METHOD import_legacy_suppliers(legacy_data):
    // Import 9,137 suppliers from legacy rawgle.com system
    FOR EACH supplier IN legacy_data:
      supplier_id = UUID.generate()
      
      db.execute(`
        INSERT INTO suppliers 
        (id, place_id, name, address, city, state, country, latitude, longitude, phone, website, rating, rating_count, verified) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        supplier_id,
        supplier.place_id,
        supplier.name,
        supplier.address,
        supplier.city,
        supplier.state,
        supplier.country,
        supplier.latitude,
        supplier.longitude,
        supplier.phone,
        supplier.website,
        supplier.rating,
        supplier.rating_count,
        true  // Mark legacy suppliers as verified
      ])
    
    RETURN "Imported " + legacy_data.length + " suppliers"
  
  METHOD search_suppliers(query, latitude, longitude, radius_km, limit, offset):
    base_query = `
      SELECT *, 
             HAVERSINE_DISTANCE(latitude, longitude, ?, ?) as distance_km
      FROM suppliers 
      WHERE 1=1
    `
    
    params = [latitude, longitude]
    
    // Add text search
    IF query:
      base_query += " AND (name ILIKE ? OR address ILIKE ? OR city ILIKE ?)"
      search_term = "%" + query + "%"
      params.push(search_term, search_term, search_term)
    
    // Add location filter
    IF latitude AND longitude AND radius_km:
      base_query += " AND HAVERSINE_DISTANCE(latitude, longitude, ?, ?) <= ?"
      params.push(latitude, longitude, radius_km)
    
    // Add ordering and pagination
    base_query += " ORDER BY distance_km ASC, rating DESC LIMIT ? OFFSET ?"
    params.push(limit, offset)
    
    suppliers = db.query(base_query, params)
    
    // Enhance with reviews summary
    FOR EACH supplier IN suppliers:
      review_stats = db.query(`
        SELECT COUNT(*) as review_count, AVG(rating) as avg_rating
        FROM reviews WHERE supplier_id = ?
      `, [supplier.id])
      
      supplier.review_count = review_stats.review_count
      supplier.avg_rating = review_stats.avg_rating
    
    RETURN suppliers
  
  METHOD get_supplier_details(supplier_id):
    supplier = db.query("SELECT * FROM suppliers WHERE id = ?", [supplier_id])
    IF NOT supplier:
      THROW_ERROR("Supplier not found")
    
    // Get recent reviews
    reviews = db.query(`
      SELECT r.*, u.name as user_name, p.name as pet_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN pets p ON r.pet_id = p.id
      WHERE r.supplier_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [supplier_id])
    
    supplier.reviews = reviews
    
    RETURN supplier
  
  METHOD update_supplier_rating(supplier_id):
    // Recalculate rating based on reviews
    stats = db.query(`
      SELECT COUNT(*) as count, AVG(rating) as average
      FROM reviews WHERE supplier_id = ?
    `, [supplier_id])
    
    db.execute(`
      UPDATE suppliers 
      SET rating = ?, rating_count = ?, updated_at = NOW()
      WHERE id = ?
    `, [stats.average || 0, stats.count || 0, supplier_id])
```

---

## 🤖 Claude AI Integration Implementation

```javascript
// /src/services/claude-ai.js
IMPORT Anthropic from '@anthropic-ai/sdk'

CLASS ClaudeService:
  
  CONSTRUCTOR(api_key, environment):
    // Using Cloudflare AI Gateway for caching and rate limiting
    base_url = "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/anthropic"
    
    this.anthropic = new Anthropic({
      apiKey: api_key,
      baseURL: base_url
    })
    
    this.models = {
      quick: 'claude-3-haiku-20240307',      // Fast responses, simple queries
      standard: 'claude-3-sonnet-20240229',  // Balanced performance
      complex: 'claude-3-opus-20240229'      // Complex medical/nutritional advice
    }
  
  METHOD get_pet_nutrition_advice(pet_profile, user_query):
    system_prompt = `
      You are a canine nutrition expert specializing in raw feeding. 
      Provide personalized advice based on the pet's specific details.
      Always recommend consulting with a veterinarian for serious health concerns.
      Keep responses practical and actionable.
    `
    
    user_context = `
      Pet Details:
      - Name: ${pet_profile.name}
      - Breed: ${pet_profile.breed}
      - Age: ${pet_profile.age_years} years, ${pet_profile.age_months} months
      - Weight: ${pet_profile.weight_kg}kg
      - Activity Level: ${pet_profile.activity_level}
      - Health Conditions: ${pet_profile.health_conditions.join(', ')}
      - Dietary Restrictions: ${pet_profile.dietary_restrictions.join(', ')}
      
      User Question: ${user_query}
    `
    
    response = AWAIT this.anthropic.messages.create({
      model: this.models.complex,  // Use most capable model for nutrition advice
      max_tokens: 1024,
      temperature: 0.3,  // Lower temperature for more consistent advice
      system: system_prompt,
      messages: [{
        role: 'user',
        content: user_context
      }]
    })
    
    RETURN {
      advice: response.content[0].text,
      model_used: this.models.complex,
      tokens_used: response.usage.total_tokens,
      timestamp: NOW()
    }
  
  METHOD generate_supplier_recommendations(pet_profile, nearby_suppliers):
    system_prompt = `
      You are a raw feeding expert. Analyze the pet's profile and recommend 
      the most suitable suppliers from the provided list.
      Consider location, specialties, ratings, and pet-specific needs.
      Rank suppliers and explain your reasoning.
    `
    
    suppliers_context = nearby_suppliers.map(s => 
      `${s.name} (${s.city}, ${s.state}) - Rating: ${s.rating}, Distance: ${s.distance_km}km, Services: ${s.services.join(', ')}`
    ).join('\n')
    
    user_context = `
      Pet Profile:
      - Breed: ${pet_profile.breed}
      - Age: ${pet_profile.age_years} years
      - Weight: ${pet_profile.weight_kg}kg
      - Activity: ${pet_profile.activity_level}
      - Health: ${pet_profile.health_conditions.join(', ')}
      - Restrictions: ${pet_profile.dietary_restrictions.join(', ')}
      
      Available Suppliers:
      ${suppliers_context}
      
      Please recommend the top 3 suppliers and explain why they're suitable for this pet.
    `
    
    response = AWAIT this.anthropic.messages.create({
      model: this.models.standard,
      max_tokens: 800,
      temperature: 0.4,
      system: system_prompt,
      messages: [{
        role: 'user',
        content: user_context
      }]
    })
    
    RETURN {
      recommendations: response.content[0].text,
      model_used: this.models.standard,
      suppliers_analyzed: nearby_suppliers.length,
      timestamp: NOW()
    }
  
  METHOD moderate_review_content(review_text):
    system_prompt = `
      You are a content moderator for a pet care platform.
      Analyze this review for:
      1. Inappropriate language or content
      2. Spam or fake review indicators  
      3. Personal information that should be redacted
      4. Overall helpfulness score (1-10)
      
      Return JSON: {"approved": boolean, "issues": [], "helpfulness": number, "suggested_edits": []}
    `
    
    response = AWAIT this.anthropic.messages.create({
      model: this.models.quick,  // Fast moderation
      max_tokens: 300,
      temperature: 0.1,  // Very consistent moderation
      system: system_prompt,
      messages: [{
        role: 'user',
        content: review_text
      }]
    })
    
    TRY:
      moderation_result = JSON.parse(response.content[0].text)
      RETURN moderation_result
    CATCH:
      // Fallback if JSON parsing fails
      RETURN {approved: false, issues: ["Failed to parse moderation result"], helpfulness: 0}
  
  METHOD chat_support(user_message, conversation_history):
    system_prompt = `
      You are a helpful customer support assistant for Rawgle, a raw dog food platform.
      Help users with:
      - Finding suppliers
      - Understanding raw feeding basics
      - Using platform features
      - Account and PAWS token questions
      
      Be friendly, concise, and always try to direct users to relevant platform features.
    `
    
    // Build conversation context
    messages = conversation_history.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    messages.push({
      role: 'user',
      content: user_message
    })
    
    response = AWAIT this.anthropic.messages.create({
      model: this.models.quick,  // Fast support responses
      max_tokens: 500,
      temperature: 0.7,  // More conversational
      system: system_prompt,
      messages: messages
    })
    
    RETURN {
      response: response.content[0].text,
      model_used: this.models.quick,
      timestamp: NOW()
    }
  
  METHOD generate_personalized_content(user_profile, pet_profiles, content_type):
    // Generate personalized educational content, tips, etc.
    system_prompt = `
      Create personalized ${content_type} content for this raw feeding enthusiast.
      Make it relevant to their specific pets and experience level.
      Keep it engaging and actionable.
    `
    
    user_context = `
      User has ${pet_profiles.length} pets:
      ${pet_profiles.map(p => `- ${p.name} (${p.breed}, ${p.age_years}y, ${p.weight_kg}kg)`).join('\n')}
      
      User location: ${user_profile.location}
      Account age: ${user_profile.created_at}
      PAWS balance: ${user_profile.paws_balance}
    `
    
    response = AWAIT this.anthropic.messages.create({
      model: this.models.standard,
      max_tokens: 600,
      temperature: 0.6,
      system: system_prompt,
      messages: [{
        role: 'user',
        content: user_context
      }]
    })
    
    RETURN response.content[0].text
```

---

## 🐾 PAWS Token System Implementation

```javascript
// /src/services/paws.js
CLASS PAWSService:
  
  CONSTRUCTOR(db):
    this.db = db
    this.earning_rates = {
      review_submission: 5,
      order_completion: 10,
      referral_signup: 25,
      daily_login: 1,
      profile_completion: 15,
      photo_upload: 2
    }
  
  METHOD get_user_balance(user_id):
    user = db.query("SELECT paws_balance FROM users WHERE id = ?", [user_id])
    IF NOT user:
      THROW_ERROR("User not found")
    
    RETURN user.paws_balance
  
  METHOD award_paws(user_id, action_type, reference_id, custom_amount):
    amount = custom_amount || this.earning_rates[action_type] || 0
    
    IF amount <= 0:
      THROW_ERROR("Invalid PAWS amount")
    
    // Start transaction
    db.begin_transaction()
    
    TRY:
      // Update user balance
      db.execute("UPDATE users SET paws_balance = paws_balance + ?, updated_at = NOW() WHERE id = ?", [amount, user_id])
      
      // Record transaction
      transaction_id = UUID.generate()
      db.execute(`
        INSERT INTO paws_transactions 
        (id, user_id, type, amount, description, reference_type, reference_id) 
        VALUES (?, ?, 'earned', ?, ?, ?, ?)
      `, [transaction_id, user_id, amount, "Earned for " + action_type, action_type, reference_id])
      
      // Commit transaction
      db.commit()
      
      // Send notification
      this.send_paws_notification(user_id, amount, action_type)
      
      RETURN {
        transaction_id: transaction_id,
        amount: amount,
        new_balance: this.get_user_balance(user_id)
      }
    
    CATCH error:
      db.rollback()
      THROW error
  
  METHOD spend_paws(user_id, amount, description, reference_type, reference_id):
    current_balance = this.get_user_balance(user_id)
    
    IF current_balance < amount:
      THROW_ERROR("Insufficient PAWS balance")
    
    db.begin_transaction()
    
    TRY:
      // Update user balance
      db.execute("UPDATE users SET paws_balance = paws_balance - ?, updated_at = NOW() WHERE id = ?", [amount, user_id])
      
      // Record transaction
      transaction_id = UUID.generate()
      db.execute(`
        INSERT INTO paws_transactions 
        (id, user_id, type, amount, description, reference_type, reference_id) 
        VALUES (?, ?, 'spent', ?, ?, ?, ?)
      `, [transaction_id, user_id, amount, description, reference_type, reference_id])
      
      db.commit()
      
      RETURN {
        transaction_id: transaction_id,
        amount: amount,
        new_balance: this.get_user_balance(user_id)
      }
    
    CATCH error:
      db.rollback()
      THROW error
  
  METHOD transfer_paws(sender_id, recipient_email, amount, message):
    recipient = db.query("SELECT id FROM users WHERE email = ?", [recipient_email])
    IF NOT recipient:
      THROW_ERROR("Recipient not found")
    
    sender_balance = this.get_user_balance(sender_id)
    IF sender_balance < amount:
      THROW_ERROR("Insufficient PAWS balance")
    
    db.begin_transaction()
    
    TRY:
      // Deduct from sender
      this.spend_paws(sender_id, amount, "Transferred to " + recipient_email, "transfer", recipient.id)
      
      // Add to recipient
      db.execute("UPDATE users SET paws_balance = paws_balance + ?, updated_at = NOW() WHERE id = ?", [amount, recipient.id])
      
      // Record recipient transaction
      transaction_id = UUID.generate()
      db.execute(`
        INSERT INTO paws_transactions 
        (id, user_id, type, amount, description, reference_type, reference_id) 
        VALUES (?, ?, 'transferred_in', ?, ?, 'transfer', ?)
      `, [transaction_id, recipient.id, amount, "Received from user", sender_id])
      
      db.commit()
      
      // Notify recipient
      this.send_transfer_notification(recipient.id, amount, message)
      
      RETURN {
        success: true,
        amount: amount,
        recipient: recipient_email
      }
    
    CATCH error:
      db.rollback()
      THROW error
  
  METHOD get_transaction_history(user_id, limit, offset):
    transactions = db.query(`
      SELECT * FROM paws_transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [user_id, limit, offset])
    
    RETURN transactions
  
  METHOD calculate_leaderboard():
    // Monthly PAWS earners leaderboard
    leaderboard = db.query(`
      SELECT 
        u.name, 
        u.id,
        SUM(pt.amount) as monthly_earned
      FROM paws_transactions pt
      JOIN users u ON pt.user_id = u.id
      WHERE pt.type = 'earned' 
        AND pt.created_at >= DATE_TRUNC('month', NOW())
      GROUP BY u.id, u.name
      ORDER BY monthly_earned DESC
      LIMIT 50
    `)
    
    RETURN leaderboard
```

---

## 📝 Review System Implementation

```javascript
// /src/services/reviews.js
CLASS ReviewService:
  
  CONSTRUCTOR(db, claude_service, paws_service):
    this.db = db
    this.claude = claude_service
    this.paws = paws_service
  
  METHOD submit_review(user_id, supplier_id, pet_id, rating, title, content, photos):
    // Validate input
    IF rating < 1 OR rating > 5:
      THROW_ERROR("Rating must be between 1 and 5")
    
    // Check for duplicate reviews (one review per user per supplier)
    existing = db.query("SELECT id FROM reviews WHERE user_id = ? AND supplier_id = ?", [user_id, supplier_id])
    IF existing:
      THROW_ERROR("You have already reviewed this supplier")
    
    // AI content moderation
    moderation = AWAIT this.claude.moderate_review_content(content)
    IF NOT moderation.approved:
      THROW_ERROR("Review content violates community guidelines: " + moderation.issues.join(", "))
    
    // Create review
    review_id = UUID.generate()
    db.execute(`
      INSERT INTO reviews 
      (id, user_id, supplier_id, pet_id, rating, title, content, photos) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [review_id, user_id, supplier_id, pet_id, rating, title, content, JSON.stringify(photos)])
    
    // Award PAWS tokens for review submission
    AWAIT this.paws.award_paws(user_id, 'review_submission', review_id)
    
    // Update supplier rating
    this.update_supplier_rating(supplier_id)
    
    // Send notification to supplier (if they have notifications enabled)
    this.notify_supplier_of_review(supplier_id, review_id)
    
    RETURN {
      review_id: review_id,
      status: "published",
      paws_earned: this.paws.earning_rates.review_submission
    }
  
  METHOD get_supplier_reviews(supplier_id, limit, offset, sort_by):
    order_clause = CASE sort_by:
      'newest': 'created_at DESC'
      'oldest': 'created_at ASC'  
      'highest_rated': 'rating DESC'
      'lowest_rated': 'rating ASC'
      'most_helpful': 'helpful_votes DESC'
      DEFAULT: 'created_at DESC'
    
    reviews = db.query(`
      SELECT 
        r.*,
        u.name as user_name,
        p.name as pet_name,
        p.breed as pet_breed
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN pets p ON r.pet_id = p.id
      WHERE r.supplier_id = ?
      ORDER BY ${order_clause}
      LIMIT ? OFFSET ?
    `, [supplier_id, limit, offset])
    
    // Add helpful vote status for current user (if authenticated)
    FOR EACH review IN reviews:
      review.photos = JSON.parse(review.photos || '[]')
    
    RETURN reviews
  
  METHOD vote_helpful(review_id, user_id, is_helpful):
    // Check if user already voted
    existing_vote = db.query("SELECT id FROM review_votes WHERE review_id = ? AND user_id = ?", [review_id, user_id])
    
    IF existing_vote AND is_helpful:
      RETURN {message: "Already voted helpful"}
    
    IF existing_vote AND NOT is_helpful:
      // Remove helpful vote
      db.execute("DELETE FROM review_votes WHERE review_id = ? AND user_id = ?", [review_id, user_id])
      db.execute("UPDATE reviews SET helpful_votes = helpful_votes - 1 WHERE id = ?", [review_id])
      RETURN {message: "Removed helpful vote"}
    
    IF NOT existing_vote AND is_helpful:
      // Add helpful vote
      db.execute("INSERT INTO review_votes (id, review_id, user_id) VALUES (?, ?, ?)", [UUID.generate(), review_id, user_id])
      db.execute("UPDATE reviews SET helpful_votes = helpful_votes + 1 WHERE id = ?", [review_id])
      RETURN {message: "Marked as helpful"}
  
  METHOD get_review_analytics(supplier_id):
    stats = db.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM reviews 
      WHERE supplier_id = ?
    `, [supplier_id])
    
    // Calculate rating distribution percentages
    IF stats.total_reviews > 0:
      stats.rating_distribution = {
        5: (stats.five_star / stats.total_reviews) * 100,
        4: (stats.four_star / stats.total_reviews) * 100,
        3: (stats.three_star / stats.total_reviews) * 100,
        2: (stats.two_star / stats.total_reviews) * 100,
        1: (stats.one_star / stats.total_reviews) * 100
      }
    
    RETURN stats
  
  METHOD flag_review(review_id, reporter_user_id, reason):
    // Allow users to flag inappropriate reviews
    flag_id = UUID.generate()
    db.execute(`
      INSERT INTO review_flags (id, review_id, reporter_user_id, reason, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `, [flag_id, review_id, reporter_user_id, reason])
    
    // If review gets multiple flags, queue for admin review
    flag_count = db.query("SELECT COUNT(*) as count FROM review_flags WHERE review_id = ?", [review_id]).count
    
    IF flag_count >= 3:
      db.execute("UPDATE reviews SET status = 'flagged_for_review' WHERE id = ?", [review_id])
      // Notify admin
      this.notify_admin_of_flagged_review(review_id, flag_count)
    
    RETURN {success: true, flag_count: flag_count}
```

---

## 📱 Mobile API Endpoints Implementation

```javascript
// /src/routes/mobile-api.js
CLASS MobileAPIRouter:
  
  CONSTRUCTOR(auth_service, supplier_service, claude_service):
    this.auth = auth_service
    this.suppliers = supplier_service  
    this.claude = claude_service
  
  // Mobile-optimized search with location
  ROUTE GET /api/mobile/suppliers/nearby:
    REQUIRE_AUTH()
    
    lat = request.query.latitude
    lng = request.query.longitude
    radius = request.query.radius || 25  // Default 25km radius
    limit = request.query.limit || 10
    
    IF NOT lat OR NOT lng:
      user_location = this.get_user_location(request.user.id)
      lat = user_location.latitude
      lng = user_location.longitude
    
    suppliers = AWAIT this.suppliers.search_suppliers(null, lat, lng, radius, limit, 0)
    
    // Mobile-optimized response with essential data only
    mobile_suppliers = suppliers.map(s => ({
      id: s.id,
      name: s.name,
      address: s.address,
      city: s.city,
      state: s.state,
      distance: s.distance_km,
      rating: s.rating,
      phone: s.phone,
      coordinates: {lat: s.latitude, lng: s.longitude}
    }))
    
    RETURN {
      suppliers: mobile_suppliers,
      user_location: {lat: lat, lng: lng},
      search_radius: radius
    }
  
  // Quick barcode scanning for products
  ROUTE POST /api/mobile/products/scan:
    REQUIRE_AUTH()
    
    barcode = request.body.barcode
    location = request.body.user_location
    
    // Look up product in database
    product = db.query("SELECT * FROM products WHERE barcode = ?", [barcode])
    
    IF product:
      // Find nearby suppliers carrying this product
      nearby_suppliers = AWAIT this.suppliers.search_suppliers(product.brand, location.lat, location.lng, 50, 5, 0)
      
      RETURN {
        product: product,
        nearby_suppliers: nearby_suppliers,
        recommendations: AWAIT this.claude.get_product_recommendations(product, request.user.pets)
      }
    ELSE:
      RETURN {
        product: null,
        message: "Product not found in our database",
        suggestion: "Try searching by product name or brand"
      }
  
  // Offline data sync for mobile app
  ROUTE GET /api/mobile/sync:
    REQUIRE_AUTH()
    
    last_sync = request.query.last_sync_timestamp
    user_id = request.user.id
    
    sync_data = {
      user_profile: db.query("SELECT * FROM users WHERE id = ?", [user_id]),
      pets: db.query("SELECT * FROM pets WHERE user_id = ?", [user_id]),
      favorite_suppliers: db.query(`
        SELECT s.* FROM suppliers s
        JOIN user_favorites uf ON s.id = uf.supplier_id
        WHERE uf.user_id = ?
      `, [user_id]),
      recent_reviews: db.query(`
        SELECT * FROM reviews 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 20
      `, [user_id]),
      paws_balance: db.query("SELECT paws_balance FROM users WHERE id = ?", [user_id]).paws_balance,
      notifications: db.query(`
        SELECT * FROM notifications 
        WHERE user_id = ? AND created_at > ? 
        ORDER BY created_at DESC
      `, [user_id, last_sync])
    }
    
    RETURN {
      sync_timestamp: NOW(),
      data: sync_data
    }
  
  // Push notification registration
  ROUTE POST /api/mobile/notifications/register:
    REQUIRE_AUTH()
    
    device_token = request.body.device_token
    platform = request.body.platform  // 'ios' or 'android'
    
    // Store device token for push notifications
    db.execute(`
      INSERT OR REPLACE INTO user_devices 
      (user_id, device_token, platform, updated_at) 
      VALUES (?, ?, ?, NOW())
    `, [request.user.id, device_token, platform])
    
    RETURN {success: true, message: "Device registered for notifications"}
```

---

## 🔄 Real-time Features Implementation

```javascript
// /src/services/websocket.js  
CLASS WebSocketService:
  
  CONSTRUCTOR(db):
    this.db = db
    this.connections = new Map()  // user_id -> websocket_connection
  
  METHOD handle_connection(websocket, user_id):
    this.connections.set(user_id, websocket)
    
    websocket.on('close', () => {
      this.connections.delete(user_id)
    })
    
    websocket.on('message', (message) => {
      this.handle_message(user_id, JSON.parse(message))
    })
    
    // Send connection confirmation
    this.send_to_user(user_id, {
      type: 'connected',
      timestamp: NOW(),
      user_id: user_id
    })
  
  METHOD handle_message(user_id, message):
    SWITCH message.type:
      CASE 'join_supplier_updates':
        // Subscribe to updates for specific supplier
        supplier_id = message.supplier_id
        this.subscribe_user_to_supplier(user_id, supplier_id)
        
      CASE 'live_chat_message':
        // Handle live chat between users and suppliers
        this.handle_chat_message(user_id, message)
        
      CASE 'typing_indicator':
        // Show typing indicators in chat
        this.broadcast_typing(user_id, message.chat_id, message.typing)
  
  METHOD notify_new_review(supplier_id, review):
    // Notify all users subscribed to this supplier
    subscribers = db.query("SELECT user_id FROM supplier_subscriptions WHERE supplier_id = ?", [supplier_id])
    
    notification = {
      type: 'new_review',
      supplier_id: supplier_id,
      review: review,
      timestamp: NOW()
    }
    
    FOR EACH subscriber IN subscribers:
      this.send_to_user(subscriber.user_id, notification)
  
  METHOD broadcast_paws_milestone(user_id, milestone):
    // Celebrate user achievements
    user = db.query("SELECT name FROM users WHERE id = ?", [user_id])
    
    celebration = {
      type: 'paws_milestone',
      user_name: user.name,
      milestone: milestone,
      timestamp: NOW()
    }
    
    // Send to user's friends/followers
    friends = db.query("SELECT friend_id FROM user_friends WHERE user_id = ?", [user_id])
    
    FOR EACH friend IN friends:
      this.send_to_user(friend.friend_id, celebration)
  
  METHOD send_to_user(user_id, message):
    connection = this.connections.get(user_id)
    IF connection AND connection.readyState === WebSocket.OPEN:
      connection.send(JSON.stringify(message))
```

---

## 📊 Analytics & Reporting Implementation

```javascript  
// /src/services/analytics.js
CLASS AnalyticsService:
  
  CONSTRUCTOR(db):
    this.db = db
  
  METHOD track_user_action(user_id, action, data):
    event_id = UUID.generate()
    db.execute(`
      INSERT INTO user_events 
      (id, user_id, action, data, timestamp) 
      VALUES (?, ?, ?, ?, NOW())
    `, [event_id, user_id, action, JSON.stringify(data)])
  
  METHOD get_supplier_analytics(supplier_id, date_range):
    analytics = {
      views: db.query(`
        SELECT COUNT(*) as count 
        FROM user_events 
        WHERE action = 'supplier_view' 
        AND JSON_EXTRACT(data, '$.supplier_id') = ?
        AND timestamp >= ?
      `, [supplier_id, date_range.start]).count,
      
      clicks: db.query(`
        SELECT COUNT(*) as count
        FROM user_events 
        WHERE action = 'supplier_contact' 
        AND JSON_EXTRACT(data, '$.supplier_id') = ?
        AND timestamp >= ?
      `, [supplier_id, date_range.start]).count,
      
      reviews_received: db.query(`
        SELECT COUNT(*) as count 
        FROM reviews 
        WHERE supplier_id = ? 
        AND created_at >= ?
      `, [supplier_id, date_range.start]).count,
      
      average_rating: db.query(`
        SELECT AVG(rating) as avg 
        FROM reviews 
        WHERE supplier_id = ? 
        AND created_at >= ?
      `, [supplier_id, date_range.start]).avg || 0
    }
    
    RETURN analytics
  
  METHOD get_platform_metrics():
    metrics = {
      total_users: db.query("SELECT COUNT(*) as count FROM users WHERE status = 'active'").count,
      total_suppliers: db.query("SELECT COUNT(*) as count FROM suppliers").count,
      total_reviews: db.query("SELECT COUNT(*) as count FROM reviews").count,
      total_paws_in_circulation: db.query("SELECT SUM(paws_balance) as sum FROM users").sum || 0,
      
      daily_active_users: db.query(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM user_events 
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 DAY)
      `).count,
      
      monthly_active_users: db.query(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM user_events 
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `).count,
      
      popular_search_terms: db.query(`
        SELECT 
          JSON_EXTRACT(data, '$.query') as term,
          COUNT(*) as frequency
        FROM user_events 
        WHERE action = 'search' 
        AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY term
        ORDER BY frequency DESC
        LIMIT 10
      `)
    }
    
    RETURN metrics
```

---

## 🚀 Deployment & Infrastructure

```bash
# /scripts/deploy.sh
DEPLOYMENT_SCRIPT:

# Phase 1: Database Setup
echo "Setting up database..."
wrangler d1 create rawgle-production-db
wrangler d1 execute rawgle-production-db --file=./migrations/0001_initial_schema.sql

# Import legacy supplier data
echo "Importing supplier data..."
node scripts/import-legacy-suppliers.js

# Phase 2: Deploy Workers
echo "Deploying backend services..."
wrangler deploy --env production

# Phase 3: Deploy Frontend  
echo "Building and deploying frontend..."
cd ../rawgle-frontend
npm run build
wrangler pages deploy dist --project-name rawgle-frontend

# Phase 4: Setup monitoring
echo "Configuring monitoring..."
wrangler tail --env production > /dev/null &  # Background log monitoring

# Phase 5: Run smoke tests
echo "Running smoke tests..."
curl -f https://rawgle-backend.workers.dev/health || exit 1
curl -f https://rawgle.com/ || exit 1

echo "Deployment complete! ✅"
echo "Backend: https://rawgle-backend.workers.dev"  
echo "Frontend: https://rawgle.com"
```

---

## 🧪 Testing Strategy Implementation

```javascript
// /tests/integration/platform.test.js
INTEGRATION_TESTS:

DESCRIBE "Complete User Journey":
  
  TEST "User Registration -> Pet Profile -> Supplier Search -> Review":
    // 1. Register new user
    user_data = {email: "test@example.com", password: "Test123!", name: "Test User"}
    register_response = AWAIT api.post('/auth/register', user_data)
    
    EXPECT(register_response.status).toBe(200)
    EXPECT(register_response.data.user.paws_balance).toBe(100)  // Welcome bonus
    
    token = register_response.data.token
    
    // 2. Create pet profile
    pet_data = {
      name: "Buddy", 
      breed: "Labrador Retriever", 
      age_years: 3, 
      weight_kg: 30, 
      activity_level: "high"
    }
    
    pet_response = AWAIT api.post('/pets', pet_data, {headers: {Authorization: "Bearer " + token}})
    EXPECT(pet_response.status).toBe(201)
    
    pet_id = pet_response.data.pet.id
    
    // 3. Search for nearby suppliers
    search_response = AWAIT api.get('/suppliers/search?latitude=40.7128&longitude=-74.0060&radius=25', 
                                   {headers: {Authorization: "Bearer " + token}})
    
    EXPECT(search_response.status).toBe(200)
    EXPECT(search_response.data.suppliers.length).toBeGreaterThan(0)
    
    supplier_id = search_response.data.suppliers[0].id
    
    // 4. Submit review
    review_data = {
      supplier_id: supplier_id,
      pet_id: pet_id,
      rating: 5,
      title: "Great experience!",
      content: "High quality raw food and excellent service. My dog loves it!"
    }
    
    review_response = AWAIT api.post('/reviews', review_data, {headers: {Authorization: "Bearer " + token}})
    EXPECT(review_response.status).toBe(201)
    EXPECT(review_response.data.paws_earned).toBe(5)  // Review reward
    
    // 5. Verify PAWS balance updated
    profile_response = AWAIT api.get('/auth/me', {headers: {Authorization: "Bearer " + token}})
    EXPECT(profile_response.data.user.paws_balance).toBe(105)  // 100 + 5 from review
  
  TEST "Claude AI Integration":
    pet_advice_request = {
      pet_id: pet_id,
      query: "What's the best protein ratio for a 3-year-old active Labrador?"
    }
    
    advice_response = AWAIT api.post('/ai/nutrition-advice', pet_advice_request, 
                                    {headers: {Authorization: "Bearer " + token}})
    
    EXPECT(advice_response.status).toBe(200)
    EXPECT(advice_response.data.advice).toContain("protein")
    EXPECT(advice_response.data.model_used).toBe("claude-3-opus-20240229")
    EXPECT(advice_response.data.tokens_used).toBeGreaterThan(0)

# /tests/performance/load.test.js  
PERFORMANCE_TESTS:

  TEST "API Response Times Under Load":
    // Test 100 concurrent users searching suppliers
    concurrent_requests = Array(100).fill().map(() => 
      api.get('/suppliers/search?latitude=40.7128&longitude=-74.0060')
    )
    
    start_time = NOW()
    responses = AWAIT Promise.all(concurrent_requests)
    end_time = NOW()
    
    average_response_time = (end_time - start_time) / 100
    
    EXPECT(average_response_time).toBeLessThan(500)  // Under 500ms average
    EXPECT(responses.every(r => r.status === 200)).toBe(true)
  
  TEST "Database Performance with Large Dataset":
    // Test queries with 10,000+ suppliers
    large_search_response = AWAIT api.get('/suppliers/search?query=raw+dog+food&limit=50')
    
    EXPECT(large_search_response.status).toBe(200)
    EXPECT(large_search_response.response_time).toBeLessThan(200)  // Under 200ms
    EXPECT(large_search_response.data.suppliers).toHaveLength(50)
```

---

## 🏁 Implementation Roadmap

```markdown
# WEEK-BY-WEEK IMPLEMENTATION SCHEDULE

## Week 1: Foundation
- ✅ Fix database migrations and import 9,137 suppliers
- ✅ Implement authentication system (register, login, JWT)  
- ✅ Create basic supplier search API
- ✅ Fix test infrastructure
- ✅ Deploy staging environment

## Week 2: Core Features
- ✅ Complete PAWS token system
- ✅ Implement review system with AI moderation
- ✅ Connect frontend to backend APIs
- ✅ Add pet profile management
- ✅ Basic Claude AI integration

## Week 3: Enhanced Features  
- ✅ Advanced search with filters
- ✅ Real-time notifications
- ✅ Mobile API endpoints
- ✅ Analytics tracking
- ✅ Performance optimization

## Week 4: Community Features
- ✅ User profiles and social features
- ✅ Advanced Claude AI recommendations
- ✅ WebSocket real-time updates
- ✅ Content moderation system
- ✅ Admin dashboard

## Week 5-6: Polish & Launch
- ✅ Comprehensive testing (60%+ coverage)
- ✅ Security audit and fixes
- ✅ Performance testing and optimization
- ✅ Production deployment
- ✅ Monitoring and alerting setup

## Week 7-8: Post-Launch
- ✅ Bug fixes and stability improvements
- ✅ Mobile app development
- ✅ Advanced AI features
- ✅ Marketing and user acquisition
- ✅ Feature enhancements based on feedback
```

---

This pseudocode provides a complete blueprint for rebuilding the Rawgle platform with Claude AI integration, PAWS token system, and all documented features. Each section includes specific implementation details that can be directly translated into working code.

The build prioritizes backend completion first (as identified in the technical audit), then frontend integration, testing, and deployment. The Claude AI integration uses the latest Anthropic SDK with Cloudflare AI Gateway for optimal performance and caching.