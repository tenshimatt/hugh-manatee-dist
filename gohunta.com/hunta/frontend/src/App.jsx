import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useAuth.jsx';
import { useOffline } from './hooks/useOffline.js';

// Layout Components
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import OfflineBanner from './components/ui/OfflineBanner';

// Page Components (Lazy loaded)
const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage'));

// Core Module Pages
const PacksPage = React.lazy(() => import('./pages/packs/PacksPage'));
const DogProfilePage = React.lazy(() => import('./pages/packs/DogProfilePage'));
const RoutesPage = React.lazy(() => import('./pages/routes/RoutesPage'));
const RouteDetailPage = React.lazy(() => import('./pages/routes/RouteDetailPage'));
const RoutePlannerPage = React.lazy(() => import('./pages/routes/RoutePlannerPage'));
const EventsPage = React.lazy(() => import('./pages/events/EventsPage'));
const EventDetailPage = React.lazy(() => import('./pages/events/EventDetailPage'));
const GearPage = React.lazy(() => import('./pages/gear/GearPage'));
const GearDetailPage = React.lazy(() => import('./pages/gear/GearDetailPage'));
const LoadoutsPage = React.lazy(() => import('./pages/gear/LoadoutsPage'));
const EthicsPage = React.lazy(() => import('./pages/ethics/EthicsPage'));
const EthicsArticlePage = React.lazy(() => import('./pages/ethics/EthicsArticlePage'));
const BragBoardPage = React.lazy(() => import('./pages/bragboard/BragBoardPage'));
const PostDetailPage = React.lazy(() => import('./pages/bragboard/PostDetailPage'));
const TrainingPage = React.lazy(() => import('./pages/training/TrainingPage'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { isOffline } = useOffline();

  return (
    <div className="App min-h-screen bg-gray-50">
      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && <OfflineBanner />}
      </AnimatePresence>

      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />

          {/* Protected Routes with Layout */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <HomePage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Pack & Profile Management */}
          <Route path="/packs" element={
            <ProtectedRoute>
              <Layout>
                <PacksPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/packs/dog/:id" element={
            <ProtectedRoute>
              <Layout>
                <DogProfilePage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Hunt Route Planner */}
          <Route path="/routes" element={
            <ProtectedRoute>
              <Layout>
                <RoutesPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/routes/new" element={
            <ProtectedRoute>
              <Layout>
                <RoutePlannerPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/routes/:id" element={
            <ProtectedRoute>
              <Layout>
                <RouteDetailPage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Trial & Event Listings */}
          <Route path="/events" element={
            <Layout>
              <EventsPage />
            </Layout>
          } />
          <Route path="/events/:id" element={
            <Layout>
              <EventDetailPage />
            </Layout>
          } />

          {/* Gear Reviews & Loadouts */}
          <Route path="/gear" element={
            <Layout>
              <GearPage />
            </Layout>
          } />
          <Route path="/gear/:id" element={
            <Layout>
              <GearDetailPage />
            </Layout>
          } />
          <Route path="/loadouts" element={
            <ProtectedRoute>
              <Layout>
                <LoadoutsPage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Ethics Knowledge Base */}
          <Route path="/ethics" element={
            <Layout>
              <EthicsPage />
            </Layout>
          } />
          <Route path="/ethics/:slug" element={
            <Layout>
              <EthicsArticlePage />
            </Layout>
          } />

          {/* Brag Board & Journal */}
          <Route path="/bragboard" element={
            <Layout>
              <BragBoardPage />
            </Layout>
          } />
          <Route path="/posts/:id" element={
            <Layout>
              <PostDetailPage />
            </Layout>
          } />

          {/* Training Logs */}
          <Route path="/training" element={
            <ProtectedRoute>
              <Layout>
                <TrainingPage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Catch all - 404 */}
          <Route path="*" element={
            <Layout>
              <div className="flex items-center justify-center min-h-screen">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-8">Page not found</p>
                  <motion.a
                    href="/"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Return Home
                  </motion.a>
                </motion.div>
              </div>
            </Layout>
          } />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;