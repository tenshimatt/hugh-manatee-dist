import React, { useState, useEffect, createContext, useContext } from 'react';
import { Search, MapPin, Brain, Coins, Heart, Calendar, Star, Trophy, AlertTriangle, Send, Plus } from 'lucide-react';

// API Configuration
const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';

// API Service Layer
class RawgleAPI {
  constructor() {
    this.token = localStorage.getItem('rawgle_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('rawgle_token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('rawgle_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Pet Management
  async createPet(petData) {
    return this.request('/api/pets', {
      method: 'POST',
      body: JSON.stringify(petData),
    });
  }

  async getPets() {
    return this.request('/api/pets');
  }

  async getPet(petId) {
    return this.request(`/api/pets/${petId}`);
  }

  // PAWS System
  async getPAWSBalance(userId) {
    return this.request(`/api/paws/balance?userId=${userId}`);
  }

  async getPAWSAnalytics(timeframe = '30d') {
    return this.request(`/api/analytics/paws?timeframe=${timeframe}`);
  }

  // Feeding System
  async logFeeding(feedingData) {
    return this.request('/api/feeding', {
      method: 'POST',
      body: JSON.stringify(feedingData),
    });
  }

  async getFeedingLogs(petId) {
    return this.request(`/api/feeding/${petId}`);
  }

  async getFeedingStreak(petId) {
    return this.request(`/api/feeding/streak/${petId}`);
  }

  async getWeeklyBonusCheck() {
    return this.request('/api/paws/weekly-bonus-check');
  }

  // AI Medical Consultations
  async submitMedicalConsultation(consultationData) {
    return this.request('/api/ai-medical', {
      method: 'POST',
      body: JSON.stringify(consultationData),
    });
  }

  async getConsultationHistory(petId) {
    return this.request(`/api/ai-medical/history/${petId}`);
  }

  // NFT System
  async getNFTMintCost() {
    return this.request('/api/nft/mint-cost');
  }

  async mintNFT(nftData) {
    return this.request('/api/nft/mint', {
      method: 'POST',
      body: JSON.stringify(nftData),
    });
  }

  async getNFTCollection(userId) {
    return this.request(`/api/nft/collection/${userId}`);
  }

  // Subscription System
  async getSubscriptionStatus() {
    return this.request('/api/subscription/status');
  }

  async getSubscriptionBenefits() {
    return this.request('/api/subscription/benefits');
  }

  async getSubscriptionTiers() {
    return this.request('/api/subscription/tiers');
  }

  async upgradeSubscription(subscriptionData) {
    return this.request('/api/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  }

  // User Profile
  async getUserProfile() {
    return this.request('/api/user/profile');
  }

  async updateUserProfile(profileData) {
    return this.request('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Analytics Dashboard
  async getDashboardAnalytics() {
    return this.request('/api/analytics/dashboard');
  }

  async getPetAnalytics(petId, timeframe = '30d') {
    return this.request(`/api/analytics/pet/${petId}?timeframe=${timeframe}`);
  }

  async getPremiumAnalytics() {
    return this.request('/api/analytics/premium-insights');
  }

  // Feeding Overview
  async getFeedingOverview(timeframe = '7d') {
    return this.request(`/api/feeding/overview?timeframe=${timeframe}`);
  }

  async getWeeklySummary(petId) {
    return this.request(`/api/feeding/weekly-summary?petId=${petId}`);
  }

  // Supplier System (Future API)
  async searchSuppliers(query, location) {
    // Mock supplier search - replace with real supplier API when available
    return this.mockSupplierSearch(query, location);
  }

  async getSupplierDetails(supplierId) {
    // Mock supplier details - replace with real API
    return this.mockSupplierDetails(supplierId);
  }

  // Mock Methods (to be replaced with real APIs)
  mockSupplierSearch(query, location) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          suppliers: [
            {
              id: 1,
              name: "Premium Pet Foods",
              rating: 4.8,
              reviewCount: 156,
              distance: "1.2 miles",
              specialties: ["Raw Beef", "Organic"],
              price: "From $18/lb",
              address: "123 Pet Street, City, State",
              coordinates: { lat: 40.7128, lng: -74.0060 }
            },
            {
              id: 2,
              name: "Natural Nutrition Co",
              rating: 4.9,
              reviewCount: 243,
              distance: "2.1 miles",
              specialties: ["Freeze-Dried", "Fish"],
              price: "From $22/lb",
              address: "456 Raw Ave, City, State",
              coordinates: { lat: 40.7589, lng: -73.9851 }
            },
            {
              id: 3,
              name: "Raw Pet Supply",
              rating: 4.7,
              reviewCount: 89,
              distance: "3.4 miles",
              specialties: ["Raw Chicken", "Supplements"],
              price: "From $16/lb",
              address: "789 Dog Food Blvd, City, State",
              coordinates: { lat: 40.6782, lng: -73.9442 }
            }
          ]
        });
      }, 1000);
    });
  }

  mockSupplierDetails(supplierId) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          id: supplierId,
          name: "Premium Pet Foods",
          rating: 4.8,
          reviewCount: 156,
          address: "123 Pet Street, City, State",
          phone: "(555) 123-4567",
          hours: "Mon-Fri 9AM-7PM, Sat-Sun 10AM-6PM",
          products: [
            { name: "Raw Beef Blend", price: "$18/lb", inStock: true },
            { name: "Organic Chicken", price: "$16/lb", inStock: true },
            { name: "Fish Medley", price: "$22/lb", inStock: false }
          ],
          reviews: [
            { id: 1, author: "Dog Owner", rating: 5, text: "Great quality food!" },
            { id: 2, author: "Pet Parent", rating: 4, text: "My dog loves it" }
          ]
        });
      }, 500);
    });
  }
}

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const api = new RawgleAPI();

  useEffect(() => {
    const token = localStorage.getItem('rawgle_token');
    if (token) {
      api.setToken(token);
      // Verify token and get user data
      api.getUserProfile()
        .then(profile => setUser(profile))
        .catch(() => {
          api.removeToken();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const response = await api.login(credentials);
    api.setToken(response.sessionToken);
    const profile = await api.getUserProfile();
    setUser(profile);
    return response;
  };

  const register = async (userData) => {
    const response = await api.register(userData);
    // Auto-login after registration
    const loginResponse = await api.login({
      email: userData.email,
      password: userData.password
    });
    api.setToken(loginResponse.sessionToken);
    const profile = await api.getUserProfile();
    setUser(profile);
    return response;
  };

  const logout = () => {
    api.removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, api }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Custom Hooks for Data Fetching
const usePAWSBalance = () => {
  const { user, api } = useAuth();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getPAWSBalance(user.userId)
        .then(setBalance)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  return { balance: balance?.balance || 0, loading };
};

const usePets = () => {
  const { user, api } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getPets()
        .then(data => setPets(data.pets || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const createPet = async (petData) => {
    const response = await api.createPet(petData);
    setPets(prev => [...prev, response.pet]);
    return response;
  };

  return { pets, createPet, loading };
};

const useNFTCollection = () => {
  const { user, api } = useAuth();
  const [nfts, setNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mintCost, setMintCost] = useState(null);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.getNFTCollection(user.userId),
        api.getNFTMintCost()
      ]).then(([nftData, costData]) => {
        setNFTs(nftData.nfts || []);
        setMintCost(costData);
      }).catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const mintNFT = async (nftData) => {
    const response = await api.mintNFT(nftData);
    setNFTs(prev => [...prev, response.nft]);
    return response;
  };

  return { nfts, mintNFT, mintCost, loading };
};

const useFeedingData = (petId) => {
  const { api } = useAuth();
  const [feedingLogs, setFeedingLogs] = useState([]);
  const [streak, setStreak] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (petId) {
      Promise.all([
        api.getFeedingLogs(petId),
        api.getFeedingStreak(petId),
        api.getWeeklySummary(petId)
      ]).then(([logs, streakData, summary]) => {
        setFeedingLogs(logs.logs || []);
        setStreak(streakData);
        setWeeklySummary(summary);
      }).catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [petId]);

  const logFeeding = async (feedingData) => {
    const response = await api.logFeeding({ ...feedingData, petId });
    setFeedingLogs(prev => [response.log, ...prev]);
    setStreak(response.streakData);
    return response;
  };

  return { feedingLogs, streak, weeklySummary, logFeeding, loading };
};

const useSubscription = () => {
  const { api } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [benefits, setBenefits] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getSubscriptionStatus(),
      api.getSubscriptionBenefits(),
      api.getSubscriptionTiers()
    ]).then(([status, benefitsData, tiersData]) => {
      setSubscription(status);
      setBenefits(benefitsData.benefits);
      setTiers(tiersData.tiers || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const upgradeSubscription = async (upgradeData) => {
    const response = await api.upgradeSubscription(upgradeData);
    setSubscription(response.subscription);
    return response;
  };

  return { subscription, benefits, tiers, upgradeSubscription, loading };
};

const useSuppliers = () => {
  const { api } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const searchSuppliers = async (query, location) => {
    setLoading(true);
    try {
      const response = await api.searchSuppliers(query, location);
      setSuppliers(response.suppliers || []);
      return response;
    } catch (error) {
      console.error('Supplier search failed:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const getSupplierDetails = async (supplierId) => {
    try {
      const details = await api.getSupplierDetails(supplierId);
      setSelectedSupplier(details);
      return details;
    } catch (error) {
      console.error('Failed to get supplier details:', error);
    }
  };

  return { suppliers, selectedSupplier, searchSuppliers, getSupplierDetails, loading };
};

const useAnalytics = () => {
  const { user, api } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [pawsAnalytics, setPawsAnalytics] = useState(null);
  const [premiumInsights, setPremiumInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.getDashboardAnalytics(),
        api.getPAWSAnalytics('30d')
      ]).then(([dashboard, paws]) => {
        setDashboardData(dashboard);
        setPawsAnalytics(paws);
        
        // Load premium insights if user has premium
        if (dashboard.isPremium) {
          api.getPremiumAnalytics()
            .then(setPremiumInsights)
            .catch(console.error);
        }
      }).catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  return { dashboardData, pawsAnalytics, premiumInsights, loading };
};

// Connected Components

// Login Component
const LoginForm = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        await register({ ...credentials, name: credentials.email.split('@')[0] });
      } else {
        await login(credentials);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Rawgle</h1>
          <p className="text-gray-600">
            {isRegistering ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !credentials.email || !credentials.password}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>

          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Connected PAWS Balance Component
const ConnectedPAWSBalance = () => {
  const { balance, loading } = usePAWSBalance();
  const { api } = useAuth();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.getPAWSAnalytics('7d')
      .then(setAnalytics)
      .catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6" />
          <h2 className="text-lg font-bold">PAWS Balance</h2>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold mb-1">{balance.toLocaleString()}</div>
        <div className="text-amber-100 text-sm">Total PAWS</div>
      </div>
      
      {analytics && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-lg font-semibold">+{analytics.totalEarned || 0}</div>
            <div className="text-amber-100 text-xs">This Week</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{analytics.transactions?.length || 0}</div>
            <div className="text-amber-100 text-xs">Transactions</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Connected Pet Profiles Component
const ConnectedPetProfiles = () => {
  const { pets, createPet, loading } = usePets();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPet, setNewPet] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    gender: 'male',
    activityLevel: 'moderate'
  });

  const handleCreatePet = async () => {
    try {
      await createPet(newPet);
      setNewPet({ name: '', breed: '', age: '', weight: '', gender: 'male', activityLevel: 'moderate' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create pet:', error);
    }
  };

  if (loading) {
    return <div className="bg-gray-200 animate-pulse rounded-xl h-48"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">My Pets</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Pet
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Add New Pet</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              placeholder="Pet Name"
              value={newPet.name}
              onChange={(e) => setNewPet({...newPet, name: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
            <input
              placeholder="Breed"
              value={newPet.breed}
              onChange={(e) => setNewPet({...newPet, breed: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
            <input
              placeholder="Age"
              value={newPet.age}
              onChange={(e) => setNewPet({...newPet, age: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
            <input
              placeholder="Weight"
              value={newPet.weight}
              onChange={(e) => setNewPet({...newPet, weight: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePet}
              disabled={!newPet.name || !newPet.breed}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg"
            >
              Add Pet
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {pets.map((pet) => (
          <div key={pet.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🐕</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{pet.name}</h3>
                <p className="text-gray-600">{pet.breed}</p>
                <p className="text-sm text-gray-500">{pet.age} • {pet.weight}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Profile</div>
                <div className="font-bold text-emerald-600">{pet.profileCompletion || 75}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Connected AI Medical Component
const ConnectedAIMedical = () => {
  const { pets } = usePets();
  const { api } = useAuth();
  const [selectedPet, setSelectedPet] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const handleSubmitConsultation = async () => {
    if (!selectedPet || !symptoms.trim()) return;

    setLoading(true);
    try {
      const response = await api.submitMedicalConsultation({
        petId: selectedPet.id,
        symptoms: symptoms
      });

      setAssessment(response);
      if (response.emergency) {
        setShowEmergency(true);
      }
    } catch (error) {
      console.error('Consultation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">AI Health Consultation</h2>
        
        {!assessment ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Pet</label>
              <div className="space-y-2">
                {pets.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPet(pet)}
                    className={`flex items-center gap-3 w-full p-3 rounded-lg border-2 transition-colors ${
                      selectedPet?.id === pet.id 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <span className="text-xl">🐕</span>
                    <span className="font-medium">{pet.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                rows="4"
                placeholder="Describe your pet's symptoms in detail..."
              />
            </div>

            <button
              onClick={handleSubmitConsultation}
              disabled={!selectedPet || !symptoms.trim() || loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Analyzing...' : 'Get AI Assessment'}
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-bold">AI Assessment</h3>
                <p className="text-sm text-gray-600">Confidence: {Math.round(assessment.confidence * 100)}%</p>
              </div>
            </div>

            {assessment.emergency && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-bold text-red-800">URGENT ATTENTION NEEDED</span>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">Assessment:</h4>
              <p className="text-blue-800">{assessment.assessment}</p>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Recommendations:</h4>
              <ul className="space-y-1">
                {assessment.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                setAssessment(null);
                setSymptoms('');
                setSelectedPet(null);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium"
            >
              New Consultation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Connected Feeding Logger Component
const ConnectedFeedingLogger = ({ petId }) => {
  const { feedingLogs, streak, weeklySummary, logFeeding, loading } = useFeedingData(petId);
  const [showLogForm, setShowLogForm] = useState(false);
  const [newLog, setNewLog] = useState({
    logDate: new Date().toISOString().split('T')[0],
    mealTime: 'breakfast',
    foodType: 'raw_food',
    quantity: '',
    notes: ''
  });

  const handleLogFeeding = async () => {
    try {
      const response = await logFeeding(newLog);
      setNewLog({
        logDate: new Date().toISOString().split('T')[0],
        mealTime: 'breakfast',
        foodType: 'raw_food',
        quantity: '',
        notes: ''
      });
      setShowLogForm(false);
      
      // Show PAWS reward notification
      if (response.dailyReward > 0) {
        // You could add a toast notification here
        console.log(`Earned ${response.dailyReward} PAWS!`);
      }
    } catch (error) {
      console.error('Failed to log feeding:', error);
    }
  };

  if (loading) {
    return <div className="bg-gray-200 animate-pulse rounded-xl h-48"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Feeding Tracker</h3>
        <button
          onClick={() => setShowLogForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Log Feeding
        </button>
      </div>

      {/* Streak Display */}
      {streak && (
        <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-lg font-bold">{streak.currentStreak} Day Streak!</div>
              <div className="text-orange-100 text-sm">Longest: {streak.longestStreak} days</div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Summary */}
      {weeklySummary && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">This Week</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{weeklySummary.feedingsThisWeek}</div>
              <div className="text-sm text-gray-600">Feedings Logged</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{weeklySummary.consistencyScore}%</div>
              <div className="text-sm text-gray-600">Consistency</div>
            </div>
          </div>
        </div>
      )}

      {/* Log Form */}
      {showLogForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-bold mb-4">Log New Feeding</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={newLog.logDate}
                  onChange={(e) => setNewLog({...newLog, logDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meal Time</label>
                <select
                  value={newLog.mealTime}
                  onChange={(e) => setNewLog({...newLog, mealTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Type</label>
                <select
                  value={newLog.foodType}
                  onChange={(e) => setNewLog({...newLog, foodType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="raw_food">Raw Food</option>
                  <option value="dry_food">Dry Food</option>
                  <option value="wet_food">Wet Food</option>
                  <option value="treats">Treats</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="text"
                  placeholder="e.g., 1 cup, 8 oz"
                  value={newLog.quantity}
                  onChange={(e) => setNewLog({...newLog, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                placeholder="Any observations about appetite, behavior, etc."
                value={newLog.notes}
                onChange={(e) => setNewLog({...newLog, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                rows="2"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleLogFeeding}
                disabled={!newLog.quantity}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg"
              >
                Log Feeding (+5 PAWS)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Recent Feedings</h4>
        <div className="space-y-2">
          {feedingLogs.slice(0, 5).map((log, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <div className="font-medium text-gray-900">{log.meal_time} - {log.food_type.replace('_', ' ')}</div>
                <div className="text-sm text-gray-600">{log.log_date} • {log.quantity}</div>
              </div>
              <div className="text-emerald-600 font-medium">+{log.paws_earned} PAWS</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Connected NFT Minting & Collection Component
const ConnectedNFTCollection = () => {
  const { nfts, mintNFT, mintCost, loading } = useNFTCollection();
  const { pets } = usePets();
  const [selectedPet, setSelectedPet] = useState(null);
  const [mintingData, setMintingData] = useState({
    nftName: '',
    description: '',
    rarity: 'common'
  });
  const [showMintForm, setShowMintForm] = useState(false);

  const rarityOptions = [
    { value: 'common', label: 'Common', multiplier: 1, color: 'text-gray-600' },
    { value: 'rare', label: 'Rare', multiplier: 1.6, color: 'text-blue-600' },
    { value: 'epic', label: 'Epic', multiplier: 2.4, color: 'text-purple-600' },
    { value: 'legendary', label: 'Legendary', multiplier: 4, color: 'text-yellow-600' }
  ];

  const currentCost = mintCost ? Math.floor(mintCost.cost * (rarityOptions.find(r => r.value === mintingData.rarity)?.multiplier || 1)) : 500;

  const handleMintNFT = async () => {
    if (!selectedPet) return;

    try {
      await mintNFT({
        petId: selectedPet.id,
        nftName: mintingData.nftName || `${selectedPet.name} NFT`,
        description: mintingData.description || `Digital collectible of ${selectedPet.name}`,
        attributes: {
          breed: selectedPet.breed,
          age: selectedPet.age,
          weight: selectedPet.weight,
          rarity: mintingData.rarity
        }
      });
      
      setShowMintForm(false);
      setSelectedPet(null);
      setMintingData({ nftName: '', description: '', rarity: 'common' });
    } catch (error) {
      console.error('NFT minting failed:', error);
    }
  };

  if (loading) {
    return <div className="bg-gray-200 animate-pulse rounded-xl h-64"></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">NFT Collection</h2>
        <button
          onClick={() => setShowMintForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Mint NFT
        </button>
      </div>

      {/* Minting Form */}
      {showMintForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Mint New NFT</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Pet</label>
              <div className="grid gap-2">
                {pets.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPet(pet)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                      selectedPet?.id === pet.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="text-xl">🐕</span>
                    <span className="font-medium">{pet.name} ({pet.breed})</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedPet && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NFT Name</label>
                  <input
                    type="text"
                    placeholder={`${selectedPet.name} NFT`}
                    value={mintingData.nftName}
                    onChange={(e) => setMintingData({...mintingData, nftName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder={`Digital collectible of ${selectedPet.name}`}
                    value={mintingData.description}
                    onChange={(e) => setMintingData({...mintingData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rarity Tier</label>
                  <div className="grid grid-cols-2 gap-2">
                    {rarityOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setMintingData({...mintingData, rarity: option.value})}
                        className={`p-3 border-2 rounded-lg transition-colors ${
                          mintingData.rarity === option.value 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className={`font-medium ${option.color}`}>{option.label}</div>
                        <div className="text-xs text-gray-500">{Math.floor(currentCost * option.multiplier)} PAWS</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{currentCost} PAWS</div>
                    <div className="text-purple-700 text-sm">Total minting cost</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMintForm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMintNFT}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg"
                  >
                    Mint NFT
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* NFT Collection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nfts.map((nft, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <span className="text-6xl">🐕</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">{nft.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{nft.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">#{nft.tokenId?.slice(-4)}</div>
                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                  {nft.attributes?.rarity || 'Common'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {nfts.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No NFTs Yet</h3>
          <p className="text-gray-600 mb-6">Start by minting your first pet NFT!</p>
          <button
            onClick={() => setShowMintForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Mint First NFT
          </button>
        </div>
      )}
    </div>
  );
};

// Connected Supplier Map Component
const ConnectedSupplierMap = () => {
  const { suppliers, selectedSupplier, searchSuppliers, getSupplierDetails, loading } = useSuppliers();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !location.trim()) return;
    
    await searchSuppliers(searchQuery, location);
    setHasSearched(true);
  };

  const handleSupplierClick = async (supplierId) => {
    await getSupplierDetails(supplierId);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Find Raw Food Suppliers</h2>
      
      {/* Search Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Food Type</label>
              <input
                type="text"
                placeholder="Raw beef, chicken, freeze-dried..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="Your city or zip code"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || !location.trim() || loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Searching...' : 'Find Suppliers'}
          </button>
        </div>
      </div>

      {/* Supplier Results */}
      {hasSearched && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {suppliers.length > 0 ? `Found ${suppliers.length} suppliers` : 'No suppliers found'}
          </h3>
          
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{supplier.name}</h4>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{supplier.rating}</span>
                      <span className="text-gray-500 text-sm">({supplier.reviewCount})</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{supplier.distance}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {supplier.specialties.map((specialty, index) => (
                      <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-lg font-semibold text-gray-900">{supplier.price}</div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleSupplierClick(supplier.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button className="border border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg text-sm font-medium">
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supplier Details Modal */}
      {selectedSupplier && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedSupplier.name}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>{selectedSupplier.address}</div>
                <div>{selectedSupplier.phone}</div>
                <div>{selectedSupplier.hours}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Available Products</h4>
              <div className="space-y-2">
                {selectedSupplier.products?.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{product.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.price}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.inStock 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Connected Subscription Manager Component
const ConnectedSubscriptionManager = () => {
  const { subscription, benefits, tiers, upgradeSubscription, loading } = useSubscription();
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);

  const handleUpgrade = async (tier, duration) => {
    try {
      await upgradeSubscription({
        tier,
        paymentMethod: 'paws',
        duration
      });
      setShowUpgradeForm(false);
    } catch (error) {
      console.error('Subscription upgrade failed:', error);
    }
  };

  if (loading) {
    return <div className="bg-gray-200 animate-pulse rounded-xl h-48"></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Subscription Status</h2>
      
      {/* Current Subscription */}
      <div className={`rounded-xl p-6 text-white ${
        subscription?.isPremium 
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
          : 'bg-gradient-to-br from-gray-500 to-gray-600'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            <h3 className="text-lg font-bold">
              {subscription?.isPremium ? 'Rawgle Premium' : 'Rawgle Free'}
            </h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            subscription?.isPremium 
              ? 'bg-yellow-400 text-yellow-900' 
              : 'bg-white bg-opacity-20'
          }`}>
            {subscription?.tier?.toUpperCase() || 'FREE'}
          </div>
        </div>

        {subscription?.isPremium ? (
          <div>
            <div className="mb-4">
              <div className="text-sm opacity-80">Premium until</div>
              <div className="text-lg font-semibold">{subscription.expiresAt}</div>
            </div>
            {benefits && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">PAWS Multiplier</div>
                  <div className="opacity-80">{benefits.pawsMultiplier}x earnings</div>
                </div>
                <div>
                  <div className="font-medium">NFT Discount</div>
                  <div className="opacity-80">{benefits.nftDiscount}% off</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <div className="text-lg font-semibold mb-2">Upgrade to Premium</div>
              <div className="opacity-80 text-sm">2x PAWS earnings • NFT discounts • Priority support</div>
            </div>
            <button
              onClick={() => setShowUpgradeForm(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        )}
      </div>

      {/* Benefits Comparison */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Premium Benefits</h3>
        <div className="space-y-3">
          {[
            { feature: 'PAWS Earnings', free: '1x multiplier', premium: '2x multiplier' },
            { feature: 'NFT Minting', free: 'Full price', premium: '25% discount' },
            { feature: 'AI Consultations', free: '5 per month', premium: 'Unlimited' },
            { feature: 'Analytics', free: 'Basic stats', premium: 'Advanced insights' },
            { feature: 'Support', free: 'Standard', premium: 'Priority support' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <span className="font-medium text-gray-900">{item.feature}</span>
              <div className="flex items-center gap-4">
                <span className="text-gray-600 text-sm">{item.free}</span>
                <span className="text-emerald-600 font-medium text-sm">{item.premium}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Form */}
      {showUpgradeForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Upgrade to Premium</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => handleUpgrade('premium', 'monthly')}
              className="border-2 border-emerald-500 bg-emerald-50 p-4 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">1,000 PAWS</div>
                <div className="text-emerald-700 font-medium">Monthly</div>
                <div className="text-emerald-600 text-sm">Billed monthly</div>
              </div>
            </button>
            
            <button
              onClick={() => handleUpgrade('premium', 'yearly')}
              className="border-2 border-purple-500 bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors relative"
            >
              <div className="absolute -top-2 -right-2 bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium">
                Save 20%
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">9,600 PAWS</div>
                <div className="text-purple-700 font-medium">Yearly</div>
                <div className="text-purple-600 text-sm">2 months free!</div>
              </div>
            </button>
          </div>

          <button
            onClick={() => setShowUpgradeForm(false)}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

// Connected Analytics Dashboard Component
const ConnectedAnalyticsDashboard = () => {
  const { dashboardData, pawsAnalytics, premiumInsights, loading } = useAnalytics();

  if (loading) {
    return <div className="bg-gray-200 animate-pulse rounded-xl h-64"></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Analytics Dashboard</h2>
      
      {/* Key Metrics */}
      {dashboardData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-600">{dashboardData.totalPets}</div>
            <div className="text-sm text-gray-600">Total Pets</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{dashboardData.totalFeedings}</div>
            <div className="text-sm text-gray-600">Total Feedings</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-600">{dashboardData.pawsBalance}</div>
            <div className="text-sm text-gray-600">PAWS Balance</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{dashboardData.weeklyActivity}</div>
            <div className="text-sm text-gray-600">Weekly Activity</div>
          </div>
        </div>
      )}

      {/* PAWS Analytics */}
      {pawsAnalytics && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">PAWS Analytics (Last 30 Days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold text-amber-600 mb-1">{pawsAnalytics.totalEarned}</div>
              <div className="text-gray-600">Total PAWS Earned</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600 mb-1">{pawsAnalytics.transactions?.length || 0}</div>
              <div className="text-gray-600">Total Transactions</div>
            </div>
          </div>
          
          {pawsAnalytics.transactions && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Recent Transactions</h4>
              <div className="space-y-2">
                {pawsAnalytics.transactions.slice(0, 5).map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="font-medium text-gray-900">{transaction.type}</div>
                      <div className="text-sm text-gray-600">{transaction.date}</div>
                    </div>
                    <div className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} PAWS
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Premium Insights */}
      {premiumInsights && (
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-bold mb-4">🔥 Premium Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold mb-1">{premiumInsights.predictiveScore}%</div>
              <div className="text-purple-100">Health Prediction Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">{premiumInsights.optimizationTips}</div>
              <div className="text-purple-100">Optimization Tips</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Connected App
const ConnectedRawgleApp = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Rawgle</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        <ConnectedPAWSBalance />
        <ConnectedPetProfiles />
        <ConnectedAIMedical />
      </div>

      {/* Backend Connection Status */}
      <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">Connected to Rawgle API</span>
        </div>
      </div>
    </div>
  );
};

// Export Main App with Auth Provider
export default function RawgleBackendIntegration() {
  return (
    <AuthProvider>
      <ConnectedRawgleApp />
    </AuthProvider>
  );
}