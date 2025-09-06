'use client'

import { motion } from 'framer-motion'
import { 
  Dog, 
  Heart, 
  Star, 
  MapPin,
  Calculator,
  Calendar,
  ShoppingCart,
  MessageCircle,
  TrendingUp,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Check,
  Play
} from 'lucide-react'

const colorPalette = {
  pumpkin: {
    name: 'Pumpkin',
    hex: '#fe7f2d',
    usage: 'Primary buttons, CTAs, highlights',
    className: 'bg-pumpkin'
  },
  sunglow: {
    name: 'Sunglow',
    hex: '#fcca46',
    usage: 'Secondary buttons, accents, success states',
    className: 'bg-sunglow'
  },
  charcoal: {
    name: 'Charcoal',
    hex: '#333333',
    usage: 'Dark backgrounds, primary text',
    className: 'bg-charcoal'
  },
  olivine: {
    name: 'Olivine',
    hex: '#a1c181',
    usage: 'Success states, green elements, nature theme',
    className: 'bg-olivine'
  },
  zomp: {
    name: 'Zomp',
    hex: '#519d9e',
    usage: 'Info states, blue/teal accents',
    className: 'bg-zomp'
  }
}

const buttonExamples = [
  { class: 'btn btn-primary', text: 'Primary Button', description: 'Main actions (pumpkin)' },
  { class: 'btn btn-secondary', text: 'Secondary Button', description: 'Secondary actions (sunglow)' },
  { class: 'btn btn-outline', text: 'Outline Button', description: 'Subtle actions' },
  { class: 'btn btn-success', text: 'Success Button', description: 'Positive actions (olivine)' },
  { class: 'btn btn-info', text: 'Info Button', description: 'Info actions (zomp)' },
  { class: 'btn btn-warning', text: 'Warning Button', description: 'Warning actions (sunglow)' },
  { class: 'btn btn-danger', text: 'Danger Button', description: 'Destructive actions (red)' }
]

export default function StyleGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-charcoal to-zomp text-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Dog className="h-12 w-12 text-sunglow" />
              <span className="text-4xl font-heading font-bold">RAWGLE</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Design System Style Guide
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Complete reference for maintaining UI consistency across the RAWGLE platform
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-16">
        {/* Color Palette */}
        <section>
          <h2 className="text-3xl font-heading font-bold mb-8">Color Palette</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {Object.entries(colorPalette).map(([key, color]) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className={`${color.className} h-24 w-full rounded-lg mb-4 shadow-lg`}></div>
                <h3 className="font-heading font-semibold text-lg">{color.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{color.hex}</p>
                <p className="text-xs text-muted-foreground mt-2">{color.usage}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-3xl font-heading font-bold mb-8">Typography</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Headings (Poppins)</h3>
              <div className="space-y-2">
                <h1 className="text-4xl font-heading font-bold">H1 - Main Headlines</h1>
                <h2 className="text-3xl font-heading font-bold">H2 - Section Headers</h2>
                <h3 className="text-2xl font-heading font-bold">H3 - Subsections</h3>
                <h4 className="text-xl font-heading font-bold">H4 - Component Titles</h4>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Body Text (Inter)</h3>
              <div className="space-y-2">
                <p className="text-lg">Large body text - for important descriptions</p>
                <p className="text-base">Regular body text - standard paragraph text</p>
                <p className="text-sm">Small text - captions, labels, metadata</p>
                <p className="text-xs">Extra small text - fine print, footnotes</p>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-3xl font-heading font-bold mb-8">Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buttonExamples.map((button, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="text-center p-6 border rounded-lg"
              >
                <button className={button.class}>
                  {button.text}
                </button>
                <p className="text-sm text-muted-foreground mt-2">{button.description}</p>
                <code className="text-xs bg-muted px-2 py-1 rounded mt-2 block">{button.class}</code>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Gradients */}
        <section>
          <h2 className="text-3xl font-heading font-bold mb-8">Brand Gradients</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="h-24 bg-gradient-to-r from-pumpkin to-sunglow rounded-lg mb-4"></div>
              <h3 className="font-semibold">Pumpkin to Sunglow</h3>
              <code className="text-xs bg-muted px-2 py-1 rounded">bg-gradient-to-r from-pumpkin to-sunglow</code>
            </div>
            <div className="text-center">
              <div className="h-24 bg-gradient-to-r from-charcoal to-zomp rounded-lg mb-4"></div>
              <h3 className="font-semibold">Charcoal to Zomp</h3>
              <code className="text-xs bg-muted px-2 py-1 rounded">bg-gradient-to-r from-charcoal to-zomp</code>
            </div>
            <div className="text-center">
              <div className="h-24 bg-gradient-to-r from-olivine to-zomp rounded-lg mb-4"></div>
              <h3 className="font-semibold">Olivine to Zomp</h3>
              <code className="text-xs bg-muted px-2 py-1 rounded">bg-gradient-to-r from-olivine to-zomp</code>
            </div>
            <div className="text-center">
              <div className="h-24 text-gradient-brand text-4xl font-bold flex items-center justify-center bg-white rounded-lg">RAWGLE</div>
              <h3 className="font-semibold">Text Gradient</h3>
              <code className="text-xs bg-muted px-2 py-1 rounded">text-gradient-brand</code>
            </div>
          </div>
        </section>

        {/* Interactive Elements */}
        <section>
          <h2 className="text-3xl font-heading font-bold mb-8">Interactive Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-border card-hover">
              <Dog className="h-12 w-12 text-pumpkin mb-4" />
              <h3 className="font-heading font-semibold mb-2">Hover Card</h3>
              <p className="text-sm text-muted-foreground">Uses card-hover class for lift effect</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-border card-hover">
              <Calculator className="h-12 w-12 text-olivine mb-4" />
              <h3 className="font-heading font-semibold mb-2">Interactive Card</h3>
              <p className="text-sm text-muted-foreground">Hover to see the animation</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-border card-hover">
              <MapPin className="h-12 w-12 text-zomp mb-4" />
              <h3 className="font-heading font-semibold mb-2">Feature Card</h3>
              <p className="text-sm text-muted-foreground">Consistent spacing and typography</p>
            </div>
          </div>
        </section>

        {/* Icons */}
        <section>
          <h2 className="text-3xl font-heading font-bold mb-8">Icon Usage</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {[
              { icon: Dog, color: 'text-pumpkin', name: 'Dog' },
              { icon: Heart, color: 'text-sunglow', name: 'Heart' },
              { icon: Star, color: 'text-olivine', name: 'Star' },
              { icon: MapPin, color: 'text-zomp', name: 'MapPin' },
              { icon: Calculator, color: 'text-pumpkin', name: 'Calculator' },
              { icon: Calendar, color: 'text-sunglow', name: 'Calendar' },
              { icon: ShoppingCart, color: 'text-olivine', name: 'ShoppingCart' },
              { icon: MessageCircle, color: 'text-zomp', name: 'MessageCircle' }
            ].map((item, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <item.icon className={`h-8 w-8 mx-auto mb-2 ${item.color}`} />
                <p className="text-xs">{item.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Usage Examples */}
        <section>
          <h2 className="text-3xl font-heading font-bold mb-8">Usage Examples</h2>
          <div className="space-y-8">
            {/* Hero Section Example */}
            <div className="bg-gradient-to-r from-charcoal to-zomp text-white p-8 rounded-lg">
              <h3 className="text-2xl font-heading font-bold mb-4">Hero Section</h3>
              <p className="mb-6">Example of branded hero section with proper color usage</p>
              <div className="flex gap-4">
                <button className="btn btn-secondary">Get Started</button>
                <button className="btn btn-outline bg-white text-charcoal hover:bg-white/80">Learn More</button>
              </div>
            </div>

            {/* Feature Grid Example */}
            <div className="bg-white p-8 rounded-lg border">
              <h3 className="text-2xl font-heading font-bold mb-6">Feature Grid</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-pumpkin/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-pumpkin" />
                  </div>
                  <h4 className="font-semibold mb-2">Analytics</h4>
                  <p className="text-sm text-muted-foreground">Track your pet's progress</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-olivine/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-olivine" />
                  </div>
                  <h4 className="font-semibold mb-2">Community</h4>
                  <p className="text-sm text-muted-foreground">Connect with other pet parents</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-sunglow/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-sunglow" />
                  </div>
                  <h4 className="font-semibold mb-2">Rewards</h4>
                  <p className="text-sm text-muted-foreground">Earn PAWS tokens</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Development Notes */}
        <section className="bg-muted p-8 rounded-lg">
          <h2 className="text-3xl font-heading font-bold mb-6">Development Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">✅ Do</h3>
              <ul className="space-y-2 text-sm">
                <li>• Use RAWGLE brand colors consistently</li>
                <li>• Apply proper hover states with transitions</li>
                <li>• Use Poppins for headings, Inter for body text</li>
                <li>• Include proper accessibility attributes</li>
                <li>• Use semantic HTML elements</li>
                <li>• Test on mobile and desktop</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">❌ Don't</h3>
              <ul className="space-y-2 text-sm">
                <li>• Use random colors outside the palette</li>
                <li>• Skip hover and focus states</li>
                <li>• Mix different font families inconsistently</li>
                <li>• Ignore mobile responsiveness</li>
                <li>• Use tiny touch targets on mobile</li>
                <li>• Forget loading and error states</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}