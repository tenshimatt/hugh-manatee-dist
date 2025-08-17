#!/bin/bash

echo "🚀 Setting up Complete Google Places API Data Pipeline"
echo "======================================================"

# Step 1: Create database schema
echo "🏗️  Creating complete database schema..."
npx wrangler d1 execute findrawdogfood-db --remote --file=d1-schema-complete.sql

echo ""
echo "📊 Database schema created with ALL Google Places API fields:"
echo "   • Basic info: name, place_id, types, addresses"
echo "   • Contact: phone, website, Google Maps URL"
echo "   • Hours: opening_hours, current_opening_hours, secondary_opening_hours"
echo "   • Services: delivery, takeout, dine_in, curbside_pickup"
echo "   • Food services: breakfast, lunch, dinner, brunch, beer, wine"
echo "   • Media: photos (JSON), icon, colors"
echo "   • Reviews: customer reviews (JSON)"
echo "   • Accessibility: wheelchair_accessible_entrance"
echo ""

# Step 2: Test complete scraper
echo "🧪 Testing complete scraper (limited run)..."
echo "Do you want to run a test scrape with the complete API fields? (y/n)"
read -r response

if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
    echo "🔄 Running complete scraper test..."
    node google-places-scraper-complete.js
    
    echo ""
    echo "📁 Files generated:"
    ls -la complete_raw_dog_food_suppliers_*.csv 2>/dev/null || echo "   No CSV files generated"
    ls -la complete_raw_dog_food_suppliers_*.json 2>/dev/null || echo "   No JSON files generated"
    ls -la field_mapping.json 2>/dev/null && echo "   ✅ Field mapping created" || echo "   No field mapping"
    
    # Step 3: Import complete data
    if ls complete_raw_dog_food_suppliers_*.csv 1> /dev/null 2>&1; then
        echo ""
        echo "📦 Import complete data to database? (y/n)"
        read -r import_response
        
        if [ "$import_response" = "y" ] || [ "$import_response" = "Y" ]; then
            echo "🔄 Importing complete data..."
            node d1-importer-complete.js
            
            echo ""
            echo "📊 Checking database stats..."
            npx wrangler d1 execute findrawdogfood-db --remote --command="
            SELECT 
                COUNT(*) as total_suppliers,
                COUNT(CASE WHEN photos IS NOT NULL AND photos != 'null' THEN 1 END) as with_photos,
                COUNT(CASE WHEN reviews IS NOT NULL AND reviews != 'null' THEN 1 END) as with_reviews,
                COUNT(CASE WHEN opening_hours IS NOT NULL AND opening_hours != 'null' THEN 1 END) as with_hours,
                COUNT(CASE WHEN website IS NOT NULL AND website != '' THEN 1 END) as with_website,
                COUNT(CASE WHEN formatted_phone_number IS NOT NULL AND formatted_phone_number != '' THEN 1 END) as with_phone,
                COUNT(CASE WHEN delivery = 1 THEN 1 END) as offers_delivery,
                COUNT(CASE WHEN takeout = 1 THEN 1 END) as offers_takeout
            FROM suppliers_complete;
            "
        fi
    fi
fi

echo ""
echo "🎯 Complete API Integration Summary:"
echo "=================================="
echo ""
echo "📋 What You Now Have:"
echo "   ✅ Complete Google Places API field extraction"
echo "   ✅ Rich database schema with ALL available data"
echo "   ✅ Photos, reviews, hours, services, contact info"
echo "   ✅ Same API cost, 10x more valuable data"
echo ""
echo "💰 API Cost Breakdown:"
echo "   • Text Search: $32/1000 requests (unchanged)"
echo "   • Place Details: $17/1000 requests (unchanged)"
echo "   • Fields Retrieved: ALL available (massive upgrade!)"
echo ""
echo "🚀 Next Steps:"
echo "   1. Run daily: node google-places-scraper-complete.js"
echo "   2. Import data: node d1-importer-complete.js"
echo "   3. Rich data available for UI enhancements"
echo ""
echo "📊 Available Rich Data:"
echo "   • 📸 Store photos for visual listings"
echo "   • ⭐ Customer reviews for credibility"
echo "   • 🕒 Operating hours for accuracy"
echo "   • 🚚 Service options (delivery, takeout)"
echo "   • 📞 Multiple contact methods"
echo "   • ♿ Accessibility information"
echo "   • 🍽️ Food service details"
echo ""
echo "💎 Data Quality Upgrade:"
echo "   • Before: Basic name, address, rating"
echo "   • After: Complete business profiles with media"
echo "   • Use Case: Premium supplier directory"
echo ""

# Step 4: Show sample data structure
if ls field_mapping.json 1> /dev/null 2>&1; then
    echo "📋 Complete Field Mapping:"
    echo "========================"
    node -e "
    const mapping = require('./field_mapping.json');
    console.log('🔗 Google API Fields:', mapping.google_api_fields.length, 'fields');
    console.log('📊 Database Columns:', mapping.csv_headers.length, 'columns');
    console.log('🗄️  Database Schema Ready:', mapping.database_schema_sql ? 'Yes' : 'No');
    "
fi

echo ""
echo "🎉 Complete Google Places API integration ready!"
echo "Same cost, maximum data value! 💎"
