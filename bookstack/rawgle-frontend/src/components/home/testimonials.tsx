'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Golden Retriever Owner',
    avatar: '👩',
    content: 'RAWGLE transformed how I manage Max&apos;s diet. The weekly batch confirmation saves me so much time, and seeing his health improvements tracked over months is incredible!',
    rating: 5,
  },
  {
    name: 'Mike Chen',
    role: 'Husky & Shepherd Parent',
    avatar: '👨',
    content: 'Managing two dogs with different dietary needs was chaos before RAWGLE. Now I track everything effortlessly and even earned enough PAWS tokens for a month of free food!',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Cat Mom & Breeder',
    avatar: '👩‍🦰',
    content: 'The community support is amazing. When I transitioned my cats to raw, experienced feeders guided me every step. Plus the breeder tools help manage my entire cattery.',
    rating: 5,
  },
  {
    name: 'David Kim',
    role: 'Bulldog Enthusiast',
    avatar: '👨‍🦱',
    content: 'The AI nutrition assistant helped identify my bulldog&apos;s allergies. We eliminated problem ingredients and his skin issues cleared up within weeks. Life-changing!',
    rating: 5,
  },
  {
    name: 'Lisa Thompson',
    role: 'Multi-Pet Household',
    avatar: '👩‍🦳',
    content: 'With 3 dogs and 2 cats, RAWGLE is a lifesaver. The cost tracking alone saved me $200/month by optimizing bulk purchases through the co-op feature.',
    rating: 5,
  },
  {
    name: 'James Wilson',
    role: 'New Raw Feeder',
    avatar: '🧔',
    content: 'I was intimidated by raw feeding until I found RAWGLE. The transition wizard and mentor program made it so easy. My Lab has never been healthier!',
    rating: 5,
  },
]

export function Testimonials() {
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
              Loved by{' '}
              <span className="text-gradient">10,000+ Pet Parents</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See why the RAWGLE community is growing every day
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="h-full bg-card rounded-xl p-6 border relative">
                <Quote className="absolute top-4 right-4 w-8 h-8 text-muted-foreground/20" />
                
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-sunglow text-sunglow" />
                  ))}
                </div>

                <p className="text-muted-foreground mb-6 relative z-10">
                  &quot;{testimonial.content}&quot;
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pumpkin to-olivine flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground mb-6">Trusted by leading organizations</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold">🏆 Pet Nutrition Alliance</div>
            <div className="text-2xl font-bold">🌟 Raw Feeding Vets</div>
            <div className="text-2xl font-bold">🛡️ Canine Health Foundation</div>
            <div className="text-2xl font-bold">🎯 Holistic Pet Care</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}