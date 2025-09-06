'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Wrench, 
  Clock, 
  Bell,
  Calendar,
  Scale,
  BarChart3,
  Activity,
  Pill,
  Brain,
  GraduationCap,
  ChefHat,
  Heart,
  Stethoscope,
  AlertTriangle,
  MapPin,
  Package,
  RotateCcw,
  Settings,
  BookOpen,
  Play,
  FileText,
  Video,
  Coins,
  Gift,
  Palette,
  Vote
} from 'lucide-react'
import Link from 'next/link'

interface ComingSoonPageProps {
  title: string
  description: string
  iconName?: keyof typeof iconMap
  features?: string[]
  backLink?: string
  backLinkText?: string
  estimatedLaunch?: string
}

// Icon map for easy selection
const iconMap = {
  Calendar,
  Scale,
  BarChart3,
  Activity,
  Pill,
  Brain,
  GraduationCap,
  ChefHat,
  Heart,
  Stethoscope,
  AlertTriangle,
  MapPin,
  Package,
  RotateCcw,
  Settings,
  BookOpen,
  Play,
  FileText,
  Video,
  Coins,
  Gift,
  Palette,
  Vote,
  Wrench,
} as const

export function ComingSoonPage({
  title,
  description,
  iconName = 'Wrench',
  features = [],
  backLink = '/dashboard',
  backLinkText = 'Back to Dashboard',
  estimatedLaunch
}: ComingSoonPageProps) {
  const IconComponent = iconMap[iconName as keyof typeof iconMap] || Wrench

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto text-center"
      >
        {/* Back Navigation */}
        <div className="mb-8 flex justify-start">
          <Link href={backLink}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backLinkText}
            </Button>
          </Link>
        </div>

        <Card className="p-8 sm:p-12">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="mx-auto w-24 h-24 bg-pumpkin/10 rounded-full flex items-center justify-center">
              <IconComponent className="h-12 w-12 text-pumpkin" />
            </div>
          </motion.div>

          {/* Title and Description */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {description}
            </p>
          </motion.div>

          {/* Estimated Launch */}
          {estimatedLaunch && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-sunglow/20 rounded-full">
                <Clock className="h-4 w-4 text-pumpkin" />
                <span className="text-sm font-medium text-charcoal">Estimated Launch: {estimatedLaunch}</span>
              </div>
            </motion.div>
          )}

          {/* Features Preview */}
          {features.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold mb-4">Coming Features</h3>
              <div className="grid gap-3 text-left max-w-md mx-auto">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-2 h-2 bg-pumpkin rounded-full flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Button disabled className="mb-4">
              <Bell className="h-4 w-4 mr-2" />
              Notify Me When Available
            </Button>
            <p className="text-xs text-muted-foreground">
              We&apos;re working hard to bring you this feature. Stay tuned!
            </p>
          </motion.div>
        </Card>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-pumpkin rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-pumpkin/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-pumpkin/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <span>Under Development</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}