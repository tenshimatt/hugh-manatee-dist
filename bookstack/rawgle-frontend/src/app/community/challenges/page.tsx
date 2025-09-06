'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Trophy, 
  Target, 
  Calendar, 
  Users, 
  Award, 
  Star, 
  Clock, 
  Filter,
  Search,
  Plus,
  TrendingUp,
  CheckCircle,
  Play,
  Crown,
  Zap
} from 'lucide-react'

const challengeCategories = [
  { id: 'all', label: 'All Challenges', count: 47 },
  { id: 'feeding', label: 'Feeding & Nutrition', count: 15 },
  { id: 'health', label: 'Health & Wellness', count: 12 },
  { id: 'training', label: 'Training & Behavior', count: 8 },
  { id: 'recipe', label: 'Recipe Development', count: 7 },
  { id: 'community', label: 'Community Engagement', count: 5 }
]

const difficultyLevels = [
  { id: 'all', label: 'All Levels' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' }
]

const allChallenges = [
  {
    id: 1,
    title: "30-Day Raw Transition Challenge",
    description: "Complete guide to transitioning your pet from commercial to raw food with daily support and expert guidance",
    category: "feeding",
    difficulty: "beginner",
    duration: "30 days",
    participants: 247,
    completions: 89,
    reward: "500 PAWS tokens + Digital Certificate",
    expert: "Dr. Sarah Chen",
    expertAvatar: "/api/placeholder/40/40",
    status: "active",
    daysLeft: 12,
    progress: 60,
    featured: true,
    completionRate: 74,
    rating: 4.8,
    reviews: 156
  },
  {
    id: 2,
    title: "Perfect Portion Challenge",
    description: "Master portion control and feeding schedules for optimal pet health and weight management",
    category: "feeding",
    difficulty: "intermediate",
    duration: "14 days",
    participants: 156,
    completions: 134,
    reward: "300 PAWS tokens + Feeding Guide",
    expert: "Mark Thompson",
    expertAvatar: "/api/placeholder/40/40",
    status: "starting_soon",
    daysLeft: 3,
    progress: 0,
    featured: true,
    completionRate: 86,
    rating: 4.7,
    reviews: 89
  },
  {
    id: 3,
    title: "Recipe Rotation Mastery",
    description: "Learn to create varied, balanced meals using seasonal ingredients and advanced nutrition principles",
    category: "recipe",
    difficulty: "advanced",
    duration: "21 days",
    participants: 89,
    completions: 67,
    reward: "800 PAWS tokens + Expert Consultation",
    expert: "Lisa Rodriguez",
    expertAvatar: "/api/placeholder/40/40", 
    status: "active",
    daysLeft: 8,
    progress: 38,
    featured: true,
    completionRate: 75,
    rating: 4.9,
    reviews: 45
  },
  {
    id: 4,
    title: "Senior Dog Nutrition Optimization",
    description: "Adapt your raw feeding approach for senior dogs with joint support and age-specific nutrition",
    category: "health",
    difficulty: "intermediate",
    duration: "28 days",
    participants: 78,
    completions: 61,
    reward: "400 PAWS tokens + Senior Care Guide",
    expert: "Dr. Maria Santos",
    expertAvatar: "/api/placeholder/40/40",
    status: "active",
    daysLeft: 15,
    progress: 0,
    featured: false,
    completionRate: 78,
    rating: 4.8,
    reviews: 34
  },
  {
    id: 5,
    title: "Multi-Pet Meal Planning",
    description: "Efficiently plan and prepare raw meals for households with multiple pets of different sizes",
    category: "feeding",
    difficulty: "intermediate",
    duration: "21 days",
    participants: 134,
    completions: 98,
    reward: "350 PAWS tokens + Meal Planning Templates",
    expert: "Jennifer Kim",
    expertAvatar: "/api/placeholder/40/40",
    status: "active",
    daysLeft: 5,
    progress: 0,
    featured: false,
    completionRate: 73,
    rating: 4.6,
    reviews: 67
  },
  {
    id: 6,
    title: "Raw Food Safety & Hygiene",
    description: "Master safe handling, storage, and preparation techniques for raw pet food",
    category: "health",
    difficulty: "beginner",
    duration: "7 days",
    participants: 203,
    completions: 187,
    reward: "200 PAWS tokens + Safety Checklist",
    expert: "Dr. Robert Lee",
    expertAvatar: "/api/placeholder/40/40",
    status: "active",
    daysLeft: 20,
    progress: 0,
    featured: false,
    completionRate: 92,
    rating: 4.9,
    reviews: 142
  },
  {
    id: 7,
    title: "Athletic Dog Performance Nutrition",
    description: "Optimize nutrition for working dogs, show dogs, and highly active pets",
    category: "feeding",
    difficulty: "advanced",
    duration: "35 days",
    participants: 45,
    completions: 32,
    reward: "600 PAWS tokens + Performance Guide",
    expert: "Coach Mike Wilson",
    expertAvatar: "/api/placeholder/40/40",
    status: "completed",
    daysLeft: 0,
    progress: 100,
    featured: false,
    completionRate: 71,
    rating: 4.7,
    reviews: 23
  },
  {
    id: 8,
    title: "Allergy Management Through Raw Diet",
    description: "Identify food sensitivities and create elimination diets using raw ingredients",
    category: "health",
    difficulty: "advanced",
    duration: "42 days",
    participants: 67,
    completions: 49,
    reward: "500 PAWS tokens + Allergy Testing Kit",
    expert: "Dr. Emily Chen",
    expertAvatar: "/api/placeholder/40/40",
    status: "starting_soon",
    daysLeft: 7,
    progress: 0,
    featured: false,
    completionRate: 73,
    rating: 4.8,
    reviews: 38
  }
]

export default function ChallengesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('featured') // featured, newest, popular, ending_soon

  const filteredChallenges = allChallenges.filter(challenge => {
    const matchesCategory = selectedCategory === 'all' || challenge.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'all' || challenge.difficulty === selectedDifficulty
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesDifficulty && matchesSearch
  }).sort((a, b) => {
    switch (sortBy) {
      case 'featured':
        return Number(b.featured) - Number(a.featured) || b.participants - a.participants
      case 'popular':
        return b.participants - a.participants
      case 'ending_soon':
        return a.daysLeft - b.daysLeft
      case 'newest':
        return b.id - a.id
      default:
        return 0
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'starting_soon': return 'bg-blue-100 text-blue-800' 
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-12 w-12 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Community Challenges</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Join structured challenges to improve your raw feeding skills and earn PAWS tokens
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/community/challenges/create"
              className="bg-yellow-500 text-white px-8 py-3 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Challenge
            </Link>
            <Link 
              href="/community/challenges/my-challenges"
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <Target className="h-5 w-5 mr-2" />
              My Challenges
            </Link>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {[
            { label: "Active Challenges", value: "23", icon: Trophy, color: "yellow" },
            { label: "Total Participants", value: "1,247", icon: Users, color: "blue" },
            { label: "Challenges Completed", value: "892", icon: CheckCircle, color: "green" },
            { label: "PAWS Distributed", value: "45,600", icon: Crown, color: "purple" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl p-6 shadow-lg text-center"
            >
              <stat.icon className={`h-8 w-8 text-${stat.color}-600 mx-auto mb-2`} />
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters and Search */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {challengeCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label} ({category.count})
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {difficultyLevels.map(level => (
                <option key={level.id} value={level.id}>
                  {level.label}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="featured">Featured First</option>
              <option value="popular">Most Popular</option>
              <option value="ending_soon">Ending Soon</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredChallenges.length} of {allChallenges.length} challenges
          </div>
        </motion.div>

        {/* Challenges Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredChallenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl overflow-hidden shadow-lg"
            >
              {/* Challenge Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getDifficultyColor(challenge.difficulty)}`}>
                      <Target className="h-5 w-5" />
                    </div>
                    {challenge.featured && (
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                        <Crown className="h-3 w-3 mr-1" />
                        FEATURED
                      </div>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(challenge.status)}`}>
                    {challenge.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{challenge.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{challenge.description}</p>

                {/* Challenge Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{challenge.participants}</div>
                    <div className="text-xs text-gray-500">Participants</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{challenge.completions}</div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                </div>

                {/* Progress Bar for Active Challenges */}
                {challenge.progress > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Your Progress</span>
                      <span>{challenge.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${challenge.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Challenge Details */}
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{challenge.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Difficulty</span>
                    <span className={`font-medium capitalize ${
                      challenge.difficulty === 'beginner' ? 'text-green-600' :
                      challenge.difficulty === 'intermediate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-medium">{challenge.completionRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rating</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="font-medium">{challenge.rating}</span>
                      <span className="text-gray-500 ml-1">({challenge.reviews})</span>
                    </div>
                  </div>
                  {challenge.status !== 'completed' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {challenge.status === 'starting_soon' ? 'Starts in' : 'Days left'}
                      </span>
                      <span className="font-medium text-purple-600">{challenge.daysLeft} days</span>
                    </div>
                  )}
                </div>

                {/* Expert Info */}
                <div className="flex items-center mb-6 p-3 bg-gray-50 rounded-lg">
                  <Image 
                    src={challenge.expertAvatar} 
                    alt={challenge.expert}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{challenge.expert}</div>
                    <div className="text-sm text-gray-600">Challenge Expert</div>
                  </div>
                </div>

                {/* Reward */}
                <div className="flex items-center justify-between mb-6 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Reward</span>
                  </div>
                  <span className="text-sm font-bold text-yellow-600">{challenge.reward}</span>
                </div>

                {/* Action Button */}
                <Link 
                  href={`/community/challenges/${challenge.id}`}
                  className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${
                    challenge.progress > 0 
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : challenge.status === 'completed'
                      ? 'bg-gray-500 text-white hover:bg-gray-600'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                  }`}
                >
                  {challenge.progress > 0 ? (
                    <div className="flex items-center justify-center">
                      <Play className="h-5 w-5 mr-2" />
                      Continue Challenge
                    </div>
                  ) : challenge.status === 'completed' ? (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      View Results
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Join Challenge
                    </div>
                  )}
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-500 mb-2">No challenges found</h3>
            <p className="text-gray-400">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  )
}