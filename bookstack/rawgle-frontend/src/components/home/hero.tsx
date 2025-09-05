'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, ChefHat, Users, Coins, Heart, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="relative overflow-hidden pt-20 pb-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 text-6xl">🐕</div>
        <div className="absolute top-40 right-20 text-5xl">🥩</div>
        <div className="absolute bottom-20 left-1/3 text-4xl">🐾</div>
        <div className="absolute bottom-40 right-1/4 text-6xl">🦴</div>
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 bg-sunglow/20 dark:bg-sunglow/10 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-sunglow" />
              <span className="text-sm font-medium text-charcoal dark:text-sunglow">
                Join 10,000+ Raw Feeders
              </span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-heading font-bold mb-6">
              <span className="text-gradient">Raw Feeding</span>
              <br />
              Made Simple
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-lg">
              Track your pet&apos;s nutrition, connect with a thriving community, and earn PAWS tokens while giving your furry friend the diet they deserve.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/auth/register">
                <Button size="lg" className="btn-primary w-full sm:w-auto">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/find-stores">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <MapPin className="mr-2 h-5 w-5" />
                  Find Raw Food Near You
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-olivine">500+</div>
                <div className="text-sm text-muted-foreground">Partner Stores</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-charcoal">50K+</div>
                <div className="text-sm text-muted-foreground">Happy Pets</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-sunglow">1M+</div>
                <div className="text-sm text-muted-foreground">PAWS Earned</div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-white dark:bg-card rounded-2xl shadow-2xl p-6 border">
              {/* Mock Dashboard Preview */}
              <div className="space-y-4">
                {/* Pet Profile Card */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-olivine/10 to-charcoal/10 dark:from-olivine/5 dark:to-charcoal/5 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pumpkin to-olivine flex items-center justify-center text-2xl">
                    🐕
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Max</h3>
                    <p className="text-sm text-muted-foreground">Golden Retriever • 3 years</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-olivine">On Track</div>
                    <div className="text-xs text-muted-foreground">Last fed 2h ago</div>
                  </div>
                </div>

                {/* Today's Feeding */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-charcoal" />
                    Today&apos;s Feeding
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Morning: Chicken & Vegetables</span>
                      <span className="text-olivine">✓</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Evening: Beef & Organs</span>
                      <span className="text-muted-foreground">Pending</span>
                    </div>
                  </div>
                </div>

                {/* PAWS Balance */}
                <div className="p-4 bg-gradient-to-r from-sunglow to-pumpkin rounded-lg text-charcoal">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5" />
                      <span className="font-medium">PAWS Balance</span>
                    </div>
                    <div className="text-2xl font-bold">2,450</div>
                  </div>
                  <div className="text-sm mt-2 opacity-80">
                    +50 PAWS earned today
                  </div>
                </div>

                {/* Community Activity */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-olivine" />
                    Community Activity
                  </h4>
                  <div className="flex -space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-pumpkin to-olivine border-2 border-white dark:border-card" />
                    ))}
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-white dark:border-card">
                      +95
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Sarah just shared a new recipe
                  </p>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-olivine text-white px-3 py-1 rounded-full text-sm font-medium"
              >
                AI-Powered
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-sunglow text-charcoal px-3 py-1 rounded-full text-sm font-medium"
              >
                Earn Rewards
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}