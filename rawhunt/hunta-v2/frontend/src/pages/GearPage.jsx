import React, { useState, useEffect } from 'react'

const GearPage = ({ apiBase }) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({
    item_name: '',
    brand: '',
    category: 'collar',
    rating: 5,
    pros: '',
    cons: '',
    review_text: '',
    recommended: true
  })

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      const response = await fetch(`${apiBase}/api/gear/reviews`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setReviews(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to load reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${apiBase}/api/gear/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReview)
      })
      
      if (response.ok) {
        await loadReviews()
        setShowReviewForm(false)
        setNewReview({
          item_name: '',
          brand: '',
          category: 'collar',
          rating: 5,
          pros: '',
          cons: '',
          review_text: '',
          recommended: true
        })
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
    }
  }

  const getCategoryIcon = (cat) => {
    const icons = {
      collar: '🦮',
      gps: '📱',
      whistle: '🔔',
      vest: '🦺',
      boots: '👢',
      training: '🎯',
      vehicle: '🚗',
      storage: '🎒',
      other: '⚡'
    }
    return icons[cat] || '⚡'
  }

  const getStarRating = (rating) => {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '⭐' : '')
  }

  const filteredReviews = reviews.filter(review => {
    if (category === 'all') return true
    return review.category === category
  })

  const categories = [
    { value: 'all', label: 'All Gear', icon: '⚡' },
    { value: 'collar', label: 'Collars', icon: '🦮' },
    { value: 'gps', label: 'GPS Units', icon: '📱' },
    { value: 'whistle', label: 'Whistles', icon: '🔔' },
    { value: 'vest', label: 'Dog Vests', icon: '🦺' },
    { value: 'boots', label: 'Dog Boots', icon: '👢' },
    { value: 'training', label: 'Training', icon: '🎯' },
    { value: 'vehicle', label: 'Vehicle', icon: '🚗' },
    { value: 'storage', label: 'Storage', icon: '🎒' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading gear reviews...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-hunta-green">⚡ Gear Reviews</h1>
          <p className="text-gray-600 mt-2">
            Honest reviews from experienced hunters. Find gear that performs when it matters most.
          </p>
        </div>
        <button
          onClick={() => setShowReviewForm(true)}
          className="btn-primary"
        >
          Write Review
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
              category === cat.value
                ? 'bg-hunta-green text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-hunta-green">Write a Gear Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={newReview.item_name}
                  onChange={(e) => setNewReview({...newReview, item_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                  placeholder="e.g., SportDOG TEK 2.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input
                  type="text"
                  required
                  value={newReview.brand}
                  onChange={(e) => setNewReview({...newReview, brand: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                  placeholder="e.g., SportDOG, Garmin, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newReview.category}
                  onChange={(e) => setNewReview({...newReview, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                >
                  <option value="collar">Collar</option>
                  <option value="gps">GPS Unit</option>
                  <option value="whistle">Whistle</option>
                  <option value="vest">Dog Vest</option>
                  <option value="boots">Dog Boots</option>
                  <option value="training">Training Equipment</option>
                  <option value="vehicle">Vehicle Equipment</option>
                  <option value="storage">Storage</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview({...newReview, rating: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                >
                  <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                  <option value="4">⭐⭐⭐⭐ Good</option>
                  <option value="3">⭐⭐⭐ Average</option>
                  <option value="2">⭐⭐ Poor</option>
                  <option value="1">⭐ Terrible</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pros</label>
              <textarea
                value={newReview.pros}
                onChange={(e) => setNewReview({...newReview, pros: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                placeholder="What did you like about this gear?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cons</label>
              <textarea
                value={newReview.cons}
                onChange={(e) => setNewReview({...newReview, cons: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                placeholder="What could be improved?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Review</label>
              <textarea
                value={newReview.review_text}
                onChange={(e) => setNewReview({...newReview, review_text: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                placeholder="Share your detailed experience with this gear..."
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="recommended"
                checked={newReview.recommended}
                onChange={(e) => setNewReview({...newReview, recommended: e.target.checked})}
                className="mr-2 text-hunta-green focus:ring-hunta-green"
              />
              <label htmlFor="recommended" className="text-sm text-gray-700">
                I would recommend this gear to other hunters
              </label>
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Submit Review
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚡</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {category === 'all' ? 'No reviews yet' : `No ${category} reviews yet`}
          </h3>
          <p className="text-gray-600 mb-4">
            Be the first to share your experience with hunting gear.
          </p>
          <button
            onClick={() => setShowReviewForm(true)}
            className="btn-primary"
          >
            Write First Review
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <div key={review.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">
                    {getCategoryIcon(review.category)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-hunta-green mb-1">
                      {review.item_name}
                    </h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-gray-600 font-medium">{review.brand}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-lg">{getStarRating(review.rating)}</span>
                      <span className="text-sm text-gray-600">({review.rating}/5)</span>
                    </div>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full capitalize ${
                      review.recommended 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {review.recommended ? '✓ Recommended' : '✗ Not Recommended'}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>

              {review.review_text && (
                <p className="text-gray-700 mb-4">{review.review_text}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {review.pros && (
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">✅ Pros</h4>
                    <p className="text-sm text-gray-600">{review.pros}</p>
                  </div>
                )}
                {review.cons && (
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">❌ Cons</h4>
                    <p className="text-sm text-gray-600">{review.cons}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  By {review.reviewer_name || 'Anonymous Hunter'}
                </div>
                <div className="flex space-x-2">
                  <button className="text-sm px-3 py-1 text-gray-600 hover:text-hunta-green">
                    👍 Helpful
                  </button>
                  <button className="text-sm px-3 py-1 text-gray-600 hover:text-hunta-green">
                    💬 Comment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gear Categories Overview */}
      {reviews.length > 0 && category === 'all' && (
        <div className="card bg-hunta-green text-white">
          <h3 className="text-xl font-bold mb-4">🏆 Top Rated Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.filter(c => c.value !== 'all').slice(0, 4).map((cat) => {
              const categoryReviews = reviews.filter(r => r.category === cat.value)
              const avgRating = categoryReviews.length > 0 
                ? (categoryReviews.reduce((sum, r) => sum + r.rating, 0) / categoryReviews.length).toFixed(1)
                : 0
              
              return (
                <div key={cat.value} className="text-center">
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-sm opacity-90">{cat.label}</div>
                  <div className="text-lg font-bold">
                    {avgRating > 0 ? `${avgRating}⭐` : 'No reviews'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">{reviews.length}</div>
            <div className="text-sm text-gray-600">Total Reviews</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {reviews.filter(r => r.recommended).length}
            </div>
            <div className="text-sm text-gray-600">Recommended</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {new Set(reviews.map(r => r.brand)).size}
            </div>
            <div className="text-sm text-gray-600">Brands</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GearPage