import axios from 'axios';

const API_BASE_URL = 'https://rawgle-api.findrawdogfood.workers.dev';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rawgle_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rawgle_token');
      window.location.href = '/login';
    }
    throw error.response?.data || error.message;
  }
);

// Auth service
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  validateToken: (token) => api.post('/auth/validate', { token }),
  linkWallet: (walletAddress, token) => api.post('/auth/link-wallet', { wallet_address: walletAddress }, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

// Pet service
export const petService = {
  createPet: (petData) => api.post('/pets', petData),
  getPets: () => api.get('/pets'),
  getPet: (petId) => api.get(`/pets/${petId}`),
  updatePet: (petId, petData) => api.put(`/pets/${petId}`, petData),
  deletePet: (petId) => api.delete(`/pets/${petId}`),
};

// Feeding service
export const feedingService = {
  logFeeding: (feedingData) => api.post('/feeding', feedingData),
  getFeedingHistory: (petId, days) => api.get(`/feeding/${petId}?days=${days || 30}`),
  updateFeeding: (feedingId, feedingData) => api.put(`/feeding/${feedingId}`, feedingData),
  deleteFeeding: (feedingId) => api.delete(`/feeding/${feedingId}`),
};

// AI Medical service
export const aiMedicalService = {
  getConsultation: (consultationData) => api.post('/ai-medical', consultationData),
  getConsultationHistory: (petId) => api.get(`/ai-medical/history/${petId}`),
  getEmergencyAlerts: () => api.get('/ai-medical/alerts'),
};

// PAWS service
export const pawsService = {
  getBalance: () => api.get('/paws/balance'),
  getTransactionHistory: () => api.get('/paws/transactions'),
  earnReward: (rewardType, metadata) => api.post('/paws/earn', { reward_type: rewardType, metadata }),
  transferPaws: (toUserId, amount, reason) => api.post('/paws/transfer', { to_user_id: toUserId, amount, reason }),
};

// NFT service
export const nftService = {
  getUserNFTs: () => api.get('/nft/user-collection'),
  mintNFT: (nftData) => api.post('/nft/mint', nftData),
  getNFTMetadata: (nftId) => api.get(`/nft/${nftId}`),
  transferNFT: (nftId, toAddress) => api.post(`/nft/${nftId}/transfer`, { to_address: toAddress }),
  getMarketplaceListings: () => api.get('/nft/marketplace'),
  listNFTForSale: (nftId, price) => api.post(`/nft/${nftId}/list`, { price }),
  purchaseNFT: (nftId) => api.post(`/nft/${nftId}/purchase`),
};

// Analytics service
export const analyticsService = {
  getUserAnalytics: () => api.get('/analytics/user'),
  getPetAnalytics: (petId) => api.get(`/analytics/pet/${petId}`),
  getHealthTrends: (petId, period) => api.get(`/analytics/health-trends/${petId}?period=${period}`),
  getFeedingInsights: (petId) => api.get(`/analytics/feeding-insights/${petId}`),
};

// Subscription service
export const subscriptionService = {
  getSubscription: () => api.get('/subscription'),
  upgrade: (plan) => api.post('/subscription/upgrade', { plan }),
  cancel: () => api.post('/subscription/cancel'),
  getBenefits: () => api.get('/subscription/benefits'),
};

export default api;