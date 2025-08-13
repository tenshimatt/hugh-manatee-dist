import React, { useState, useEffect } from 'react'

const EthicsPage = ({ apiBase }) => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [bookmarkedArticles, setBookmarkedArticles] = useState([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareArticle, setShareArticle] = useState(null)

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      const response = await fetch(`${apiBase}/api/ethics/articles`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setArticles(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to load articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { value: 'all', label: 'All Topics', icon: '📚' },
    { value: 'safety', label: 'Safety', icon: '🛡️' },
    { value: 'regulations', label: 'Regulations', icon: '⚖️' },
    { value: 'conservation', label: 'Conservation', icon: '🌱' },
    { value: 'training', label: 'Training Ethics', icon: '🎯' },
    { value: 'landowner', label: 'Landowner Relations', icon: '🤝' },
    { value: 'wildlife', label: 'Wildlife Respect', icon: '🦌' }
  ]

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category)
    return cat ? cat.icon : '📚'
  }

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.key_points?.some(point => point.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const toggleBookmark = (articleId) => {
    setBookmarkedArticles(prev => {
      if (prev.includes(articleId)) {
        return prev.filter(id => id !== articleId)
      } else {
        return [...prev, articleId]
      }
    })
  }

  const handleShare = (article) => {
    setShareArticle(article)
    setShowShareModal(true)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Link copied to clipboard!')
      setShowShareModal(false)
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading ethics knowledge base...</div>
      </div>
    )
  }

  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center space-x-2 text-hunta-green hover:text-hunta-green-light"
          >
            <span>←</span>
            <span>Back to Articles</span>
          </button>
        </div>

        <article className="card">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">{getCategoryIcon(selectedArticle.category)}</span>
              <span className="px-3 py-1 bg-hunta-green text-white text-sm rounded-full capitalize">
                {selectedArticle.category}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-hunta-green mb-2">
              {selectedArticle.title}
            </h1>
            <div className="text-gray-600 mb-4">
              Updated {formatDate(selectedArticle.updated_at)}
            </div>
            {selectedArticle.summary && (
              <p className="text-lg text-gray-700 border-l-4 border-hunta-green pl-4 italic">
                {selectedArticle.summary}
              </p>
            )}
          </div>

          <div className="prose max-w-none">
            {selectedArticle.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {selectedArticle.key_points && selectedArticle.key_points.length > 0 && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-bold text-green-800 mb-3">Key Points to Remember</h3>
              <ul className="space-y-2">
                {selectedArticle.key_points.map((point, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-green-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Article ID: {selectedArticle.id}
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => handleShare(selectedArticle)}
                  className="text-sm px-3 py-1 text-gray-600 hover:text-hunta-green"
                >
                  📤 Share
                </button>
                <button 
                  onClick={() => toggleBookmark(selectedArticle.id)}
                  className={`text-sm px-3 py-1 ${
                    bookmarkedArticles.includes(selectedArticle.id) 
                      ? 'text-hunta-green' 
                      : 'text-gray-600 hover:text-hunta-green'
                  }`}
                >
                  {bookmarkedArticles.includes(selectedArticle.id) ? '🔖' : '📄'} Bookmark
                </button>
                <button className="text-sm px-3 py-1 text-gray-600 hover:text-hunta-green">
                  📝 Feedback
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-hunta-green">📚 Ethics Knowledge Base</h1>
          <p className="text-gray-600 mt-2">
            Essential guidance for responsible hunting practices and ethical conduct in the field.
          </p>
        </div>
        <button className="btn-primary">
          Suggest Topic
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search ethics articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hunta-green focus:border-hunta-green"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            🔍
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
              selectedCategory === cat.value
                ? 'bg-hunta-green text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Featured Article */}
      {articles.length > 0 && selectedCategory === 'all' && (
        <div className="card bg-hunta-green text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">🌟 Featured Article</h3>
              <p className="text-white/90 mb-3">
                "Hunter Education and Continuous Learning" - The foundation of ethical hunting
              </p>
              <button
                onClick={() => setSelectedArticle(articles[0])}
                className="bg-white text-hunta-green px-4 py-2 rounded font-medium hover:bg-gray-100"
              >
                Read Article
              </button>
            </div>
            <div className="text-6xl opacity-20">
              📚
            </div>
          </div>
        </div>
      )}

      {/* Articles List */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {selectedCategory === 'all' ? 'No articles available' : `No ${selectedCategory} articles yet`}
          </h3>
          <p className="text-gray-600 mb-4">
            We're building our ethics knowledge base. Check back soon for essential guidance.
          </p>
          <button className="btn-primary">
            Suggest Topic
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedArticle(article)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getCategoryIcon(article.category)}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                    {article.category}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(article.updated_at)}
                </div>
              </div>

              <h3 className="text-xl font-bold text-hunta-green mb-2 hover:text-hunta-green-light">
                {article.title}
              </h3>

              {article.summary && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {article.summary}
                </p>
              )}

              {article.key_points && article.key_points.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Key Topics:</div>
                  <div className="flex flex-wrap gap-1">
                    {article.key_points.slice(0, 3).map((point, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                      >
                        {point.split(' ').slice(0, 3).join(' ')}...
                      </span>
                    ))}
                    {article.key_points.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{article.key_points.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  5 min read
                </div>
                <div className="flex items-center space-x-1 text-hunta-green hover:text-hunta-green-light">
                  <span className="text-sm">Read Article</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ethics Principles */}
      {selectedCategory === 'all' && (
        <>
          <div className="card bg-blue-50 border border-blue-200">
            <h3 className="text-lg font-bold mb-4 text-blue-800">🏛️ Core Hunting Ethics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-blue-700 mb-2">🛡️ Safety First</h4>
                <p className="text-sm text-blue-600">
                  Hunter safety is paramount. Always identify your target and what's beyond it.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-blue-700 mb-2">⚖️ Follow Laws</h4>
                <p className="text-sm text-blue-600">
                  Know and obey all hunting laws, regulations, and licensing requirements.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-blue-700 mb-2">🌱 Conserve Wildlife</h4>
                <p className="text-sm text-blue-600">
                  Practice sustainable hunting that supports wildlife conservation efforts.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-blue-700 mb-2">🤝 Respect Others</h4>
                <p className="text-sm text-blue-600">
                  Respect landowners, other hunters, and non-hunters sharing outdoor spaces.
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Procedures */}
          <div className="card bg-red-50 border border-red-200">
            <h3 className="text-lg font-bold mb-4 text-red-800">🚨 Emergency Procedures & First Aid</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-red-700 mb-2">📞 Emergency Contacts</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• Emergency Services: 911</li>
                  <li>• GPS coordinates ready</li>
                  <li>• Local ranger station number</li>
                  <li>• Hunting party emergency contact</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-red-700 mb-2">🩹 First Aid Essentials</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• Pressure bandages for bleeding</li>
                  <li>• Trauma shears and gauze</li>
                  <li>• Emergency blanket</li>
                  <li>• Pain medication and antiseptic</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-red-700 mb-2">⚡ Immediate Response</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• Secure the area and weapons</li>
                  <li>• Apply direct pressure to wounds</li>
                  <li>• Keep victim calm and warm</li>
                  <li>• Call for help immediately</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-red-700 mb-2">📍 Location Sharing</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• Share GPS coordinates</li>
                  <li>• Use what3words app</li>
                  <li>• Describe landmarks clearly</li>
                  <li>• Stay on the line with dispatch</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
              <p className="text-sm text-red-800">
                <strong>Remember:</strong> Take a wilderness first aid course before hunting season. 
                Practice emergency scenarios with your hunting group.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Quick Stats */}
      {articles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">{articles.length}</div>
            <div className="text-sm text-gray-600">Total Articles</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {new Set(articles.map(a => a.category)).size}
            </div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {articles.filter(a => a.category === 'safety').length}
            </div>
            <div className="text-sm text-gray-600">Safety Articles</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-hunta-green">
              {articles.reduce((sum, a) => sum + (a.key_points?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Key Points</div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && shareArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-hunta-green">Share Article</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">{shareArticle.title}</h4>
              <p className="text-sm text-gray-600">{shareArticle.summary}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => copyToClipboard(`${window.location.origin}/ethics?article=${shareArticle.id}`)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-hunta-green text-white rounded hover:bg-hunta-green-light"
              >
                <span>🔗</span>
                <span>Copy Link</span>
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareArticle.title)}&url=${encodeURIComponent(window.location.origin + '/ethics?article=' + shareArticle.id)}`, '_blank')}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <span>🐦</span>
                  <span>Twitter</span>
                </button>
                
                <button
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/ethics?article=' + shareArticle.id)}`, '_blank')}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <span>📘</span>
                  <span>Facebook</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EthicsPage