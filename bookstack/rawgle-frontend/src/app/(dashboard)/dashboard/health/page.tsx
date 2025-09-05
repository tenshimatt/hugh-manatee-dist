'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Activity, 
  Plus, 
  Heart, 
  Weight,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Thermometer,
  Stethoscope,
  Pill,
  Syringe,
  BookOpen,
  FileText,
  Camera,
  BarChart3,
  LineChart,
  PieChart,
  Zap,
  Bell,
  Shield,
  Target,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const healthMetrics = [
  {
    pet: 'Luna',
    breed: 'Golden Retriever',
    age: '3 years',
    weight: { current: 28.0, change: 0.5, trend: 'up', target: 27.5, unit: 'kg' },
    temperature: { current: 38.2, normal: 38.5, status: 'normal', unit: '°C' },
    heartRate: { current: 85, range: '70-120', status: 'normal', unit: 'bpm' },
    lastCheckup: '2 weeks ago',
    nextCheckup: 'In 4 months',
    overallStatus: 'excellent',
    healthScore: 94,
    activeSymptoms: [],
    currentMedications: ['Heartworm Prevention'],
    allergies: ['Chicken'],
    chronicConditions: [],
    immunizations: { rabies: '2024-03-15', dhpp: '2024-03-15', bordetella: '2024-06-01' }
  },
  {
    pet: 'Max',
    breed: 'German Shepherd',
    age: '5 years',
    weight: { current: 32.0, change: -0.2, trend: 'down', target: 32.5, unit: 'kg' },
    temperature: { current: 38.7, normal: 38.5, status: 'normal', unit: '°C' },
    heartRate: { current: 92, range: '70-120', status: 'normal', unit: 'bpm' },
    lastCheckup: '1 month ago',
    nextCheckup: 'In 3 months',
    overallStatus: 'good',
    healthScore: 87,
    activeSymptoms: ['Mild joint stiffness'],
    currentMedications: ['Joint Supplement', 'Glucosamine'],
    allergies: ['Beef', 'Wheat'],
    chronicConditions: ['Early Hip Dysplasia'],
    immunizations: { rabies: '2024-01-20', dhpp: '2024-01-20', bordetella: '2024-04-15' }
  },
  {
    pet: 'Bella',
    breed: 'Labrador Mix',
    age: '2 years',
    weight: { current: 22.0, change: 0.0, trend: 'stable', target: 22.0, unit: 'kg' },
    temperature: { current: 38.4, normal: 38.5, status: 'normal', unit: '°C' },
    heartRate: { current: 95, range: '70-120', status: 'normal', unit: 'bpm' },
    lastCheckup: '3 weeks ago',
    nextCheckup: 'In 3 months',
    overallStatus: 'excellent',
    healthScore: 96,
    activeSymptoms: [],
    currentMedications: ['Flea & Tick Prevention'],
    allergies: [],
    chronicConditions: [],
    immunizations: { rabies: '2024-02-10', dhpp: '2024-02-10', bordetella: '2024-05-20' }
  }
]

const recentLogs = [
  { 
    id: 1, 
    pet: 'Luna', 
    type: 'weight', 
    value: '28kg', 
    date: '2 days ago', 
    note: 'Healthy weight gain, reaching target range',
    severity: 'normal',
    followUp: false
  },
  { 
    id: 2, 
    pet: 'Max', 
    type: 'symptom', 
    value: 'Joint stiffness in morning', 
    date: '1 week ago', 
    note: 'Monitoring closely, started glucosamine supplement',
    severity: 'mild',
    followUp: true
  },
  { 
    id: 3, 
    pet: 'Bella', 
    type: 'medication', 
    value: 'Flea & tick prevention applied', 
    date: '2 weeks ago', 
    note: 'Monthly preventive treatment - no adverse reactions',
    severity: 'normal',
    followUp: false
  },
  { 
    id: 4, 
    pet: 'Luna', 
    type: 'vet_visit', 
    value: 'Annual wellness exam', 
    date: '2 weeks ago', 
    note: 'Complete physical exam - all systems normal. Bloodwork pending.',
    severity: 'normal',
    followUp: true
  },
  {
    id: 5,
    pet: 'Max',
    type: 'vaccination',
    value: 'Bordetella booster',
    date: '1 month ago',
    note: 'Updated kennel cough protection for boarding',
    severity: 'normal',
    followUp: false
  }
]

const upcomingReminders = [
  {
    id: 1,
    pet: 'Max',
    type: 'medication',
    title: 'Joint Supplement',
    description: 'Daily glucosamine supplement',
    due: 'Today, 8:00 AM',
    overdue: false,
    priority: 'medium'
  },
  {
    id: 2,
    pet: 'Bella',
    type: 'checkup',
    title: 'Wellness Exam',
    description: '6-month health checkup',
    due: 'Tomorrow, 2:00 PM',
    overdue: false,
    priority: 'high'
  },
  {
    id: 3,
    pet: 'Luna',
    type: 'vaccination',
    title: 'DHPP Booster',
    description: 'Annual vaccination due',
    due: 'In 2 weeks',
    overdue: false,
    priority: 'high'
  },
  {
    id: 4,
    pet: 'Max',
    type: 'medication',
    title: 'Flea Prevention',
    description: 'Monthly flea & tick treatment',
    due: '3 days overdue',
    overdue: true,
    priority: 'high'
  }
]

const healthInsights = [
  {
    id: 1,
    type: 'weight',
    pet: 'Luna',
    title: 'Weight Trending Up',
    description: 'Luna has gained 0.5kg over the last month. Monitor portion sizes and activity levels.',
    recommendation: 'Consider reducing daily portions by 10% and increasing exercise duration.',
    priority: 'medium',
    actionable: true
  },
  {
    id: 2,
    type: 'symptom',
    pet: 'Max',
    title: 'Joint Health Alert',
    description: 'Morning stiffness patterns suggest early arthritis progression.',
    recommendation: 'Schedule orthopedic consultation and consider physical therapy.',
    priority: 'high',
    actionable: true
  },
  {
    id: 3,
    type: 'nutrition',
    pet: 'Bella',
    title: 'Optimal Health Maintained',
    description: 'All health metrics within ideal ranges. Current diet plan is working well.',
    recommendation: 'Continue current nutrition and exercise routine.',
    priority: 'low',
    actionable: false
  }
]

const vetContacts = [
  {
    id: 1,
    name: 'Riverside Veterinary Clinic',
    type: 'primary',
    doctor: 'Dr. Sarah Mitchell',
    phone: '(555) 123-4567',
    email: 'info@riversidevet.com',
    address: '123 Oak Street, Springfield',
    distance: '2.3 miles',
    rating: 4.9,
    specialties: ['Internal Medicine', 'Surgery', 'Dentistry'],
    emergency: false,
    nextAvailable: 'Tomorrow 10:00 AM'
  },
  {
    id: 2,
    name: '24/7 Emergency Animal Hospital',
    type: 'emergency',
    doctor: 'Dr. Michael Chen',
    phone: '(555) 911-PETS',
    email: 'emergency@animalher.com',
    address: '789 Emergency Blvd, Springfield',
    distance: '4.1 miles',
    rating: 4.7,
    specialties: ['Emergency Medicine', 'Critical Care', 'Surgery'],
    emergency: true,
    nextAvailable: 'Available 24/7'
  },
  {
    id: 3,
    name: 'Holistic Pet Wellness Center',
    type: 'specialist',
    doctor: 'Dr. Lisa Rodriguez',
    phone: '(555) 987-6543',
    email: 'wellness@holisticpets.com',
    address: '456 Wellness Way, Springfield',
    distance: '3.7 miles',
    rating: 4.8,
    specialties: ['Nutrition', 'Acupuncture', 'Herbal Medicine'],
    emergency: false,
    nextAvailable: 'Next week'
  }
]

export default function HealthPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPet, setSelectedPet] = useState('all')

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weight': return Weight
      case 'temperature': return Thermometer
      case 'symptom': return AlertTriangle
      case 'medication': return Pill
      case 'vaccination': return Syringe
      case 'vet_visit': return Stethoscope
      case 'checkup': return Calendar
      default: return Heart
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-12 w-12 text-red-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Health Tracking</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive health monitoring, insights, and veterinary care coordination
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          {[
            { label: "Pets Monitored", value: "3", icon: Heart, color: "red" },
            { label: "Overdue Items", value: "1", icon: AlertTriangle, color: "orange" },
            { label: "Avg Health Score", value: "92", icon: TrendingUp, color: "green" },
            { label: "Next Appointment", value: "Tomorrow", icon: Calendar, color: "blue" }
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

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center mb-8 space-x-1 bg-white rounded-xl p-2 shadow-lg max-w-3xl mx-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'metrics', label: 'Health Metrics', icon: LineChart },
            { id: 'reminders', label: 'Reminders', icon: Bell },
            { id: 'insights', label: 'AI Insights', icon: Zap },
            { id: 'vets', label: 'Veterinarians', icon: Stethoscope }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-red-500 text-white shadow-lg'
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
            <div className="space-y-8">
              {/* Pet Health Cards */}
              <div className="grid lg:grid-cols-3 gap-8">
                {healthMetrics.map((pet, index) => (
                  <motion.div
                    key={pet.pet}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{pet.pet}</h3>
                        <p className="text-gray-600">{pet.breed} • {pet.age}</p>
                      </div>
                      <div className={`text-right ${getHealthScoreColor(pet.healthScore)}`}>
                        <div className="text-2xl font-bold">{pet.healthScore}</div>
                        <div className="text-sm">Health Score</div>
                      </div>
                    </div>

                    {/* Vital Signs */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <Weight className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                        <div className="font-bold">{pet.weight.current}{pet.weight.unit}</div>
                        <div className="text-xs text-gray-500">Weight</div>
                      </div>
                      <div className="text-center">
                        <Thermometer className="h-5 w-5 text-red-500 mx-auto mb-1" />
                        <div className="font-bold">{pet.temperature.current}{pet.temperature.unit}</div>
                        <div className="text-xs text-gray-500">Temp</div>
                      </div>
                      <div className="text-center">
                        <Heart className="h-5 w-5 text-pink-500 mx-auto mb-1" />
                        <div className="font-bold">{pet.heartRate.current}</div>
                        <div className="text-xs text-gray-500">BPM</div>
                      </div>
                    </div>

                    {/* Active Issues */}
                    {pet.activeSymptoms.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Active Symptoms</h4>
                        <div className="space-y-1">
                          {pet.activeSymptoms.map((symptom, idx) => (
                            <div key={idx} className="flex items-center text-sm">
                              <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                              <span className="text-gray-700">{symptom}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medications */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Current Medications</h4>
                      <div className="space-y-1">
                        {pet.currentMedications.map((med, idx) => (
                          <div key={idx} className="flex items-center text-sm">
                            <Pill className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-gray-700">{med}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Next Checkup */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Next Checkup</span>
                        <span className="text-sm font-medium text-blue-600">{pet.nextCheckup}</span>
                      </div>
                    </div>

                    <Link 
                      href={`/dashboard/health/${pet.pet.toLowerCase()}`}
                      className="block w-full mt-4 bg-blue-500 text-white text-center py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      View Detailed Profile
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Health Activity</h2>
                  <Link href="/dashboard/health/logs" className="text-blue-600 hover:text-blue-700 font-medium">
                    View All Logs
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {recentLogs.map((log) => {
                    const IconComponent = getTypeIcon(log.type)
                    return (
                      <div key={log.id} className="flex items-start space-x-4 p-4 rounded-lg border hover:shadow-md transition-shadow">
                        <div className={`p-2 rounded-full ${
                          log.severity === 'normal' ? 'bg-green-100' :
                          log.severity === 'mild' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <IconComponent className={`h-5 w-5 ${
                            log.severity === 'normal' ? 'text-green-600' :
                            log.severity === 'mild' ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-gray-900">{log.pet} - {log.value}</h3>
                            <span className="text-sm text-gray-500">{log.date}</span>
                          </div>
                          <p className="text-sm text-gray-600">{log.note}</p>
                          {log.followUp && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Follow-up required
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reminders' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Health Reminders</h2>
                <Button className="bg-blue-500 text-white hover:bg-blue-600">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Reminder
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {upcomingReminders.map((reminder) => (
                  <motion.div
                    key={reminder.id}
                    whileHover={{ scale: 1.02 }}
                    className={`bg-white rounded-xl p-6 shadow-lg border-l-4 ${
                      reminder.overdue ? 'border-l-red-500' :
                      reminder.priority === 'high' ? 'border-l-orange-500' :
                      reminder.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        {getTypeIcon(reminder.type)({ className: "h-6 w-6 text-blue-500 mr-3" })}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{reminder.title}</h3>
                          <p className="text-gray-600">{reminder.pet}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(reminder.priority)}`}>
                        {reminder.priority}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{reminder.description}</p>

                    <div className="flex items-center justify-between">
                      <div className={`text-sm font-medium ${reminder.overdue ? 'text-red-600' : 'text-gray-600'}`}>
                        {reminder.due}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Snooze
                        </Button>
                        <Button size="sm" className="bg-green-500 text-white hover:bg-green-600">
                          Mark Done
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">AI Health Insights</h2>
                  <p className="text-gray-600">Personalized recommendations based on your pets&apos; health data</p>
                </div>
                <Button variant="outline">
                  <Target className="h-5 w-5 mr-2" />
                  Generate New Insights
                </Button>
              </div>
              
              <div className="space-y-6">
                {healthInsights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <Zap className="h-6 w-6 text-yellow-500 mr-3" />
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{insight.title}</h3>
                          <p className="text-gray-600">{insight.pet}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(insight.priority)}`}>
                        {insight.priority} priority
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{insight.description}</p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <Target className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Recommendation</h4>
                          <p className="text-blue-800 text-sm">{insight.recommendation}</p>
                        </div>
                      </div>
                    </div>

                    {insight.actionable && (
                      <div className="flex space-x-3">
                        <Button size="sm" className="bg-blue-500 text-white hover:bg-blue-600">
                          Take Action
                        </Button>
                        <Button size="sm" variant="outline">
                          Schedule Consultation
                        </Button>
                        <Button size="sm" variant="ghost">
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'vets' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Veterinary Contacts</h2>
                <Button className="bg-blue-500 text-white hover:bg-blue-600">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Veterinarian
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vetContacts.map((vet) => (
                  <motion.div
                    key={vet.id}
                    whileHover={{ scale: 1.05 }}
                    className="bg-white rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{vet.name}</h3>
                        <p className="text-gray-600">{vet.doctor}</p>
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                          vet.type === 'primary' ? 'bg-blue-100 text-blue-800' :
                          vet.type === 'emergency' ? 'bg-red-100 text-red-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {vet.type}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="font-medium">{vet.rating}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {vet.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {vet.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {vet.distance} away
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {vet.specialties.map((specialty, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">Next Available</span>
                        <span className="text-sm font-medium text-green-600">{vet.nextAvailable}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1 bg-blue-500 text-white hover:bg-blue-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Book
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions Floating Button */}
        <div className="fixed bottom-8 right-8">
          <div className="relative group">
            <Button className="bg-red-500 text-white hover:bg-red-600 rounded-full w-14 h-14 shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
            <div className="absolute bottom-16 right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-white rounded-lg shadow-lg border p-2 w-48">
                <Link href="/dashboard/health/log" className="block px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors">
                  <Camera className="h-4 w-4 mr-2 inline" />
                  Quick Health Log
                </Link>
                <Link href="/dashboard/health/symptoms" className="block px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors">
                  <AlertTriangle className="h-4 w-4 mr-2 inline" />
                  Report Symptom
                </Link>
                <Link href="/dashboard/health/medication" className="block px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors">
                  <Pill className="h-4 w-4 mr-2 inline" />
                  Log Medication
                </Link>
                <Link href="/dashboard/health/appointment" className="block px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors">
                  <Calendar className="h-4 w-4 mr-2 inline" />
                  Schedule Visit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}