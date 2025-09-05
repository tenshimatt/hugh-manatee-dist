'use client'

import { motion } from 'framer-motion'
import { Coins, TrendingUp, Users, Shield, Gift, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const benefits = [
  {
    icon: Coins,
    title: 'Earn Daily',
    description: 'Get PAWS for logging meals, sharing recipes, and helping others',
  },
  {
    icon: TrendingUp,
    title: 'Stake & Grow',
    description: 'Stake your PAWS tokens to earn up to 15% APY rewards',
  },
  {
    icon: Gift,
    title: 'Exclusive Discounts',
    description: 'Redeem PAWS for discounts at 500+ partner stores',
  },
  {
    icon: Users,
    title: 'Governance Rights',
    description: 'Vote on platform features and community initiatives',
  },
  {
    icon: Shield,
    title: 'NFT Badges',
    description: 'Unlock achievement NFTs for milestones and contributions',
  },
  {
    icon: Zap,
    title: 'Priority Features',
    description: 'PAWS holders get early access to new features',
  },
]

export function PawsToken() {
  return (
    <section className="py-20 bg-gradient-to-b from-sunglow/5 to-white dark:from-sunglow/5 dark:to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-sunglow/20 dark:bg-sunglow/10 px-4 py-2 rounded-full mb-6">
              <Coins className="w-4 h-4 text-sunglow" />
              <span className="text-sm font-medium text-charcoal dark:text-sunglow">
                Powered by Solana Blockchain
              </span>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-heading font-bold mb-4">
              Introducing{' '}
              <span className="gradient-paws bg-clip-text text-transparent">PAWS Token</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The first cryptocurrency designed for the raw pet food community. Earn, stake, and spend PAWS while contributing to your pet&apos;s health journey.
            </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <div className="absolute inset-0 gradient-paws opacity-20 blur-3xl" />
              <div className="relative bg-card rounded-2xl p-8 border shadow-xl">
                <div className="text-center mb-6">
                  <div className="text-8xl mb-4">🪙</div>
                  <h3 className="text-2xl font-bold mb-2">PAWS Token</h3>
                  <p className="text-muted-foreground">Utility Token for Raw Feeders</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Total Supply</span>
                    <span className="font-semibold">100,000,000 PAWS</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Current Price</span>
                    <span className="font-semibold text-olivine">$0.025 USD</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Market Cap</span>
                    <span className="font-semibold">$2.5M USD</span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Holders</span>
                    <span className="font-semibold">10,543</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <Button className="btn-paws w-full">Buy PAWS</Button>
                  <Button variant="outline" className="w-full">Learn More</Button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold mb-6">Token Benefits</h3>
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg gradient-paws flex items-center justify-center">
                    <benefit.icon className="w-5 h-5 text-charcoal" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Token Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card rounded-2xl p-8 border"
        >
          <h3 className="text-2xl font-semibold mb-6 text-center">Token Distribution</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-olivine mb-2">40%</div>
              <div className="text-sm font-medium mb-1">Community Rewards</div>
              <div className="text-xs text-muted-foreground">Daily activities & contributions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-charcoal mb-2">25%</div>
              <div className="text-sm font-medium mb-1">Ecosystem Fund</div>
              <div className="text-xs text-muted-foreground">Platform development</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-sunglow mb-2">20%</div>
              <div className="text-sm font-medium mb-1">Staking Rewards</div>
              <div className="text-xs text-muted-foreground">Long-term holders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">15%</div>
              <div className="text-sm font-medium mb-1">Team & Advisors</div>
              <div className="text-xs text-muted-foreground">Vested over 3 years</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}