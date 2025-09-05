import Link from 'next/link'
import { Github, Twitter, Facebook, Instagram, Youtube, Mail } from 'lucide-react'

const footerLinks = {
  Product: [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'PAWS Token', href: '/paws' },
    { name: 'Mobile App', href: '/mobile' },
    { name: 'API', href: '/api' },
  ],
  Learn: [
    { name: 'Getting Started', href: '/learn/getting-started' },
    { name: 'Courses', href: '/learn/courses' },
    { name: 'Guides', href: '/learn/guides' },
    { name: 'Blog', href: '/blog' },
    { name: 'FAQ', href: '/faq' },
  ],
  Community: [
    { name: 'Forum', href: '/community' },
    { name: 'Events', href: '/events' },
    { name: 'Mentorship', href: '/mentorship' },
    { name: 'Success Stories', href: '/stories' },
    { name: 'Ambassadors', href: '/ambassadors' },
  ],
  Company: [
    { name: 'About', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Partners', href: '/partners' },
    { name: 'Contact', href: '/contact' },
  ],
  Legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Data Security', href: '/security' },
    { name: 'GDPR', href: '/gdpr' },
  ],
}

const socialLinks = [
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/rawgle' },
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/rawgle' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/rawgle' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/@rawgle' },
  { name: 'GitHub', icon: Github, href: 'https://github.com/rawgle' },
]

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="text-3xl">🐾</div>
              <span className="text-2xl font-heading font-bold text-gradient">RAWGLE</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              The complete platform for raw pet food feeders.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-3">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="border-t border-b py-8 mb-8">
          <div className="grid lg:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="font-semibold mb-2">Stay Updated</h3>
              <p className="text-sm text-muted-foreground">
                Get the latest raw feeding tips, PAWS token updates, and community news.
              </p>
            </div>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>
            © {new Date().getFullYear()} RAWGLE. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/sitemap" className="hover:text-foreground transition-colors">
              Sitemap
            </Link>
            <Link href="/accessibility" className="hover:text-foreground transition-colors">
              Accessibility
            </Link>
            <Link href="/status" className="hover:text-foreground transition-colors">
              Status
            </Link>
            <a
              href="mailto:support@rawgle.com"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              Support
            </a>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-wrap justify-center items-center gap-6 opacity-60">
            <div className="text-xs">🔒 SSL Secured</div>
            <div className="text-xs">🛡️ GDPR Compliant</div>
            <div className="text-xs">⚡ Powered by Cloudflare</div>
            <div className="text-xs">🪙 Built on Solana</div>
            <div className="text-xs">🌱 Carbon Neutral</div>
          </div>
        </div>
      </div>
    </footer>
  )
}