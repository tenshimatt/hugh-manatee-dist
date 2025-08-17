# Google Places API Documentation

## Overview
The Google Places API is used for collecting raw dog food supplier data through automated scraping. The API provides location-based search and detailed place information for business listings.

## Authentication
- **API Key**: Required via Google Cloud Console
- **Current Keys**: Multiple keys for free tier management (1000 calls/day each)
- **URL Parameter**: `key={API_KEY}`

## API Keys in Use
```javascript
// From google-places-scraper.js
this.apiKeys = [
  {
    key: 'AIzaSyAaitGKLzY7PuyYYWLNifeQEqxfaWzncfg',
    account: 'tenshimatt@gmail.com',
    dailyLimit: 1000,
    used: 0
  },
  {
    key: 'AIzaSyBnvRVRCE8ixANqhHCS99MQtlUBmlFr7Mk', 
    account: 'mw@samuelandcotrading.com',
    dailyLimit: 950,
    used: 0
  }
];
```

## Endpoints Used

### Text Search
- **Endpoint**: `https://maps.googleapis.com/maps/api/place/textsearch/json`
- **Method**: GET
- **Purpose**: Find places based on text queries

#### Parameters
- `query`: Search query string (e.g., "raw dog food store Austin, TX")
- `key`: API key

#### Example Request
```javascript
const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
  `query=${encodeURIComponent(query + ' ' + location)}&` +
  `key=${keyObj.key}`;
```

### Place Details
- **Endpoint**: `https://maps.googleapis.com/maps/api/place/details/json`
- **Method**: GET
- **Purpose**: Get detailed information about a specific place

#### Parameters
- `place_id`: Unique place identifier from search results
- `fields`: Comma-separated list of data fields to return
- `key`: API key

#### Fields Requested
```javascript
const fields = [
  'name', 'rating', 'formatted_phone_number', 'website', 
  'formatted_address', 'geometry', 'opening_hours', 
  'price_level', 'user_ratings_total', 'types'
].join(',');
```

#### Example Request
```javascript
const url = `https://maps.googleapis.com/maps/api/place/details/json?` +
  `place_id=${placeId}&` +
  `fields=${fields}&` +
  `key=${keyObj.key}`;
```

## Usage in FindRawDogFood

### Data Collection System
- **File**: `google-places-scraper.js`
- **Purpose**: Automated collection of raw dog food supplier data
- **Frequency**: Daily scraping runs
- **Target Cities**: 15 major US cities
- **Search Terms**: 5 variations of raw dog food related queries

### Search Configuration
```javascript
this.searchTerms = [
  'raw dog food store',
  'pet nutrition center', 
  'holistic pet food',
  'natural dog food shop',
  'raw pet food supplier'
];

this.cities = [
  { name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  // ... additional cities
];
```

### Data Processing
1. **Text Search**: Find places matching search terms in target cities
2. **Place Details**: Get comprehensive information for each place
3. **Data Normalization**: Structure data for database import
4. **Duplicate Removal**: Check for existing places by place_id
5. **Export**: Save as CSV and JSON formats

## Response Structure

### Text Search Response
```json
{
  "results": [
    {
      "place_id": "ChIJ...",
      "name": "Business Name",
      "formatted_address": "123 Main St, City, State",
      "geometry": {
        "location": {
          "lat": 40.7128,
          "lng": -74.0060
        }
      },
      "rating": 4.5,
      "types": ["pet_store", "establishment"]
    }
  ],
  "status": "OK"
}
```

### Place Details Response
```json
{
  "result": {
    "name": "Business Name",
    "formatted_address": "123 Main St, City, State 12345",
    "formatted_phone_number": "(555) 123-4567",
    "website": "https://example.com",
    "rating": 4.5,
    "user_ratings_total": 123,
    "geometry": {
      "location": {
        "lat": 40.7128,
        "lng": -74.0060
      }
    },
    "opening_hours": {
      "open_now": true,
      "weekday_text": [...]
    },
    "types": ["pet_store", "establishment"]
  },
  "status": "OK"
}
```

## Rate Limiting & Quotas

### Free Tier Limits
- **Text Search**: 1,000 requests per day per API key
- **Place Details**: 1,000 requests per day per API key
- **QPS Limit**: 50 queries per second

### Implementation Strategy
```javascript
// Rate limiting between requests
await this.sleep(500); // 500ms between detail calls
await this.sleep(1000); // 1000ms between cities

// Daily limit management
if (this.getTotalCalls() >= 1900) { // Leave buffer before 2000 total
  console.log(`🛑 Approaching daily limits. Stopping for today.`);
  return;
}
```

## Error Handling
```javascript
try {
  const response = await axios.get(url, { timeout: 10000 });
  keyObj.used++;
  return response.data;
} catch (error) {
  console.error(`❌ API Error:`, error.response?.data || error.message);
  this.errors.push({
    url,
    error: error.message,
    timestamp: new Date().toISOString()
  });
  return null;
}
```

## Status Codes
- `OK`: Request successful
- `ZERO_RESULTS`: No results found
- `OVER_QUERY_LIMIT`: Exceeded quota
- `REQUEST_DENIED`: Invalid API key or permissions
- `INVALID_REQUEST`: Missing required parameters

## Best Practices
1. **API Key Management**: Rotate between multiple keys to maximize quota
2. **Rate Limiting**: Implement delays between requests
3. **Error Handling**: Gracefully handle failures and continue processing
4. **Caching**: Store session data to resume after interruptions
5. **Duplicate Detection**: Check place_id to avoid duplicate entries
6. **Field Selection**: Only request needed fields to minimize costs

## Database Integration
Data is structured for import into Cloudflare D1 database:
```javascript
const combinedData = {
  id: this.generateUUID(),
  place_id: place.place_id,
  name: details.name || place.name,
  address: details.formatted_address,
  city: city.name,
  state: city.state,
  country: 'USA',
  latitude: details.geometry?.location?.lat,
  longitude: details.geometry?.location?.lng,
  phone_number: details.formatted_phone_number || '',
  website: details.website || '',
  rating: details.rating || 0,
  user_ratings_total: details.user_ratings_total || 0,
  types: JSON.stringify(details.types || []),
  keyword: searchTerm,
  created_at: new Date().toISOString()
};
```

## Related Documentation
- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Text Search Requests](https://developers.google.com/maps/documentation/places/web-service/search-text)
- [Place Details Requests](https://developers.google.com/maps/documentation/places/web-service/details)
- [Usage and Billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)