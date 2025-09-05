'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const stats = [
  { label: 'Active Users', value: 10543, suffix: '+', prefix: '' },
  { label: 'Meals Tracked', value: 2500000, suffix: '+', prefix: '' },
  { label: 'PAWS Distributed', value: 5000000, suffix: '', prefix: '' },
  { label: 'Partner Stores', value: 523, suffix: '', prefix: '' },
]

function Counter({ value, suffix, prefix }: { value: number; suffix: string; prefix: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 50
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  return (
    <span>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  )
}

export function Stats() {
  return (
    <section className="py-16 bg-gradient-to-r from-olivine to-charcoal text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl lg:text-4xl font-bold mb-2">
                <Counter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              </div>
              <div className="text-sm text-white/80">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}