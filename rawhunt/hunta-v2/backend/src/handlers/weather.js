/**
 * Weather Handler - Weather Integration for Hunting
 * Provides weather data and hunting condition analysis
 */

export async function weatherHandler(request, path, env) {
    const method = request.method;
    
    try {
        if (path === '/api/weather/current' && method === 'GET') {
            return await getCurrentWeather(request, env);
        } else if (path === '/api/weather/forecast' && method === 'GET') {
            return await getWeatherForecast(request, env);
        } else if (path === '/api/weather/hunting-conditions' && method === 'GET') {
            return await getHuntingConditions(request, env);
        } else if (path === '/api/weather/historical' && method === 'GET') {
            return await getHistoricalWeather(request, env);
        } else if (path === '/api/weather/alerts' && method === 'GET') {
            return await getWeatherAlerts(request, env);
        } else {
            return errorResponse('Weather endpoint not found', 404);
        }
    } catch (error) {
        console.error('Weather handler error:', error);
        return errorResponse('Weather operation failed', 500);
    }
}

async function getCurrentWeather(request, env) {
    try {
        const url = new URL(request.url);
        const lat = url.searchParams.get('lat');
        const lng = url.searchParams.get('lng');
        const location = url.searchParams.get('location');

        if (!lat || !lng) {
            return errorResponse('Latitude and longitude are required', 400);
        }

        if (!validateGPSCoordinates(parseFloat(lat), parseFloat(lng))) {
            return errorResponse('Invalid GPS coordinates', 400);
        }

        // Try to fetch real weather data if API key is available
        if (env.WEATHER_API_KEY) {
            try {
                const weatherData = await fetchRealWeather(lat, lng, env.WEATHER_API_KEY);
                return successResponse(weatherData);
            } catch (error) {
                console.error('Real weather API failed, using demo data:', error);
            }
        }

        // Demo weather data
        const demoWeather = generateDemoWeather(lat, lng, location);
        return successResponse(demoWeather);

    } catch (error) {
        console.error('Current weather error:', error);
        return errorResponse('Failed to fetch current weather', 500);
    }
}

async function getWeatherForecast(request, env) {
    try {
        const url = new URL(request.url);
        const lat = url.searchParams.get('lat');
        const lng = url.searchParams.get('lng');
        const days = parseInt(url.searchParams.get('days')) || 5;

        if (!lat || !lng) {
            return errorResponse('Latitude and longitude are required', 400);
        }

        if (days < 1 || days > 10) {
            return errorResponse('Days must be between 1 and 10', 400);
        }

        // Try real weather API
        if (env.WEATHER_API_KEY) {
            try {
                const forecastData = await fetchRealForecast(lat, lng, days, env.WEATHER_API_KEY);
                return successResponse(forecastData);
            } catch (error) {
                console.error('Real forecast API failed, using demo data:', error);
            }
        }

        // Demo forecast data
        const demoForecast = generateDemoForecast(lat, lng, days);
        return successResponse(demoForecast);

    } catch (error) {
        console.error('Weather forecast error:', error);
        return errorResponse('Failed to fetch weather forecast', 500);
    }
}

async function getHuntingConditions(request, env) {
    try {
        const url = new URL(request.url);
        const lat = url.searchParams.get('lat');
        const lng = url.searchParams.get('lng');
        const hunt_type = url.searchParams.get('hunt_type') || 'upland';

        if (!lat || !lng) {
            return errorResponse('Latitude and longitude are required', 400);
        }

        // Get current weather
        let weatherData;
        if (env.WEATHER_API_KEY) {
            try {
                weatherData = await fetchRealWeather(lat, lng, env.WEATHER_API_KEY);
            } catch (error) {
                weatherData = generateDemoWeather(lat, lng);
            }
        } else {
            weatherData = generateDemoWeather(lat, lng);
        }

        // Analyze hunting conditions
        const huntingAnalysis = analyzeHuntingConditions(weatherData, hunt_type);

        return successResponse({
            location: {
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            },
            current_weather: weatherData,
            hunt_type: hunt_type,
            hunting_analysis: huntingAnalysis,
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Hunting conditions error:', error);
        return errorResponse('Failed to analyze hunting conditions', 500);
    }
}

async function getHistoricalWeather(request, env) {
    try {
        const url = new URL(request.url);
        const lat = url.searchParams.get('lat');
        const lng = url.searchParams.get('lng');
        const date = url.searchParams.get('date');

        if (!lat || !lng || !date) {
            return errorResponse('Latitude, longitude, and date are required', 400);
        }

        const requestDate = new Date(date);
        if (isNaN(requestDate.getTime())) {
            return errorResponse('Invalid date format', 400);
        }

        // For demo purposes, generate historical weather
        const historicalWeather = generateHistoricalWeather(lat, lng, date);
        return successResponse(historicalWeather);

    } catch (error) {
        console.error('Historical weather error:', error);
        return errorResponse('Failed to fetch historical weather', 500);
    }
}

async function getWeatherAlerts(request, env) {
    try {
        const url = new URL(request.url);
        const lat = url.searchParams.get('lat');
        const lng = url.searchParams.get('lng');

        if (!lat || !lng) {
            return errorResponse('Latitude and longitude are required', 400);
        }

        // Try real weather alerts if API available
        if (env.WEATHER_API_KEY) {
            try {
                const alertsData = await fetchRealAlerts(lat, lng, env.WEATHER_API_KEY);
                return successResponse(alertsData);
            } catch (error) {
                console.error('Real alerts API failed, using demo data:', error);
            }
        }

        // Demo weather alerts
        const demoAlerts = generateDemoAlerts(lat, lng);
        return successResponse(demoAlerts);

    } catch (error) {
        console.error('Weather alerts error:', error);
        return errorResponse('Failed to fetch weather alerts', 500);
    }
}

// Weather API Integration Functions
async function fetchRealWeather(lat, lng, apiKey) {
    // This would integrate with a real weather API like OpenWeatherMap, WeatherAPI, etc.
    // Example for OpenWeatherMap:
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`
    );
    
    if (!response.ok) {
        throw new Error('Weather API request failed');
    }
    
    const data = await response.json();
    
    return {
        temperature: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        wind_speed: Math.round(data.wind.speed),
        wind_direction: data.wind.deg,
        visibility: data.visibility ? Math.round(data.visibility * 0.000621371) : null, // Convert m to miles
        conditions: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
        sunset: new Date(data.sys.sunset * 1000).toISOString(),
        timestamp: new Date().toISOString(),
        source: 'OpenWeatherMap'
    };
}

async function fetchRealForecast(lat, lng, days, apiKey) {
    // Example forecast API integration
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial&cnt=${days * 8}` // 8 forecasts per day (3-hour intervals)
    );
    
    if (!response.ok) {
        throw new Error('Forecast API request failed');
    }
    
    const data = await response.json();
    
    // Group forecasts by day
    const dailyForecasts = {};
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = {
                date: date,
                high_temp: item.main.temp_max,
                low_temp: item.main.temp_min,
                conditions: item.weather[0].main,
                description: item.weather[0].description,
                wind_speed: item.wind.speed,
                humidity: item.main.humidity,
                precipitation_chance: item.pop * 100,
                forecasts: []
            };
        }
        
        dailyForecasts[date].high_temp = Math.max(dailyForecasts[date].high_temp, item.main.temp_max);
        dailyForecasts[date].low_temp = Math.min(dailyForecasts[date].low_temp, item.main.temp_min);
        dailyForecasts[date].forecasts.push({
            time: new Date(item.dt * 1000).toISOString(),
            temperature: Math.round(item.main.temp),
            conditions: item.weather[0].main,
            wind_speed: Math.round(item.wind.speed),
            precipitation_chance: Math.round(item.pop * 100)
        });
    });
    
    return {
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        forecast_days: Object.values(dailyForecasts).slice(0, days),
        generated_at: new Date().toISOString(),
        source: 'OpenWeatherMap'
    };
}

async function fetchRealAlerts(lat, lng, apiKey) {
    // Weather alerts API integration would go here
    // For now, return demo alerts structure
    return generateDemoAlerts(lat, lng);
}

// Demo Weather Data Generators
function generateDemoWeather(lat, lng, location = null) {
    const conditions = ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Heavy Rain', 'Snow', 'Fog'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    // Generate realistic temperatures based on season and location
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const seasonalFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI - Math.PI/2); // -1 to 1
    
    const baseTemp = 50 + (parseFloat(lat) < 35 ? 20 : parseFloat(lat) > 45 ? -10 : 0); // Latitude adjustment
    const temp = Math.round(baseTemp + seasonalFactor * 25 + (Math.random() - 0.5) * 20);
    
    return {
        temperature: temp,
        feels_like: temp + Math.round((Math.random() - 0.5) * 10),
        humidity: Math.round(30 + Math.random() * 50),
        pressure: Math.round(29.5 + Math.random() * 1.0, 2),
        wind_speed: Math.round(Math.random() * 20),
        wind_direction: Math.round(Math.random() * 360),
        visibility: Math.round(5 + Math.random() * 10),
        conditions: condition,
        description: getWeatherDescription(condition),
        sunrise: getSunrise(lat, lng),
        sunset: getSunset(lat, lng),
        timestamp: new Date().toISOString(),
        source: 'Demo Data',
        location: location || `${lat}, ${lng}`
    };
}

function generateDemoForecast(lat, lng, days) {
    const forecasts = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() + i);
        
        const baseTemp = 45 + Math.random() * 30;
        const highTemp = Math.round(baseTemp + Math.random() * 15);
        const lowTemp = Math.round(baseTemp - Math.random() * 15);
        
        forecasts.push({
            date: date.toISOString().split('T')[0],
            high_temp: highTemp,
            low_temp: lowTemp,
            conditions: ['Clear', 'Partly Cloudy', 'Overcast', 'Showers'][Math.floor(Math.random() * 4)],
            wind_speed: Math.round(Math.random() * 15),
            humidity: Math.round(40 + Math.random() * 40),
            precipitation_chance: Math.round(Math.random() * 80),
            hunting_rating: Math.round(1 + Math.random() * 4) // 1-5 scale
        });
    }
    
    return {
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        forecast_days: forecasts,
        generated_at: new Date().toISOString(),
        source: 'Demo Data'
    };
}

function generateHistoricalWeather(lat, lng, date) {
    const requestDate = new Date(date);
    const baseTemp = 50 + (parseFloat(lat) < 35 ? 15 : parseFloat(lat) > 45 ? -15 : 0);
    
    return {
        date: date,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        temperature: {
            high: Math.round(baseTemp + Math.random() * 20),
            low: Math.round(baseTemp - Math.random() * 20),
            average: Math.round(baseTemp + (Math.random() - 0.5) * 10)
        },
        conditions: ['Clear', 'Partly Cloudy', 'Overcast'][Math.floor(Math.random() * 3)],
        wind_speed: Math.round(Math.random() * 15),
        precipitation: Math.random() > 0.7 ? Math.round(Math.random() * 2 * 100) / 100 : 0,
        humidity: Math.round(40 + Math.random() * 40),
        source: 'Demo Historical Data',
        generated_at: new Date().toISOString()
    };
}

function generateDemoAlerts(lat, lng) {
    const alertTypes = [
        { type: 'severe_weather', severity: 'moderate', title: 'Severe Thunderstorm Watch' },
        { type: 'high_wind', severity: 'minor', title: 'High Wind Advisory' },
        { type: 'fog', severity: 'minor', title: 'Dense Fog Advisory' }
    ];
    
    // Random chance of having alerts
    const hasAlerts = Math.random() > 0.7;
    
    if (!hasAlerts) {
        return {
            location: { lat: parseFloat(lat), lng: parseFloat(lng) },
            alerts: [],
            alert_count: 0,
            generated_at: new Date().toISOString(),
            source: 'Demo Data'
        };
    }
    
    const numAlerts = Math.floor(Math.random() * 2) + 1;
    const alerts = [];
    
    for (let i = 0; i < numAlerts; i++) {
        const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const start = new Date();
        const end = new Date(start.getTime() + (Math.random() * 12 + 4) * 60 * 60 * 1000); // 4-16 hours
        
        alerts.push({
            id: generateId(),
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            description: `${alert.title} in effect for the hunting area. Monitor conditions closely.`,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            hunting_impact: getHuntingImpact(alert.type),
            recommendations: getHuntingRecommendations(alert.type)
        });
    }
    
    return {
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        alerts: alerts,
        alert_count: alerts.length,
        generated_at: new Date().toISOString(),
        source: 'Demo Data'
    };
}

// Hunting Condition Analysis
function analyzeHuntingConditions(weatherData, huntType) {
    const temp = weatherData.temperature;
    const windSpeed = weatherData.wind_speed;
    const conditions = weatherData.conditions.toLowerCase();
    const humidity = weatherData.humidity;
    
    let score = 5; // Start with perfect score
    let factors = [];
    let recommendations = [];
    
    // Temperature analysis
    if (huntType === 'upland') {
        if (temp < 20 || temp > 80) {
            score -= 1;
            factors.push('Temperature outside optimal range for upland hunting');
            if (temp < 20) {
                recommendations.push('Dress in layers and watch for hypothermia in dogs');
            } else {
                recommendations.push('Hunt early morning or evening, ensure dogs stay hydrated');
            }
        } else if (temp >= 40 && temp <= 65) {
            factors.push('Excellent temperature for upland hunting');
        }
    } else if (huntType === 'waterfowl') {
        if (temp > 70) {
            score -= 0.5;
            factors.push('Warm temperatures may reduce waterfowl activity');
        } else if (temp < 35) {
            factors.push('Cold temperatures excellent for waterfowl hunting');
        }
    }
    
    // Wind analysis
    if (windSpeed > 20) {
        score -= 1;
        factors.push('High winds may affect scent conditions and bird behavior');
        recommendations.push('Hunt in sheltered areas, be extra cautious with dog safety');
    } else if (windSpeed >= 8 && windSpeed <= 15) {
        factors.push('Good wind conditions for hunting');
    } else if (windSpeed < 5) {
        if (huntType === 'upland') {
            score -= 0.5;
            factors.push('Low wind may reduce scent dispersal');
        }
    }
    
    // Weather condition analysis
    if (conditions.includes('rain')) {
        if (conditions.includes('heavy')) {
            score -= 2;
            factors.push('Heavy rain makes hunting challenging');
            recommendations.push('Consider postponing hunt or finding shelter');
        } else {
            score -= 0.5;
            factors.push('Light rain can actually improve scent conditions');
            recommendations.push('Ensure dogs have proper protection');
        }
    } else if (conditions.includes('snow')) {
        if (huntType === 'upland') {
            factors.push('Snow can help track birds and improve visibility');
        } else {
            score -= 0.5;
            factors.push('Snow conditions require extra preparation');
        }
        recommendations.push('Check ice conditions, ensure dog paw protection');
    } else if (conditions.includes('fog')) {
        score -= 1;
        factors.push('Fog reduces visibility and may affect dog performance');
        recommendations.push('Stay close to dogs, use bells or GPS collars');
    }
    
    // Humidity analysis
    if (humidity > 85) {
        score -= 0.5;
        factors.push('High humidity may affect scent conditions');
    } else if (humidity < 30) {
        score -= 0.5;
        factors.push('Low humidity may reduce scent retention');
    }
    
    // Determine overall rating
    score = Math.max(1, Math.min(5, Math.round(score * 2) / 2)); // Round to nearest 0.5
    
    let rating;
    if (score >= 4.5) rating = 'Excellent';
    else if (score >= 3.5) rating = 'Good';
    else if (score >= 2.5) rating = 'Fair';
    else if (score >= 1.5) rating = 'Poor';
    else rating = 'Not Recommended';
    
    return {
        overall_score: score,
        rating: rating,
        hunt_type: huntType,
        factors: factors,
        recommendations: recommendations,
        best_times: getBestHuntingTimes(weatherData, huntType),
        equipment_suggestions: getEquipmentSuggestions(weatherData, huntType)
    };
}

function getBestHuntingTimes(weatherData, huntType) {
    const sunrise = new Date(weatherData.sunrise);
    const sunset = new Date(weatherData.sunset);
    
    const times = [
        {
            period: 'Early Morning',
            start: new Date(sunrise.getTime() - 30 * 60000), // 30 min before sunrise
            end: new Date(sunrise.getTime() + 90 * 60000),   // 90 min after sunrise
            rating: 'Excellent',
            reason: 'Cool temperatures, active game movement'
        },
        {
            period: 'Late Afternoon',
            start: new Date(sunset.getTime() - 120 * 60000), // 2 hours before sunset
            end: new Date(sunset.getTime() + 30 * 60000),    // 30 min after sunset
            rating: 'Good',
            reason: 'Game movement increases as temperature cools'
        }
    ];
    
    if (weatherData.temperature < 75) {
        times.push({
            period: 'Midday',
            start: new Date(sunrise.getTime() + 4 * 60 * 60000), // 4 hours after sunrise
            end: new Date(sunset.getTime() - 3 * 60 * 60000),   // 3 hours before sunset
            rating: 'Fair',
            reason: 'Acceptable temperatures for hunting'
        });
    }
    
    return times;
}

function getEquipmentSuggestions(weatherData, huntType) {
    const suggestions = [];
    const temp = weatherData.temperature;
    const conditions = weatherData.conditions.toLowerCase();
    const windSpeed = weatherData.wind_speed;
    
    // Temperature-based suggestions
    if (temp < 32) {
        suggestions.push('Dog boots for paw protection on ice/snow');
        suggestions.push('Dog coat or vest for extended hunts');
        suggestions.push('Extra water (dogs need more in cold weather)');
    } else if (temp > 70) {
        suggestions.push('Extra water for dog hydration');
        suggestions.push('Portable shade or cooling vest');
        suggestions.push('Electrolyte supplements');
    }
    
    // Weather condition suggestions
    if (conditions.includes('rain')) {
        suggestions.push('Waterproof dog collar/GPS unit');
        suggestions.push('Towels for drying dogs');
        suggestions.push('Waterproof gear bag');
    }
    
    if (windSpeed > 15) {
        suggestions.push('GPS collar or tracking device');
        suggestions.push('Dog whistle (voice commands may not carry)');
    }
    
    if (conditions.includes('fog')) {
        suggestions.push('Bell or beeper collar for dog location');
        suggestions.push('GPS tracking device essential');
        suggestions.push('Bright colored dog vest');
    }
    
    // Hunt type specific
    if (huntType === 'waterfowl') {
        suggestions.push('Neoprene dog vest for cold water');
        suggestions.push('Dog decoy for training');
    } else if (huntType === 'upland') {
        suggestions.push('Snake boots/gaiters if applicable');
        suggestions.push('First aid kit for cuts from cover');
    }
    
    return suggestions;
}

// Utility functions
function validateGPSCoordinates(lat, lng) {
    return (
        typeof lat === 'number' && typeof lng === 'number' &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180 &&
        !isNaN(lat) && !isNaN(lng)
    );
}

function getWeatherDescription(condition) {
    const descriptions = {
        'Clear': 'Clear skies',
        'Partly Cloudy': 'Partly cloudy with some sun',
        'Overcast': 'Overcast skies',
        'Light Rain': 'Light rain showers',
        'Heavy Rain': 'Heavy rainfall',
        'Snow': 'Snow showers',
        'Fog': 'Foggy conditions'
    };
    return descriptions[condition] || condition;
}

function getSunrise(lat, lng) {
    // Simplified sunrise calculation for demo
    const now = new Date();
    const sunrise = new Date(now);
    sunrise.setHours(6, 30, 0, 0); // Approximate sunrise
    return sunrise.toISOString();
}

function getSunset(lat, lng) {
    // Simplified sunset calculation for demo
    const now = new Date();
    const sunset = new Date(now);
    sunset.setHours(18, 30, 0, 0); // Approximate sunset
    return sunset.toISOString();
}

function getHuntingImpact(alertType) {
    const impacts = {
        'severe_weather': 'High - postpone hunt for safety',
        'high_wind': 'Moderate - affects scent conditions',
        'fog': 'Moderate - reduces visibility'
    };
    return impacts[alertType] || 'Monitor conditions';
}

function getHuntingRecommendations(alertType) {
    const recommendations = {
        'severe_weather': ['Stay indoors until conditions improve', 'Monitor weather updates'],
        'high_wind': ['Hunt in sheltered areas', 'Use GPS collars on dogs'],
        'fog': ['Stay close to dogs', 'Use audible signals']
    };
    return recommendations[alertType] || ['Monitor conditions closely'];
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function successResponse(data) {
    return new Response(JSON.stringify({
        success: true,
        data
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

function errorResponse(message, status = 500) {
    return new Response(JSON.stringify({
        success: false,
        error: message
    }), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}