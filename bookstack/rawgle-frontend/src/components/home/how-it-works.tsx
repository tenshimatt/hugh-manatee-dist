'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '1',
    title: 'Create Your Account',
    description: 'Sign up for free and add your pet profiles with their details.',
    emoji: '🐕',
  },
  {
    number: '2',
    title: 'Log Daily Feeding',
    description: 'Track meals, supplements, and health notes with our easy interface.',
    emoji: '🥩',
  },
  {
    number: '3',
    title: 'Connect & Learn',
    description: 'Join the community, share experiences, and get expert advice.',
    emoji: '👥',
  },
  {
    number: '4',
    title: 'Earn PAWS Tokens',
    description: 'Get rewarded for your contributions and redeem for discounts.',
    emoji: '🪙',
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-heading font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes and transform your pet's health journey
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full">
                  <svg className="w-full h-2" viewBox="0 0 100 10">
                    <path
                      d="M 0 5 L 100 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="5 5"
                      className="text-muted-foreground/30"
                    />
                  </svg>
                </div>
              )}
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-olivine to-charcoal text-white text-3xl font-bold mb-4">
                  {step.emoji}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}