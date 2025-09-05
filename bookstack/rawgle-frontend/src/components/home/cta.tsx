'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-olivine to-charcoal text-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              Limited Time: Get 1000 PAWS tokens on signup!
            </span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-heading font-bold mb-6">
            Ready to Transform Your Pet&apos;s Health?
          </h2>
          
          <p className="text-xl mb-8 text-white/90">
            Join thousands of pet parents who&apos;ve discovered the power of raw feeding. 
            Start tracking, earning rewards, and connecting with our community today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-olivine hover:bg-gray-100">
                Start Your Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Watch 2-Min Demo
              </Button>
            </Link>
          </div>

          <p className="text-sm text-white/70">
            No credit card required • Free forever plan • Cancel anytime
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold mb-1">Quick Setup</h3>
              <p className="text-sm text-white/80">Get started in under 2 minutes</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-semibold mb-1">Free Forever</h3>
              <p className="text-sm text-white/80">Core features always free</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🛡️</div>
              <h3 className="font-semibold mb-1">Data Privacy</h3>
              <p className="text-sm text-white/80">Your data, your control</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}