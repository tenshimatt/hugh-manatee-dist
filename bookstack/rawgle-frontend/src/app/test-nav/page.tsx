'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function TestNavigation() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    console.log('Button clicked! Count:', count)
    setCount(count + 1)
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Navigation Test Page</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl">JavaScript Functionality Test</h2>
        <button 
          onClick={handleClick}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Click Test (Count: {count})
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl">Next.js Link Test</h2>
        <Link 
          href="/"
          className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Back to Home
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl">Console Log Test</h2>
        <button 
          onClick={() => {
            console.log('Console test button clicked')
            console.log('Window object:', typeof window !== 'undefined')
            console.log('React hydrated:', document.querySelector('[data-reactroot]') !== null)
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Console Test
        </button>
      </div>
    </div>
  )
}