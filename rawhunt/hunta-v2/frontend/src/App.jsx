import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import HomePage from './pages/HomePage.jsx'
import DogsPage from './pages/DogsPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import RoutesPage from './pages/RoutesPage.jsx'
import GearPage from './pages/GearPage.jsx'
import EthicsPage from './pages/EthicsPage.jsx'
import PostsPage from './pages/PostsPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import StylerPage from './pages/StylerPage.jsx'
import HuntLogsPage from './pages/HuntLogsPage.jsx'
import TrainingPage from './pages/TrainingPage.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'

const API_BASE = 'https://hunta-v2-backend.findrawdogfood.workers.dev'

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage apiBase={API_BASE} />} />
            <Route path="/dogs" element={<DogsPage apiBase={API_BASE} />} />
            <Route path="/events" element={<EventsPage apiBase={API_BASE} />} />
            <Route path="/routes" element={<RoutesPage apiBase={API_BASE} />} />
            <Route path="/gear" element={<GearPage apiBase={API_BASE} />} />
            <Route path="/ethics" element={<EthicsPage apiBase={API_BASE} />} />
            <Route path="/posts" element={<PostsPage apiBase={API_BASE} />} />
            <Route path="/analytics" element={<AnalyticsPage apiBase={API_BASE} />} />
            <Route path="/styler" element={<StylerPage apiBase={API_BASE} />} />
            <Route path="/hunts" element={<HuntLogsPage apiBase={API_BASE} />} />
            <Route path="/training" element={<TrainingPage apiBase={API_BASE} />} />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App