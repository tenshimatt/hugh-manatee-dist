'use client';

import React, { useState, useMemo, useCallback } from 'react';

// Types based on data model
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: {
    sections: Array<{
      title: string;
      level: number;
      content: string;
      placeholder?: string;
    }>;
    metadata: Record<string, any>;
  };
  defaultContent: {
    title: string;
    sections: Array<{
      title: string;
      content: string;
    }>;
  };
  metadata: {
    estimatedLength: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    industry?: string;
    useCase?: string[];
  };
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface TemplateSelectorProps {
  templates: Template[];
  users: User[];
  currentUserId: string;
  onTemplateSelect?: (template: Template) => void;
  onTemplatePreview?: (template: Template) => void;
  onCreateTemplate?: () => void;
  onEditTemplate?: (templateId: string) => void;
  onDeleteTemplate?: (templateId: string) => void;
  filterBy?: {
    category?: string[];
    difficulty?: string[];
    tags?: string[];
    createdBy?: string[];
  };
  sortBy?: 'name' | 'usageCount' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  view?: 'grid' | 'list';
  isReadOnly?: boolean;
  className?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  users,
  currentUserId,
  onTemplateSelect,
  onTemplatePreview,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  filterBy = {},
  sortBy = 'usageCount',
  sortOrder = 'desc',
  view = 'grid',
  isReadOnly = false,
  className = ''
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Create user map for quick lookups
  const userMap = useMemo(() => {
    return new Map(users.map(user => [user.id, user]));
  }, [users]);

  // Get unique categories
  const categories = useMemo(() => {
    const categorySet = new Set(templates.map(t => t.category));
    return Array.from(categorySet).sort();
  }, [templates]);

  // Get unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    templates.forEach(t => t.metadata.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [templates]);

  // Filter and sort templates
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.metadata.tags.some(tag => tag.toLowerCase().includes(query)) ||
        template.category.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filterBy.category && filterBy.category.length > 0) {
      filtered = filtered.filter(t => filterBy.category!.includes(t.category));
    }

    if (filterBy.difficulty && filterBy.difficulty.length > 0) {
      filtered = filtered.filter(t => filterBy.difficulty!.includes(t.metadata.difficulty));
    }

    if (filterBy.tags && filterBy.tags.length > 0) {
      filtered = filtered.filter(t =>
        filterBy.tags!.some(tag => t.metadata.tags.includes(tag))
      );
    }

    if (filterBy.createdBy && filterBy.createdBy.length > 0) {
      filtered = filtered.filter(t => filterBy.createdBy!.includes(t.createdBy));
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'usageCount':
          comparison = a.usageCount - b.usageCount;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [templates, searchQuery, filterBy, sortBy, sortOrder]);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  }, [onTemplateSelect]);

  // Handle template preview
  const handleTemplatePreview = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
    onTemplatePreview?.(template);
  }, [onTemplatePreview]);

  // Get difficulty badge styling
  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded text-xs font-medium ${styles[difficulty as keyof typeof styles] || styles.beginner}`;
  };

  // Format usage count
  const formatUsageCount = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}m`;
  };

  // Render template card
  const renderTemplateCard = (template: Template) => {
    const creator = userMap.get(template.createdBy);
    const isOwner = template.createdBy === currentUserId;
    const isSelected = selectedTemplate?.id === template.id;

    if (view === 'list') {
      return (
        <div
          key={template.id}
          className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => handleTemplateSelect(template)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  {template.category}
                </span>
                <span className={getDifficultyBadge(template.metadata.difficulty)}>
                  {template.metadata.difficulty}
                </span>
                {!template.isPublic && isOwner && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">
                    Private
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {template.description}
              </p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  {creator?.avatar ? (
                    <img src={creator.avatar} alt={creator.name} className="w-4 h-4 rounded-full" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                      {creator?.name.charAt(0) || '?'}
                    </div>
                  )}
                  <span>by {creator?.name || 'Unknown'}</span>
                </div>
                <span>Used {formatUsageCount(template.usageCount)} times</span>
                <span>~{template.metadata.estimatedLength.toLocaleString()} words</span>
              </div>
              
              {template.metadata.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.metadata.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {template.metadata.tags.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      +{template.metadata.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTemplatePreview(template);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Preview template"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              
              {!isReadOnly && isOwner && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTemplate?.(template.id);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit template"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this template?')) {
                        onDeleteTemplate?.(template.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete template"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Grid view
    return (
      <div
        key={template.id}
        className={`bg-white rounded-lg border p-4 hover:shadow-lg transition-all cursor-pointer ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        }`}
        onClick={() => handleTemplateSelect(template)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                {template.category}
              </span>
              <span className={getDifficultyBadge(template.metadata.difficulty)}>
                {template.metadata.difficulty}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{template.name}</h3>
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTemplatePreview(template);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Preview"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {template.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            {creator?.avatar ? (
              <img src={creator.avatar} alt={creator.name} className="w-4 h-4 rounded-full" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                {creator?.name.charAt(0) || '?'}
              </div>
            )}
            <span>{creator?.name || 'Unknown'}</span>
          </div>
          <span>~{template.metadata.estimatedLength.toLocaleString()} words</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Used {formatUsageCount(template.usageCount)} times
          </div>
          
          {template.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.metadata.tags.slice(0, 2).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {tag}
                </span>
              ))}
              {template.metadata.tags.length > 2 && (
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  +{template.metadata.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`template-selector ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">
            Document Templates
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredAndSortedTemplates.length})
            </span>
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Toggle filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          
          {!isReadOnly && (
            <button
              onClick={onCreateTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Create Template
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="usageCount">Most Popular</option>
                <option value="name">Name</option>
                <option value="createdAt">Newest</option>
                <option value="updatedAt">Recently Updated</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Templates Grid/List */}
      <div className="p-4">
        {filteredAndSortedTemplates.length > 0 ? (
          <div className={view === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
            : 'space-y-4'
          }>
            {filteredAndSortedTemplates.map(template => renderTemplateCard(template))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">
              {searchQuery || Object.values(filterBy).some(f => f && f.length > 0)
                ? 'No templates match your criteria'
                : 'No templates available'
              }
            </p>
            {!isReadOnly && (
              <button
                onClick={onCreateTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create your first template
              </button>
            )}
          </div>
        )}
      </div>

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                <p className="text-sm text-gray-600">{selectedTemplate.category}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="mb-4">
                <p className="text-gray-700">{selectedTemplate.description}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Structure Preview:</h4>
                  <div className="bg-gray-50 rounded p-3">
                    {selectedTemplate.structure.sections.map((section, index) => (
                      <div key={index} className="mb-2 last:mb-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-gray-500">
                            {'#'.repeat(section.level + 1)}
                          </span>
                          <span className="text-sm font-medium">{section.title}</span>
                        </div>
                        {section.placeholder && (
                          <p className="text-xs text-gray-500 ml-4 italic">
                            {section.placeholder}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Estimated length: {selectedTemplate.metadata.estimatedLength.toLocaleString()} words
                  </div>
                  <button
                    onClick={() => {
                      setShowPreview(false);
                      handleTemplateSelect(selectedTemplate);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Use This Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;