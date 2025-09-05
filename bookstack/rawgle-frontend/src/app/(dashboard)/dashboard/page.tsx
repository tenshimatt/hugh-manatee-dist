'use client'

import { motion } from 'framer-motion'
import { 
  Heart, 
  Utensils, 
  TrendingUp, 
  Calendar, 
  Award,
  Plus,
  BarChart3,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const stats = [
  {
    name: 'Active Pets',
    value: '3',
    change: '+1 this month',
    changeType: 'positive',
    icon: Heart,
    color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/20',
  },
  {
    name: 'Meals Logged',
    value: '247',
    change: '+12% from last month',
    changeType: 'positive',
    icon: Utensils,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
  },
  {
    name: 'Health Score',
    value: '94%',
    change: '+2% this week',
    changeType: 'positive',
    icon: TrendingUp,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  },
  {
    name: 'PAWS Earned',
    value: '1,247',
    change: '+89 this week',
    changeType: 'positive',
    icon: Award,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
  },
]

const recentActivity = [
  {
    id: 1,
    pet: 'Luna',
    action: 'Fed breakfast',
    time: '2 hours ago',
    type: 'feeding',
  },
  {
    id: 2,
    pet: 'Max',
    action: 'Weight recorded: 32kg',
    time: '1 day ago',
    type: 'health',
  },
  {
    id: 3,
    pet: 'Bella',
    action: 'Completed weekly batch',
    time: '2 days ago',
    type: 'feeding',
  },
  {
    id: 4,
    pet: 'Luna',
    action: 'Vet checkup scheduled',
    time: '3 days ago',
    type: 'health',
  },
]

const upcomingTasks = [
  {
    id: 1,
    task: 'Feed Luna dinner',
    time: 'In 2 hours',
    priority: 'high',
  },
  {
    id: 2,
    task: 'Weekly weigh-in for Max',
    time: 'Tomorrow',
    priority: 'medium',
  },
  {
    id: 3,
    task: 'Reorder chicken necks',
    time: 'In 3 days',
    priority: 'low',
  },
  {
    id: 4,
    task: 'Vet appointment for Bella',
    time: 'Next week',
    priority: 'medium',
  },
]

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your pets today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Reports
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Meal
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-medium">
                    {stat.change}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'feeding' 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                      : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                  }`}>
                    {activity.type === 'feeding' ? (
                      <Utensils className="h-4 w-4" />
                    ) : (
                      <Heart className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      <span className="text-primary">{activity.pet}</span> - {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Upcoming Tasks</h2>
              <Button variant="ghost" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    task.priority === 'high' 
                      ? 'bg-red-500' 
                      : task.priority === 'medium' 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{task.task}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {task.time}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Mark Done
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex-col">
              <Utensils className="h-6 w-6 mb-2" />
              Log Meal
            </Button>
            <Button variant="outline" className="h-24 flex-col">
              <Heart className="h-6 w-6 mb-2" />
              Add Health Data
            </Button>
            <Button variant="outline" className="h-24 flex-col">
              <Plus className="h-6 w-6 mb-2" />
              Add New Pet
            </Button>
            <Button variant="outline" className="h-24 flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              Schedule Task
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}