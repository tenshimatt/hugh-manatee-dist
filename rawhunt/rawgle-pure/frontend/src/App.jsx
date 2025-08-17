import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import PetsPage from './pages/PetsPage';
import PetDetailPage from './pages/PetDetailPage';
import AddPetPage from './pages/AddPetPage';
import FeedingPage from './pages/FeedingPage';
import AIMedicalPage from './pages/AIMedicalPage';
import PawsWalletPage from './pages/PawsWalletPage';
import NFTGalleryPage from './pages/NFTGalleryPage';
import MarketplacePage from './pages/MarketplacePage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public routes */}
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            
            {/* Protected routes */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="pets" element={
              <ProtectedRoute>
                <PetsPage />
              </ProtectedRoute>
            } />
            <Route path="pets/add" element={
              <ProtectedRoute>
                <AddPetPage />
              </ProtectedRoute>
            } />
            <Route path="pets/:id" element={
              <ProtectedRoute>
                <PetDetailPage />
              </ProtectedRoute>
            } />
            <Route path="feeding" element={
              <ProtectedRoute>
                <FeedingPage />
              </ProtectedRoute>
            } />
            <Route path="ai-medical" element={
              <ProtectedRoute>
                <AIMedicalPage />
              </ProtectedRoute>
            } />
            <Route path="paws" element={
              <ProtectedRoute>
                <PawsWalletPage />
              </ProtectedRoute>
            } />
            <Route path="nfts" element={
              <ProtectedRoute>
                <NFTGalleryPage />
              </ProtectedRoute>
            } />
            <Route path="marketplace" element={
              <ProtectedRoute>
                <MarketplacePage />
              </ProtectedRoute>
            } />
            <Route path="analytics" element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;