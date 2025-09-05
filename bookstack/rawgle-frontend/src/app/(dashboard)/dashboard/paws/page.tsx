'use client'

import { motion } from 'framer-motion'
import { 
  Coins, 
  Wallet, 
  TrendingUp, 
  Gift,
  Star,
  Trophy,
  Activity,
  ExternalLink,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const pawsStats = [
  {
    label: 'Total Balance',
    value: '1,247',
    change: '+89 this week',
    icon: Coins,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
  },
  {
    label: 'This Month',
    value: '+342',
    change: '+12% vs last month',
    icon: TrendingUp,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/20'
  },
  {
    label: 'Rank',
    value: '#247',
    change: 'Top 10%',
    icon: Trophy,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
  }
]

const earningActivities = [
  { activity: 'Daily meal logging', paws: '+5', description: 'Log meals for all pets' },
  { activity: 'Weekly batch confirm', paws: '+25', description: 'Confirm weekly feeding schedule' },
  { activity: 'Community post', paws: '+10', description: 'Share knowledge with community' },
  { activity: 'Health data entry', paws: '+8', description: 'Track pet health metrics' },
  { activity: 'Recipe sharing', paws: '+15', description: 'Share raw feeding recipes' },
  { activity: 'Store review', paws: '+12', description: 'Review raw food suppliers' }
]

const recentTransactions = [
  { id: 1, type: 'earned', amount: '+5', activity: 'Daily meal logging', date: '2 hours ago' },
  { id: 2, type: 'earned', amount: '+10', activity: 'Community post', date: '1 day ago' },
  { id: 3, type: 'redeemed', amount: '-50', activity: 'Store discount', date: '3 days ago' },
  { id: 4, type: 'earned', amount: '+25', activity: 'Weekly batch confirm', date: '1 week ago' }
]

const rewards = [
  { name: '10% Store Discount', cost: 100, available: true },
  { name: 'Free Nutrition Consult', cost: 250, available: true },
  { name: 'Premium Features (1 month)', cost: 150, available: true },
  { name: 'Custom Recipe Plan', cost: 300, available: false },
  { name: 'Vet Directory Access', cost: 75, available: true },
  { name: 'RAWGLE Merchandise', cost: 200, available: true }
]

export default function PawsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Coins className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">PAWS Tokens</h1>
          </div>
          <p className="text-muted-foreground">
            Earn PAWS tokens by engaging with the community and caring for your pets
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
          <Button>
            <ExternalLink className="mr-2 h-4 w-4" />
            Trade PAWS
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {pawsStats.map((stat, index) => (
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
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Earning Opportunities */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <Zap className="h-5 w-5 text-yellow-500 mr-2" />
              <h2 className="text-xl font-semibold">Earn PAWS</h2>
            </div>
            <div className="space-y-4">
              {earningActivities.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{item.activity}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-600 font-bold mr-2">{item.paws}</span>
                    <Coins className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
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
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tx.activity}</p>
                    <p className="text-sm text-muted-foreground">{tx.date}</p>
                  </div>
                  <div className={`flex items-center ${
                    tx.type === 'earned' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className="font-bold mr-1">{tx.amount}</span>
                    <Coins className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Rewards Store */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Gift className="h-5 w-5 text-purple-500 mr-2" />
            <h2 className="text-xl font-semibold">Rewards Store</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  reward.available 
                    ? 'border-gray-200 hover:border-primary cursor-pointer' 
                    : 'border-gray-100 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{reward.name}</h3>
                  {!reward.available && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="font-bold text-yellow-600">{reward.cost}</span>
                    <Coins className="h-4 w-4 text-yellow-500 ml-1" />
                  </div>
                  <Button 
                    size="sm" 
                    variant={reward.available ? "default" : "ghost"}
                    disabled={!reward.available}
                  >
                    {reward.available ? "Redeem" : "Soon"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}