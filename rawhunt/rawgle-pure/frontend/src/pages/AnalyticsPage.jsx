import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePets } from '../hooks/usePets';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  HeartIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { analyticsService } from '../services/api';
import { formatDate, getPetTypeIcon } from '../utils/helpers';

const AnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const selectedPetId = searchParams.get('pet');
  
  const { pets, isLoading: petsLoading } = usePets();
  
  const [analyticsData, setAnalyticsData] = useState({
    healthTrends: [],
    feedingInsights: [],
    overviewStats: {},
    isLoading: true,
  });
  
  const [selectedPet, setSelectedPet] = useState(null);
  const [timePeriod, setTimePeriod] = useState('30'); // days

  useEffect(() => {
    if (pets.length > 0) {
      const pet = selectedPetId 
        ? pets.find(p => p.pet_id === parseInt(selectedPetId))
        : pets[0];
      
      if (pet) {
        setSelectedPet(pet);
        loadAnalytics(pet.pet_id);
      }
    }
  }, [pets, selectedPetId, timePeriod]);

  const loadAnalytics = async (petId) => {
    try {
      setAnalyticsData(prev => ({ ...prev, isLoading: true }));
      
      const [healthTrends, feedingInsights, petAnalytics] = await Promise.all([
        analyticsService.getHealthTrends(petId, timePeriod),
        analyticsService.getFeedingInsights(petId),
        analyticsService.getPetAnalytics(petId),
      ]);

      setAnalyticsData({
        healthTrends: healthTrends.trends || [],
        feedingInsights: feedingInsights.insights || {},
        overviewStats: petAnalytics.stats || {},
        isLoading: false,
      });
    } catch (err) {
      console.error('Error loading analytics:', err);
      setAnalyticsData({
        healthTrends: [],
        feedingInsights: {},
        overviewStats: {},
        isLoading: false,
      });
    }
  };

  // Mock data for demonstration
  const mockHealthTrends = [
    { date: '2024-01-01', weight: 25.5, activity: 8, mood: 9 },
    { date: '2024-01-08', weight: 25.3, activity: 7, mood: 8 },
    { date: '2024-01-15', weight: 25.1, activity: 9, mood: 9 },
    { date: '2024-01-22', weight: 25.0, activity: 8, mood: 8 },
    { date: '2024-01-29', weight: 24.8, activity: 9, mood: 9 },
  ];

  const mockFeedingData = [
    { name: 'Dry Food', value: 65, color: '#f59e0b' },
    { name: 'Wet Food', value: 25, color: '#3b82f6' },
    { name: 'Treats', value: 8, color: '#10b981' },
    { name: 'Supplements', value: 2, color: '#8b5cf6' },
  ];

  const mockActivityData = [
    { day: 'Mon', feedings: 3, walks: 2, playtime: 45 },
    { day: 'Tue', feedings: 3, walks: 1, playtime: 30 },
    { day: 'Wed', feedings: 2, walks: 2, playtime: 60 },
    { day: 'Thu', feedings: 3, walks: 2, playtime: 40 },
    { day: 'Fri', feedings: 3, walks: 3, playtime: 75 },
    { day: 'Sat', feedings: 2, walks: 2, playtime: 90 },
    { day: 'Sun', feedings: 3, walks: 2, playtime: 50 },
  ];

  if (petsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="text-center py-16">
        <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No pets found</h3>
        <p className="text-gray-600 mb-6">Add a pet and start logging activities to see analytics.</p>
        <a href="/pets/add" className="btn-primary">
          Add Your First Pet
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pet Analytics</h1>
          <p className="text-gray-600 mt-1">
            Insights and trends for your pet's health and activities
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pet</label>
            <select
              className="input-field"
              value={selectedPet?.pet_id || ''}
              onChange={(e) => {
                const pet = pets.find(p => p.pet_id === parseInt(e.target.value));
                setSelectedPet(pet);
                if (pet) loadAnalytics(pet.pet_id);
              }}
            >
              {pets.map((pet) => (
                <option key={pet.pet_id} value={pet.pet_id}>
                  {pet.name} ({pet.breed})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <select
              className="input-field"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {analyticsData.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-3">
                <HeartIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">Healthy</div>
              <p className="text-sm text-gray-600">Overall Status</p>
            </div>
            
            <div className="card p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-secondary-100 rounded-lg mx-auto mb-3">
                <CameraIcon className="w-6 h-6 text-secondary-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">18</div>
              <p className="text-sm text-gray-600">Total Feedings</p>
            </div>
            
            <div className="card p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-accent-100 rounded-lg mx-auto mb-3">
                <ArrowTrendingUpIcon className="w-6 h-6 text-accent-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">95%</div>
              <p className="text-sm text-gray-600">Consistency Score</p>
            </div>
            
            <div className="card p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">24.8kg</div>
              <p className="text-sm text-gray-600">Current Weight</p>
            </div>
          </div>

          {/* Health Trends Chart */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Trends</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockHealthTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => formatDate(value)}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Weight (kg)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activity" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Activity Level"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Mood Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feeding Distribution */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Food Type Distribution</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockFeedingData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {mockFeedingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center mt-4 space-x-4">
                {mockFeedingData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Activity */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="feedings" fill="#f59e0b" name="Feedings" />
                    <Bar dataKey="walks" fill="#3b82f6" name="Walks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">📈 Positive Trends</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Weight is trending down in a healthy range</li>
                  <li>• Activity levels are consistently high</li>
                  <li>• Feeding schedule is very consistent</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">💡 Recommendations</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Continue current feeding schedule</li>
                  <li>• Consider adding more variety to treats</li>
                  <li>• Monitor weight weekly for continued progress</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;