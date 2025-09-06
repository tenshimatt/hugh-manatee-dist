'use client'

import { motion } from 'framer-motion'
import { 
  Heart, 
  Plus, 
  Edit, 
  Trash2, 
  Camera, 
  Calendar,
  Weight,
  Ruler,
  Award,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'

const pets = [
  {
    id: 1,
    name: 'Luna',
    breed: 'German Shepherd',
    age: '3 years',
    weight: '28kg',
    height: '65cm',
    avatar: '/api/placeholder/120/120',
    healthScore: 95,
    lastFed: '2 hours ago',
    nextMeal: 'In 4 hours',
    tags: ['Active', 'Healthy'],
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 2,
    name: 'Max',
    breed: 'Golden Retriever',
    age: '5 years',
    weight: '32kg',
    height: '58cm',
    avatar: '/api/placeholder/120/120',
    healthScore: 88,
    lastFed: '3 hours ago',
    nextMeal: 'In 3 hours',
    tags: ['Senior', 'Gentle'],
    color: 'from-blue-500 to-teal-500'
  },
  {
    id: 3,
    name: 'Bella',
    breed: 'Border Collie',
    age: '2 years',
    weight: '22kg',
    height: '52cm',
    avatar: '/api/placeholder/120/120',
    healthScore: 92,
    lastFed: '1 hour ago',
    nextMeal: 'In 5 hours',
    tags: ['Energetic', 'Smart'],
    color: 'from-green-500 to-emerald-500'
  }
]

const quickStats = [
  {
    label: 'Total Pets',
    value: pets.length.toString(),
    icon: Heart,
    color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/20'
  },
  {
    label: 'Average Health Score',
    value: `${Math.round(pets.reduce((acc, pet) => acc + pet.healthScore, 0) / pets.length)}%`,
    icon: Activity,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/20'
  },
  {
    label: 'Next Feeding',
    value: 'In 3 hours',
    icon: Calendar,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
  }
]

export default function PetsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Pets</h1>
          <p className="text-muted-foreground">
            Manage your furry family members and their health profiles
          </p>
        </div>
        <Button data-testid="add-pet-button">
          <Plus className="mr-2 h-4 w-4" />
          Add Pet
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map((pet, index) => (
          <motion.div
            key={pet.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-shadow">
              {/* Pet Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${pet.color} flex items-center justify-center text-white text-2xl font-bold`}>
                    {pet.name[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{pet.name}</h3>
                    <p className="text-muted-foreground">{pet.breed}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Pet Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{pet.age}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{pet.weight}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{pet.height}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{pet.healthScore}% health</span>
                </div>
              </div>

              {/* Health Score Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Health Score</span>
                  <span className="text-sm text-muted-foreground">{pet.healthScore}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${
                      pet.healthScore >= 90 
                        ? 'from-green-500 to-emerald-500' 
                        : pet.healthScore >= 80 
                        ? 'from-yellow-500 to-orange-500' 
                        : 'from-red-500 to-pink-500'
                    }`}
                    style={{ width: `${pet.healthScore}%` }}
                  />
                </div>
              </div>

              {/* Feeding Info */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Last fed:</span>
                  <span>{pet.lastFed}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Next meal:</span>
                  <span className="text-primary font-medium">{pet.nextMeal}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {pet.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button size="sm" className="flex-1">
                  Log Meal
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Add Pet Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: pets.length * 0.1 }}
        >
          <Card className="p-6 border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Add New Pet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create a profile for your new furry family member
              </p>
              <Button>Get Started</Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}