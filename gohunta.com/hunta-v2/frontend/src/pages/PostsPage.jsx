import React, { useState, useEffect } from 'react'

const PostsPage = ({ apiBase }) => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    post_type: 'success',
    location: '',
    hunt_date: '',
    dogs_involved: '',
    image: null
  })

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const response = await fetch(`${apiBase}/api/posts`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPosts(data.data.posts || [])
          return
        }
      }
    } catch (error) {
      console.error('Failed to load posts:', error)
    }
    
    // Fallback demo data if API fails
    setPosts([
      {
        id: 1,
        title: "Opening Day Success in Nebraska Sandhills",
        content: "Had an incredible hunt this morning with Rex and Bella. The dogs worked perfectly together, holding point for over 5 minutes while I approached. Harvested two roosters in perfect weather conditions. The training over the summer really paid off!",
        postType: "story",
        locationName: "Nebraska Sandhills",
        huntDate: "2024-11-15",
        weatherConditions: "Clear skies, 45°F, light wind",
        username: "HunterMike",
        userImage: null,
        likesCount: 12,
        commentsCount: 3,
        createdAt: "2024-11-15T08:30:00Z"
      },
      {
        id: 2,
        title: "Training Progress: Steady Point Improvement",
        content: "Working with Sadie on her point steadiness. She's holding for 30+ seconds consistently now. Using live pigeons in a controlled environment has really helped build her confidence.",
        postType: "story", 
        locationName: "Training Field",
        huntDate: "2024-11-14",
        weatherConditions: "Training session with Sadie",
        username: "DogTrainer_Sarah",
        userImage: null,
        likesCount: 8,
        commentsCount: 1,
        createdAt: "2024-11-14T16:00:00Z"
      },
      {
        id: 3,
        title: "New GPS Collar Review - Garmin Alpha 300i",
        content: "Just upgraded to the Garmin Alpha 300i system. The tracking accuracy is incredible and the mapping features are game-changing for hunting new territory. Battery life is excellent too.",
        postType: "story",
        locationName: null,
        huntDate: null,
        weatherConditions: "Garmin Alpha 300i GPS collar system",
        username: "GearGuru_Tom",
        userImage: null,
        likesCount: 15,
        commentsCount: 5,
        createdAt: "2024-11-13T12:00:00Z"
      }
    ])
    setLoading(false)
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    try {
      const postData = {
        title: newPost.title,
        content: newPost.content,
        postType: newPost.post_type,
        locationName: newPost.location,
        huntDate: newPost.hunt_date,
        weatherConditions: newPost.dogs_involved,
        privacyLevel: 'public'
      }
      
      const response = await fetch(`${apiBase}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      })
      
      if (response.ok) {
        await loadPosts()
      } else {
        // Fallback: Add to demo data
        const newDemoPost = {
          id: Date.now(),
          title: newPost.title,
          content: newPost.content,
          postType: newPost.post_type,
          locationName: newPost.location,
          huntDate: newPost.hunt_date,
          weatherConditions: newPost.dogs_involved,
          username: "Demo User",
          userImage: null,
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date().toISOString()
        }
        setPosts(prevPosts => [newDemoPost, ...prevPosts])
      }
      
      setShowCreateForm(false)
      setNewPost({
        title: '',
        content: '',
        post_type: 'success',
        location: '',
        hunt_date: '',
        dogs_involved: '',
        image: null
      })
    } catch (error) {
      console.error('Failed to create post:', error)
      
      // Fallback: Add to demo data even on error
      const newDemoPost = {
        id: Date.now(),
        title: newPost.title,
        content: newPost.content,
        postType: newPost.post_type,
        locationName: newPost.location,
        huntDate: newPost.hunt_date,
        weatherConditions: newPost.dogs_involved,
        username: "Demo User",
        userImage: null,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString()
      }
      setPosts(prevPosts => [newDemoPost, ...prevPosts])
      
      setShowCreateForm(false)
      setNewPost({
        title: '',
        content: '',
        post_type: 'success',
        location: '',
        hunt_date: '',
        dogs_involved: '',
        image: null
      })
    }
  }

  const handleLikePost = async (postId) => {
    try {
      const response = await fetch(`${apiBase}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        // Update like count in real posts
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, likesCount: (post.likesCount || 0) + 1 }
              : post
          )
        )
      } else {
        // Fallback: Update demo data
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, likesCount: (post.likesCount || 0) + 1 }
              : post
          )
        )
      }
    } catch (error) {
      console.error('Failed to like post:', error)
      // Fallback: Update demo data even on error
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, likesCount: (post.likesCount || 0) + 1 }
            : post
        )
      )
    }
  }

  const getPostTypeIcon = (type) => {
    switch (type) {
      case 'success': return '🏆'
      case 'training': return '🎯'
      case 'tips': return '💡'
      case 'gear': return '⚡'
      case 'story': return '📖'
      default: return '📸'
    }
  }

  const getPostTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'training': return 'bg-blue-100 text-blue-800'
      case 'tips': return 'bg-yellow-100 text-yellow-800'
      case 'gear': return 'bg-purple-100 text-purple-800'
      case 'story': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true
    return post.postType === filter
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const timeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading brag board...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-hunta-green">📸 Brag Board & Journal</h1>
          <p className="text-gray-600 mt-2">
            Share your hunting successes, training progress, and field stories with the community.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          Share Post
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {['all', 'success', 'training', 'tips', 'gear', 'story'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
              filter === filterType
                ? 'bg-hunta-green text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{filterType !== 'all' ? getPostTypeIcon(filterType) : '📸'}</span>
            <span className="capitalize">{filterType === 'all' ? 'All Posts' : filterType}</span>
          </button>
        ))}
      </div>

      {/* Create Post Form */}
      {showCreateForm && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4 text-hunta-green">Share Your Story</h3>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                  placeholder="e.g., Perfect Point on Opening Day"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Post Type</label>
                <select
                  value={newPost.post_type}
                  onChange={(e) => setNewPost({...newPost, post_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                >
                  <option value="success">Success Story</option>
                  <option value="training">Training Progress</option>
                  <option value="tips">Tips & Advice</option>
                  <option value="gear">Gear Review</option>
                  <option value="story">Field Story</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newPost.location}
                  onChange={(e) => setNewPost({...newPost, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                  placeholder="e.g., Nebraska Sandhills"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hunt Date</label>
                <input
                  type="date"
                  value={newPost.hunt_date}
                  onChange={(e) => setNewPost({...newPost, hunt_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dogs Involved</label>
                <input
                  type="text"
                  value={newPost.dogs_involved}
                  onChange={(e) => setNewPost({...newPost, dogs_involved: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                  placeholder="e.g., Rex, Bella"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Story</label>
              <textarea
                required
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
                placeholder="Share the details of your hunt, training session, or story..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo Upload (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewPost({...newPost, image: e.target.files[0]})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hunta-green focus:border-hunta-green"
              />
              <p className="text-sm text-gray-500 mt-1">Share photos of your hunt, dog, or gear (JPG, PNG, max 5MB)</p>
              {newPost.image && (
                <div className="mt-3">
                  <img 
                    src={URL.createObjectURL(newPost.image)} 
                    alt="Preview" 
                    className="max-w-xs max-h-48 rounded-lg shadow-sm"
                  />
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Share Post
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts Feed */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📸</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No posts yet' : `No ${filter} posts yet`}
          </h3>
          <p className="text-gray-600 mb-4">
            Be the first to share your hunting story or experience.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            Share First Post
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <div key={post.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">
                    {getPostTypeIcon(post.postType)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-hunta-green mb-1">
                      {post.title}
                    </h3>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPostTypeColor(post.postType)}`}>
                        {post.postType}
                      </span>
                      <span>by {post.username || 'Anonymous Hunter'}</span>
                      <span>•</span>
                      <span>{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {(post.locationName || post.huntDate || post.weatherConditions) && (
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {post.locationName && (
                      <div className="flex items-center space-x-1">
                        <span>📍</span>
                        <span>{post.locationName}</span>
                      </div>
                    )}
                    {post.huntDate && (
                      <div className="flex items-center space-x-1">
                        <span>📅</span>
                        <span>{formatDate(post.huntDate)}</span>
                      </div>
                    )}
                    {post.weatherConditions && (
                      <div className="flex items-center space-x-1">
                        <span>🌤️</span>
                        <span>{post.weatherConditions}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-gray-700 leading-relaxed">
                  {post.content.split('\n').map((paragraph, index) => (
                    <p key={index} className={index > 0 ? 'mt-3' : ''}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-4">
                  <button 
                    onClick={() => handleLikePost(post.id)}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-hunta-green transition-colors"
                  >
                    <span>👍</span>
                    <span>{post.likesCount || 0} Likes</span>
                  </button>
                  <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-hunta-green">
                    <span>💬</span>
                    <span>{post.commentsCount || 0} Comments</span>
                  </button>
                  <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-hunta-green">
                    <span>📤</span>
                    <span>Share</span>
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  Post #{post.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Community Stats */}
      {posts.length > 0 && filter === 'all' && (
        <div className="card bg-hunta-green text-white">
          <h3 className="text-xl font-bold mb-4">🏆 Community Highlights</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {posts.filter(p => p.postType === 'story').length}
              </div>
              <div className="text-sm opacity-90">Success Stories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {posts.reduce((sum, p) => sum + (p.likesCount || 0), 0)}
              </div>
              <div className="text-sm opacity-90">Total Likes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {new Set(posts.map(p => p.locationName).filter(Boolean)).size}
              </div>
              <div className="text-sm opacity-90">Hunt Locations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {posts.filter(p => p.weatherConditions).length}
              </div>
              <div className="text-sm opacity-90">Weather Notes</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {posts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">{posts.length}</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {new Set(posts.map(p => p.username).filter(Boolean)).size}
            </div>
            <div className="text-sm text-gray-600">Contributors</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {posts.filter(p => new Date(p.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length}
            </div>
            <div className="text-sm text-gray-600">This Week</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {posts.filter(p => p.postType === 'story').length}
            </div>
            <div className="text-sm text-gray-600">Stories Shared</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostsPage