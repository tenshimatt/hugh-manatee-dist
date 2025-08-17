/**
 * GPS Service
 * Handles GPS data processing, geocoding, and location utilities
 */

export class GPSService {
    constructor(env) {
        this.env = env;
        this.db = env.DB;
        this.cache = env.CACHE;
        this.geocodingApiKey = env.GEOCODING_API_KEY;
    }

    // Parse GPX file and extract track data
    async parseGPX(request) {
        try {
            const body = await request.json();
            const { gpxData } = body;

            if (!gpxData) {
                return this.errorResponse('GPX data is required', 400);
            }

            const trackData = this.extractGPXTrackData(gpxData);
            
            if (!trackData.points || trackData.points.length === 0) {
                return this.errorResponse('No valid track points found in GPX data', 400);
            }

            const metrics = this.calculateTrackMetrics(trackData.points);
            const elevationProfile = this.generateElevationProfile(trackData.points);
            const bounds = this.calculateBounds(trackData.points);

            return this.successResponse({
                metadata: trackData.metadata,
                points: trackData.points,
                metrics: {
                    totalDistance: metrics.totalDistance,
                    elevationGain: metrics.elevationGain,
                    elevationLoss: metrics.elevationLoss,
                    minElevation: metrics.minElevation,
                    maxElevation: metrics.maxElevation,
                    duration: metrics.duration,
                    avgSpeed: metrics.avgSpeed,
                    maxSpeed: metrics.maxSpeed
                },
                elevationProfile,
                bounds,
                summary: {
                    pointCount: trackData.points.length,
                    startTime: trackData.points[0]?.timestamp,
                    endTime: trackData.points[trackData.points.length - 1]?.timestamp,
                    startLocation: {
                        lat: trackData.points[0]?.lat,
                        lng: trackData.points[0]?.lng
                    },
                    endLocation: {
                        lat: trackData.points[trackData.points.length - 1]?.lat,
                        lng: trackData.points[trackData.points.length - 1]?.lng
                    }
                }
            });

        } catch (error) {
            console.error('Parse GPX error:', error);
            return this.errorResponse('Failed to parse GPX data', 500);
        }
    }

    // Geocode address to coordinates
    async geocode(request) {
        try {
            const body = await request.json();
            const { address } = body;

            if (!address) {
                return this.errorResponse('Address is required', 400);
            }

            // Check cache first
            const cacheKey = `geocode:${address.toLowerCase()}`;
            let result = null;

            if (this.cache) {
                const cached = await this.cache.get(cacheKey);
                if (cached) {
                    result = JSON.parse(cached);
                }
            }

            if (!result) {
                // Use a geocoding service (placeholder implementation)
                result = await this.performGeocode(address);
                
                // Cache result for 24 hours
                if (this.cache && result) {
                    await this.cache.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 });
                }
            }

            if (!result) {
                return this.errorResponse('Address not found', 404);
            }

            return this.successResponse(result);

        } catch (error) {
            console.error('Geocode error:', error);
            return this.errorResponse('Failed to geocode address', 500);
        }
    }

    // Reverse geocode coordinates to address
    async reverseGeocode(request) {
        try {
            const { lat, lng } = request.query;

            if (!lat || !lng) {
                return this.errorResponse('Latitude and longitude are required', 400);
            }

            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);

            if (latitude < -90 || latitude > 90) {
                return this.errorResponse('Invalid latitude', 400);
            }

            if (longitude < -180 || longitude > 180) {
                return this.errorResponse('Invalid longitude', 400);
            }

            // Check cache first
            const cacheKey = `reverse:${latitude.toFixed(6)},${longitude.toFixed(6)}`;
            let result = null;

            if (this.cache) {
                const cached = await this.cache.get(cacheKey);
                if (cached) {
                    result = JSON.parse(cached);
                }
            }

            if (!result) {
                // Use a reverse geocoding service (placeholder implementation)
                result = await this.performReverseGeocode(latitude, longitude);
                
                // Cache result for 24 hours
                if (this.cache && result) {
                    await this.cache.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 });
                }
            }

            if (!result) {
                return this.errorResponse('Location not found', 404);
            }

            return this.successResponse(result);

        } catch (error) {
            console.error('Reverse geocode error:', error);
            return this.errorResponse('Failed to reverse geocode coordinates', 500);
        }
    }

    // Calculate distance between two points
    async calculateDistance(request) {
        try {
            const body = await request.json();
            const { points } = body;

            if (!points || !Array.isArray(points) || points.length < 2) {
                return this.errorResponse('At least two points are required', 400);
            }

            let totalDistance = 0;
            const segments = [];

            for (let i = 1; i < points.length; i++) {
                const distance = this.haversineDistance(points[i - 1], points[i]);
                totalDistance += distance;
                segments.push({
                    from: points[i - 1],
                    to: points[i],
                    distance: distance
                });
            }

            return this.successResponse({
                totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
                segments,
                pointCount: points.length
            });

        } catch (error) {
            console.error('Calculate distance error:', error);
            return this.errorResponse('Failed to calculate distance', 500);
        }
    }

    // Find nearby points of interest
    async findNearbyPOI(request) {
        try {
            const { lat, lng, radius = 10, types } = request.query;

            if (!lat || !lng) {
                return this.errorResponse('Latitude and longitude are required', 400);
            }

            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            const radiusKm = parseFloat(radius);

            // In production, this would query a POI database or external API
            const mockPOIs = [
                {
                    id: '1',
                    name: 'Wildlife Management Area',
                    type: 'hunting_area',
                    latitude: latitude + 0.01,
                    longitude: longitude + 0.01,
                    distance: 1.2,
                    description: 'Public hunting area with waterfowl and upland game'
                },
                {
                    id: '2',
                    name: 'Boat Launch',
                    type: 'access_point',
                    latitude: latitude - 0.005,
                    longitude: longitude + 0.015,
                    distance: 2.1,
                    description: 'Public boat launch with parking'
                }
            ];

            return this.successResponse({
                center: { lat: latitude, lng: longitude },
                radius: radiusKm,
                pois: mockPOIs
            });

        } catch (error) {
            console.error('Find nearby POI error:', error);
            return this.errorResponse('Failed to find nearby points of interest', 500);
        }
    }

    // Extract track data from GPX content
    extractGPXTrackData(gpxData) {
        const points = [];
        const metadata = {};

        try {
            // Extract metadata
            const nameMatch = gpxData.match(/<name[^>]*>([^<]*)<\/name>/);
            if (nameMatch) metadata.name = nameMatch[1];

            const descMatch = gpxData.match(/<desc[^>]*>([^<]*)<\/desc>/);
            if (descMatch) metadata.description = descMatch[1];

            // Extract track points
            const trkptRegex = /<trkpt[^>]*lat="([^"]*)"[^>]*lon="([^"]*)"[^>]*>([\s\S]*?)<\/trkpt>/g;
            let match;

            while ((match = trkptRegex.exec(gpxData)) !== null) {
                const lat = parseFloat(match[1]);
                const lng = parseFloat(match[2]);
                const content = match[3];

                const point = { lat, lng };

                // Extract elevation
                const eleMatch = content.match(/<ele>([^<]*)<\/ele>/);
                if (eleMatch) point.elevation = parseFloat(eleMatch[1]);

                // Extract timestamp
                const timeMatch = content.match(/<time>([^<]*)<\/time>/);
                if (timeMatch) point.timestamp = new Date(timeMatch[1]);

                points.push(point);
            }

        } catch (error) {
            console.error('GPX parsing error:', error);
        }

        return { points, metadata };
    }

    // Calculate track metrics
    calculateTrackMetrics(points) {
        if (points.length < 2) {
            return {
                totalDistance: 0,
                elevationGain: 0,
                elevationLoss: 0,
                minElevation: null,
                maxElevation: null,
                duration: 0,
                avgSpeed: 0,
                maxSpeed: 0
            };
        }

        let totalDistance = 0;
        let elevationGain = 0;
        let elevationLoss = 0;
        let minElevation = points[0].elevation || 0;
        let maxElevation = points[0].elevation || 0;
        let maxSpeed = 0;

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];

            // Calculate distance
            const distance = this.haversineDistance(prev, curr);
            totalDistance += distance;

            // Calculate elevation changes
            if (prev.elevation !== undefined && curr.elevation !== undefined) {
                const elevationChange = curr.elevation - prev.elevation;
                if (elevationChange > 0) {
                    elevationGain += elevationChange;
                } else {
                    elevationLoss += Math.abs(elevationChange);
                }

                minElevation = Math.min(minElevation, curr.elevation);
                maxElevation = Math.max(maxElevation, curr.elevation);
            }

            // Calculate speed if timestamps available
            if (prev.timestamp && curr.timestamp) {
                const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
                if (timeDiff > 0) {
                    const speed = (distance * 1000) / timeDiff; // m/s
                    maxSpeed = Math.max(maxSpeed, speed * 3.6); // km/h
                }
            }
        }

        const duration = points[0].timestamp && points[points.length - 1].timestamp ?
            (points[points.length - 1].timestamp - points[0].timestamp) / 1000 / 3600 : 0; // hours

        const avgSpeed = duration > 0 ? totalDistance / duration : 0;

        return {
            totalDistance: Math.round(totalDistance * 100) / 100,
            elevationGain: Math.round(elevationGain),
            elevationLoss: Math.round(elevationLoss),
            minElevation: Math.round(minElevation),
            maxElevation: Math.round(maxElevation),
            duration: Math.round(duration * 100) / 100,
            avgSpeed: Math.round(avgSpeed * 100) / 100,
            maxSpeed: Math.round(maxSpeed * 100) / 100
        };
    }

    // Generate elevation profile
    generateElevationProfile(points) {
        const profile = [];
        let cumulativeDistance = 0;

        for (let i = 0; i < points.length; i++) {
            if (i > 0) {
                cumulativeDistance += this.haversineDistance(points[i - 1], points[i]);
            }

            if (points[i].elevation !== undefined) {
                profile.push({
                    distance: Math.round(cumulativeDistance * 100) / 100,
                    elevation: Math.round(points[i].elevation)
                });
            }
        }

        return profile;
    }

    // Calculate bounds of track points
    calculateBounds(points) {
        if (points.length === 0) return null;

        let minLat = points[0].lat;
        let maxLat = points[0].lat;
        let minLng = points[0].lng;
        let maxLng = points[0].lng;

        for (const point of points) {
            minLat = Math.min(minLat, point.lat);
            maxLat = Math.max(maxLat, point.lat);
            minLng = Math.min(minLng, point.lng);
            maxLng = Math.max(maxLng, point.lng);
        }

        return {
            southwest: { lat: minLat, lng: minLng },
            northeast: { lat: maxLat, lng: maxLng },
            center: {
                lat: (minLat + maxLat) / 2,
                lng: (minLng + maxLng) / 2
            }
        };
    }

    // Haversine distance calculation
    haversineDistance(point1, point2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(point2.lat - point1.lat);
        const dLng = this.toRadians(point2.lng - point1.lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                 Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
                 Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Placeholder geocoding implementation
    async performGeocode(address) {
        // In production, use a real geocoding service like Google Maps, MapBox, etc.
        const mockResults = [
            {
                formattedAddress: '123 Hunting Lodge Rd, Wilderness, State 12345',
                latitude: 45.1234,
                longitude: -93.5678,
                components: {
                    streetNumber: '123',
                    streetName: 'Hunting Lodge Rd',
                    city: 'Wilderness',
                    state: 'State',
                    postalCode: '12345',
                    country: 'United States'
                },
                confidence: 0.95
            }
        ];

        return {
            query: address,
            results: mockResults
        };
    }

    // Placeholder reverse geocoding implementation
    async performReverseGeocode(latitude, longitude) {
        // In production, use a real reverse geocoding service
        return {
            latitude,
            longitude,
            formattedAddress: 'Wilderness Area, State Forest, State 12345',
            components: {
                locality: 'Wilderness Area',
                adminArea: 'State Forest',
                state: 'State',
                postalCode: '12345',
                country: 'United States'
            }
        };
    }

    // Helper methods
    successResponse(data) {
        return new Response(JSON.stringify({
            success: true,
            data
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    errorResponse(message, status = 400) {
        return new Response(JSON.stringify({
            success: false,
            error: message
        }), {
            status,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}