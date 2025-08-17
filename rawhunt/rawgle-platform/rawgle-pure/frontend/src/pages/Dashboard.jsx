import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HeartIcon,
  PlusIcon,
  CameraIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { petService, pawsService, feedingService, aiMedicalService } from '../services/api';
import { formatPawsAmount, formatDate, calculateAge, getPetTypeIcon } from '../utils/helpers';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    pets: [],
    pawsBalance: 0,
    recentFeeding: [],
    emergencyAlerts: [],
    isLoading: true,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [petsData, pawsData, emergencyAlerts] = await Promise.all([
        petService.getPets(),
        pawsService.getBalance(),
        aiMedicalService.getEmergencyAlerts(),
      ]);

      setDashboardData({
        pets: petsData.pets || [],
        pawsBalance: pawsData.balance || 0,
        emergencyAlerts: emergencyAlerts.alerts || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const quickActions = [
    {
      name: 'Add Pet',
      href: '/pets/add',
      icon: PlusIcon,
      color: 'bg-primary-500 hover:bg-primary-600',
      description: 'Register a new pet',
    },
    {
      name: 'Log Feeding',
      href: '/feeding',
      icon: CameraIcon,
      color: 'bg-secondary-500 hover:bg-secondary-600',
      description: 'Record feeding activity',
    },
    {
      name: 'AI Consultation',
      href: '/ai-medical',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-accent-500 hover:bg-accent-600',
      description: 'Get health advice',
    },
    {
      name: 'View Analytics',
      href: '/analytics',
      icon: ChartBarIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Health insights',
    },
  ];

  if (dashboardData.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl text-white p-6">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Pet Parent'}! 👋
        </h1>
        <p className="text-primary-100">
          Here's what's happening with your pets today.
        </p>
      </div>

      {/* Emergency Alerts */}
      {dashboardData.emergencyAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="font-semibold text-red-800">Emergency Alerts</h3>
          </div>
          <div className="space-y-2">
            {dashboardData.emergencyAlerts.map((alert, index) => (
              <div key={index} className="text-sm text-red-700">
                <strong>{alert.pet_name}:</strong> {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <HeartIcon className="w-8 h-8 text-primary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Pets</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.pets.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-8 h-8 text-accent-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">PAWS Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPawsAmount(dashboardData.pawsBalance)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <CameraIcon className="w-8 h-8 text-secondary-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Feedings This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData.recentFeeding.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <PhotoIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">NFTs Collected</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className={`${action.color} text-white p-4 rounded-lg text-center transition-colors duration-200`}
            >
              <action.icon className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">{action.name}</p>
              <p className="text-xs opacity-90 mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Pets */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Pets</h2>
            <Link
              to="/pets/add"
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              Add Pet
            </Link>
          </div>

          {dashboardData.pets.length === 0 ? (
            <div className="text-center py-8">
              <HeartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pets yet</h3>
              <p className="text-gray-600 mb-4">Start by adding your first pet to get started!</p>
              <Link to="/pets/add" className="btn-primary">
                Add Your First Pet
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.pets.slice(0, 3).map((pet) => (
                <div key={pet.pet_id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                  <div className="text-2xl">{getPetTypeIcon(pet.pet_type)}</div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{pet.name}</h3>
                    <p className="text-sm text-gray-600">
                      {pet.breed} • {calculateAge(pet.birth_date)}
                    </p>
                  </div>
                  <Link
                    to={`/pets/${pet.pet_id}`}
                    className="text-primary-600 hover:text-primary-500 text-sm"
                  >
                    View
                  </Link>
                </div>
              ))}
              {dashboardData.pets.length > 3 && (
                <Link
                  to="/pets"
                  className="block text-center text-primary-600 hover:text-primary-500 text-sm font-medium pt-2"
                >
                  View all {dashboardData.pets.length} pets
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Welcome bonus PAWS earned</p>
                <p className="text-xs text-gray-500">Just now</p>
              </div>
              <span className="text-sm font-medium text-green-600">+100 PAWS</span>
            </div>

            {dashboardData.pets.length > 0 && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Account created</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
              </div>
            )}

            {dashboardData.pets.length === 0 && (
              <div className="text-center py-8">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Your recent activity will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Getting Started Guide */}
      {dashboardData.pets.length === 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Add Your First Pet</h3>
                <p className="text-sm text-gray-600">Create a profile with basic information about your pet</p>
                <Link to="/pets/add" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                  Add pet →
                </Link>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Log Daily Feeding</h3>
                <p className="text-sm text-gray-600">Track feeding times and earn PAWS rewards</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Get AI Health Advice</h3>
                <p className="text-sm text-gray-600">Use our AI consultant for health questions</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;