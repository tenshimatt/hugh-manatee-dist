'use client';

import { ConversationStarter } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConversationStartersProps {
  starters: ConversationStarter[];
  onSelect: (starter: ConversationStarter) => void;
  className?: string;
}

const categoryColors = {
  nutrition: 'bg-green-100 text-green-800 border-green-200',
  safety: 'bg-red-100 text-red-800 border-red-200',
  transition: 'bg-blue-100 text-blue-800 border-blue-200',
  portions: 'bg-purple-100 text-purple-800 border-purple-200',
  general: 'bg-muted text-muted-foreground border-border'
};

const categoryLabels = {
  nutrition: 'Nutrition',
  safety: 'Safety',
  transition: 'Transition',
  portions: 'Portions',
  general: 'General'
};

export function ConversationStarters({ 
  starters, 
  onSelect, 
  className = '' 
}: ConversationStartersProps) {
  const groupedStarters = starters.reduce((acc, starter) => {
    if (!acc[starter.category]) {
      acc[starter.category] = [];
    }
    acc[starter.category].push(starter);
    return acc;
  }, {} as Record<string, ConversationStarter[]>);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">🤖</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Hi! I&apos;m RAWGLE AI
          </h3>
          <p className="text-sm text-muted-foreground">
            Your expert assistant for raw pet feeding. Ask me anything or choose a topic below:
          </p>
        </div>
      </div>

      {/* Quick Start Questions */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          Popular Questions
        </h4>
        
        <div className="grid gap-3">
          {Object.entries(groupedStarters).map(([category, categoryStarters], categoryIndex) => (
            <motion.div 
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="space-y-2"
            >
              {/* Category Badge */}
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${categoryColors[category as keyof typeof categoryColors]}`}
                >
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </Badge>
              </div>

              {/* Category Questions */}
              <div className="space-y-2">
                {categoryStarters.map((starter, index) => (
                  <motion.div
                    key={starter.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (categoryIndex * 0.1) + (index * 0.05) }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => onSelect(starter)}
                      className="w-full justify-between text-left h-auto p-3 hover:bg-muted border border-transparent hover:border-border rounded-lg group transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5 flex-shrink-0">
                          {starter.icon}
                        </span>
                        <span className="text-sm text-foreground leading-relaxed">
                          {starter.text}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Additional Help */}
      <div className="pt-4 border-t border-gray-100">
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            💡 You can also type your own question or use voice input if available
          </p>
          <div className="flex flex-wrap gap-1 justify-center">
            <Badge variant="outline" className="text-xs text-gray-600">
              Safe ingredients
            </Badge>
            <Badge variant="outline" className="text-xs text-gray-600">
              Meal planning
            </Badge>
            <Badge variant="outline" className="text-xs text-gray-600">
              Supplements
            </Badge>
            <Badge variant="outline" className="text-xs text-gray-600">
              Health concerns
            </Badge>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800">
          <strong>Important:</strong> This AI provides general guidance only. 
          Always consult your veterinarian for specific health concerns or before 
          making significant dietary changes.
        </p>
      </div>
    </motion.div>
  );
}