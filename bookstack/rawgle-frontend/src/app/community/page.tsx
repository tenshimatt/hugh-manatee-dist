'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Navigation } from '@/components/layout/navigation'
import { 
  Users, 
  Trophy, 
  Star, 
  ChefHat, 
  BookOpen, 
  MessageCircle, 
  Award,
  TrendingUp,
  Heart,
  Shield,
  Clock,
  MapPin,
  Plus,
  Eye,
  ThumbsUp,
  MessageSquare,
  Target,
  Calendar,
  Zap,
  Crown,
  BadgeCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const communityStats = {
  members: 12847,
  activeChallenges: 23,
  completedChallenges: 1834,
  experts: 47,
  recipes: 2651,
  reviews: 8943
}

const featuredChallenges = [
  {
    id: 1,
    title: "30-Day Raw Transition Challenge",
    description: "Guide your pet through a complete transition to raw feeding with daily support",
    participants: 247,
    duration: "30 days",
    difficulty: "Beginner",
    reward: "500 PAWS tokens + Digital Certificate",
    category: "Feeding",
    expert: "Dr. Sarah Chen",
    status: "Active",
    daysLeft: 12,
    progress: 60
  },
  {
    id: 2,
    title: "Perfect Portion Challenge",
    description: "Master portion control and feeding schedules for optimal pet health",
    participants: 156,
    duration: "14 days",
    difficulty: "Intermediate",
    reward: "300 PAWS tokens + Feeding Guide",
    category: "Nutrition",
    expert: "Mark Thompson",
    status: "Starting Soon",
    daysLeft: 3,
    progress: 0
  },
  {
    id: 3,
    title: "Recipe Rotation Mastery",
    description: "Learn to create varied, balanced meals using seasonal ingredients",
    participants: 89,
    duration: "21 days",
    difficulty: "Advanced",
    reward: "800 PAWS tokens + Expert Consultation",
    category: "Recipe Development",
    expert: "Lisa Rodriguez",
    status: "Active",
    daysLeft: 8,
    progress: 38
  }
]

const topExperts = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    title: "Veterinary Nutritionist",
    specialties: ["Nutrition", "Allergies", "Senior Pets"],
    rating: 4.9,
    consultations: 1247,
    location: "California, USA",
    avatar: "/api/placeholder/64/64",
    verified: true,
    responseTime: "< 2 hours",
    pawsTokens: 15420,
    status: "online"
  },
  {
    id: 2,
    name: "Mark Thompson",
    title: "Canine Nutrition Specialist", 
    specialties: ["Raw Feeding", "Weight Management", "Athletic Dogs"],
    rating: 4.8,
    consultations: 892,
    location: "Texas, USA",
    avatar: "/api/placeholder/64/64",
    verified: true,
    responseTime: "< 4 hours",
    pawsTokens: 12380,
    status: "online"
  },
  {
    id: 3,
    name: "Lisa Rodriguez",
    title: "Feline Raw Food Expert",
    specialties: ["Cat Nutrition", "Prey Model", "Multi-Cat Households"],
    rating: 4.9,
    consultations: 654,
    location: "New York, USA",
    avatar: "/api/placeholder/64/64",
    verified: true,
    responseTime: "< 1 hour",
    pawsTokens: 18950,
    status: "busy"
  }
]

const recentActivity = [
  {
    id: 1,
    user: "PetLover2024",
    avatar: "/api/placeholder/40/40",
    action: "shared a recipe",
    target: "Beef & Organ Blend for Seniors",
    time: "2 minutes ago",
    likes: 12,
    comments: 3,
    type: "recipe"
  },
  {
    id: 2,
    user: "RawFeedingMom",
    avatar: "/api/placeholder/40/40",
    action: "completed challenge",
    target: "Weekly Meal Prep Challenge",
    time: "15 minutes ago",
    likes: 28,
    comments: 7,
    type: "achievement"
  },
  {
    id: 3,
    user: "HealthyPaws",
    avatar: "/api/placeholder/40/40",
    action: "asked question",
    target: "Transitioning a picky eater to raw",
    time: "32 minutes ago",
    likes: 5,
    comments: 14,
    type: "question"
  },
  {
    id: 4,
    user: "VetTech_Sarah",
    avatar: "/api/placeholder/40/40",
    action: "answered question",
    target: "Proper storage techniques for raw food",
    time: "1 hour ago",
    likes: 45,
    comments: 12,
    type: "answer"
  }
]

const popularRecipes = [
  {
    id: 1,
    title: "Complete Puppy Growth Formula",
    author: "ChefPaws",
    rating: 4.9,
    reviews: 234,
    difficulty: "Beginner",
    prepTime: "15 min",
    image: "/api/placeholder/300/200",
    tags: ["Puppy", "Growth", "Balanced"]
  },
  {
    id: 2,
    title: "Senior Dog Joint Support Mix",
    author: "HealthyTails",
    rating: 4.8,
    reviews: 189,
    difficulty: "Intermediate", 
    prepTime: "20 min",
    image: "/api/placeholder/300/200",
    tags: ["Senior", "Joints", "Supplements"]
  },
  {
    id: 3,
    title: "Athletic Dog High-Energy Blend",
    author: "SportingDogsNutrition",
    rating: 4.9,
    reviews: 156,
    difficulty: "Advanced",
    prepTime: "25 min", 
    image: "/api/placeholder/300/200",
    tags: ["Athletic", "High-Energy", "Performance"]
  }
]

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-pumpkin mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">RAWGLE Community</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with fellow pet parents, learn from experts, and master the art of raw feeding
          </p>
        </motion.div>

        {/* Community Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12"
        >
          {[
            { label: "Members", value: communityStats.members.toLocaleString(), icon: Users, color: "blue" },
            { label: "Active Challenges", value: communityStats.activeChallenges, icon: Trophy, color: "yellow" },
            { label: "Experts Online", value: communityStats.experts, icon: Star, color: "purple" },
            { label: "Shared Recipes", value: communityStats.recipes.toLocaleString(), icon: ChefHat, color: "green" },
            { label: "Success Stories", value: communityStats.completedChallenges.toLocaleString(), icon: Award, color: "orange" },
            { label: "Reviews", value: communityStats.reviews.toLocaleString(), icon: MessageCircle, color: "pink" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-l-blue-500"
            >
              <stat.icon className={`h-8 w-8 text-${stat.color}-600 mb-2`} />
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center mb-8 space-x-1 bg-white rounded-xl p-2 shadow-lg max-w-2xl mx-auto">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'challenges', label: 'Challenges', icon: Trophy },
            { id: 'experts', label: 'Experts', icon: Star },
            { id: 'recipes', label: 'Recipes', icon: ChefHat }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Featured Challenges */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
                  Featured Challenges
                </h2>
                <div className="space-y-6">
                  {featuredChallenges.map((challenge) => (
                    <motion.div
                      key={challenge.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-xl p-6 shadow-lg"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{challenge.title}</h3>
                          <p className="text-gray-600 mt-2">{challenge.description}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          challenge.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {challenge.status}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{challenge.participants}</div>
                          <div className="text-sm text-gray-600">Participants</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{challenge.duration}</div>
                          <div className="text-sm text-gray-600">Duration</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${
                            challenge.difficulty === 'Beginner' ? 'text-green-600' :
                            challenge.difficulty === 'Intermediate' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {challenge.difficulty}
                          </div>
                          <div className="text-sm text-gray-600">Level</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{challenge.daysLeft}</div>
                          <div className="text-sm text-gray-600">Days Left</div>
                        </div>
                      </div>

                      {challenge.progress > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{challenge.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${challenge.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center">
                          <Award className="h-5 w-5 text-yellow-500 mr-2" />
                          <span className="text-sm font-medium text-gray-700">{challenge.reward}</span>
                        </div>
                        <Link 
                          href={`/community/challenges/${challenge.id}`}
                          className="btn btn-primary"
                        >
                          {challenge.progress > 0 ? 'Continue' : 'Join Challenge'}
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Sidebar */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Clock className="h-6 w-6 text-green-500 mr-2" />
                  Recent Activity
                </h2>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-start space-x-3">
                          <img 
                            src={activity.avatar} 
                            alt={activity.user}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium text-gray-900">{activity.user}</span>
                              <span className="text-gray-600"> {activity.action} </span>
                              <span className="font-medium text-gray-900">{activity.target}</span>
                            </p>
                            <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                              <span>{activity.time}</span>
                              <div className="flex items-center space-x-1">
                                <Heart className="h-3 w-3" />
                                <span>{activity.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="h-3 w-3" />
                                <span>{activity.comments}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link 
                    href="/community/activity"
                    className="block w-full text-center mt-6 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All Activity
                  </Link>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link 
                      href="/community/challenges/create"
                      className="flex items-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="font-medium text-blue-900">Create Challenge</span>
                    </Link>
                    <Link 
                      href="/community/recipes/share"
                      className="flex items-center p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <ChefHat className="h-5 w-5 text-green-600 mr-3" />
                      <span className="font-medium text-green-900">Share Recipe</span>
                    </Link>
                    <Link 
                      href="/community/questions/ask"
                      className="flex items-center p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                      <MessageSquare className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="font-medium text-purple-900">Ask Question</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'challenges' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Community Challenges</h2>
                <Link 
                  href="/community/challenges/create"
                  className="btn btn-primary flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Challenge
                </Link>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredChallenges.map((challenge) => (
                  <motion.div
                    key={challenge.id}
                    whileHover={{ scale: 1.05 }}
                    className="bg-white rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg ${
                        challenge.difficulty === 'Beginner' ? 'bg-green-100' :
                        challenge.difficulty === 'Intermediate' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <Target className={`h-5 w-5 ${
                          challenge.difficulty === 'Beginner' ? 'text-green-600' :
                          challenge.difficulty === 'Intermediate' ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        challenge.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {challenge.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">{challenge.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{challenge.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Participants</span>
                        <span className="font-medium">{challenge.participants}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium">{challenge.duration}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Expert</span>
                        <span className="font-medium">{challenge.expert}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-xs text-gray-600">PAWS Tokens</span>
                      </div>
                      <Link 
                        href={`/community/challenges/${challenge.id}`}
                        className="btn btn-primary text-sm"
                      >
                        Join Challenge
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'experts' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Expert Network</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topExperts.map((expert) => (
                  <motion.div
                    key={expert.id}
                    whileHover={{ scale: 1.05 }}
                    className="bg-white rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-center mb-4">
                      <div className="relative">
                        <img 
                          src={expert.avatar} 
                          alt={expert.name}
                          className="w-16 h-16 rounded-full mr-4"
                        />
                        <div className={`absolute bottom-0 right-4 w-4 h-4 rounded-full border-2 border-white ${
                          expert.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-lg font-bold text-gray-900">{expert.name}</h3>
                          {expert.verified && (
                            <BadgeCheck className="h-5 w-5 text-blue-500 ml-2" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{expert.title}</p>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">{expert.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-500 mr-1" />
                        <span className="font-medium">{expert.rating}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({expert.consultations} consultations)
                        </span>
                      </div>
                      <span className="text-sm text-green-600 font-medium">{expert.responseTime}</span>
                    </div>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {expert.specialties.map((specialty, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Crown className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{expert.pawsTokens.toLocaleString()} PAWS</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        expert.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {expert.status}
                      </span>
                    </div>

                    <Link 
                      href={`/community/experts/${expert.id}`}
                      className="block w-full bg-blue-500 text-white text-center py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      View Profile
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link 
                  href="/community/experts" 
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All Experts
                  <TrendingUp className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'recipes' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Community Recipes</h2>
                <Link 
                  href="/community/recipes/share"
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center"
                >
                  <ChefHat className="h-5 w-5 mr-2" />
                  Share Recipe
                </Link>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularRecipes.map((recipe) => (
                  <motion.div
                    key={recipe.id}
                    whileHover={{ scale: 1.05 }}
                    className="bg-white rounded-xl overflow-hidden shadow-lg"
                  >
                    <img 
                      src={recipe.image} 
                      alt={recipe.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{recipe.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">by {recipe.author}</p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-medium text-sm">{recipe.rating}</span>
                          <span className="text-xs text-gray-500 ml-1">({recipe.reviews})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{recipe.prepTime}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {recipe.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <Link 
                        href={`/community/recipes/${recipe.id}`}
                        className="block w-full bg-green-500 text-white text-center py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        View Recipe
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <Link 
                  href="/community/recipes" 
                  className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                >
                  View All Recipes
                  <ChefHat className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>
          )}
        </motion.div>
        </div>
      </div>
    </>
  )
}