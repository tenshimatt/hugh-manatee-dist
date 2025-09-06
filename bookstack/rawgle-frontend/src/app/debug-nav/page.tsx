'use client'

import { MobileMenuDebug, PointerEventsTester } from '@/components/debug/MobileMenuDebug'

export default function DebugNavPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Navigation Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Mobile Menu Click Test</h2>
          <p className="text-gray-600 mb-4">
            This page tests mobile menu functionality. The debug components on the right 
            should help identify click interception issues.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium">Expected Behavior:</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 mt-2">
                <li>Mobile menu button should be clickable without delays</li>
                <li>Menu should open/close smoothly</li>
                <li>Menu items should respond to clicks immediately</li>
                <li>No 30-second timeouts on interactions</li>
              </ul>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium">Previous Issue:</h3>
              <p className="text-sm text-gray-700 mt-2">
                Playwright tests detected: <code>"div class="flex flex-col space-y-1.5 p-6" 
                from div class="min-h-screen" subtree intercepts pointer events"</code>
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium">Fixes Applied:</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 mt-2">
                <li>Increased z-index to z-[100] for header, z-[110] for mobile button</li>
                <li>Added explicit pointer-events: auto to navigation elements</li>
                <li>Added touch-action: manipulation for mobile optimization</li>
                <li>Added isolation: isolate to prevent stacking context issues</li>
                <li>Added relative positioning to main content with lower z-index</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Content Area</h2>
          <div className="flex flex-col space-y-1.5 p-6 bg-gray-100 rounded-lg">
            <p>This div matches the structure that was causing pointer event interception.</p>
            <p>It should no longer interfere with the mobile menu button clicks.</p>
            <p>Try clicking the mobile menu button (≡) in the top navigation.</p>
            <p>Also try the debug components on the right side of the screen.</p>
          </div>
          
          <div className="mt-6 space-y-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Test Button 1
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Test Button 2
            </button>
            <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Test Button 3
            </button>
          </div>
        </div>
      </div>
      
      {/* Debug Components */}
      <MobileMenuDebug />
      <PointerEventsTester />
    </div>
  )
}