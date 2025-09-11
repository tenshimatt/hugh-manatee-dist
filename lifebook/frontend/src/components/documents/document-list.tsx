'use client';

import React, { useState, useMemo, useCallback } from 'react';

// Types based on data model
interface Document {
  id: string;
  title: string;
  content: {
    sections: Array<{
      id: string;
      title: string;
      content: string;
      level: number;
      wordCount: number;
    }>;
    metadata: Record<string, any>;
  };
  wordCount: number;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  version: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  ownerId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer' | 'guest';
}

interface DocumentListProps {
  documents: Document[];
  users: User[];
  currentUserId: string;
  onDocumentClick?: (documentId: string) => void;
  onDocumentCreate?: () => void;
  onDocumentDelete?: (documentId: string) => void;
  onDocumentDuplicate?: (documentId: string) => void;
  onDocumentExport?: (documentId: string) => void;
  sortBy?: 'title' | 'updatedAt' | 'createdAt' | 'wordCount' | 'status';
  sortOrder?: 'asc' | 'desc';
  filterBy?: {
    status?: string[];
    createdBy?: string[];
    search?: string;
  };
  view?: 'grid' | 'list' | 'compact';
  showMetadata?: boolean;
  isReadOnly?: boolean;
  className?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  users,
  currentUserId,
  onDocumentClick,
  onDocumentCreate,
  onDocumentDelete,
  onDocumentDuplicate,
  onDocumentExport,
  sortBy = 'updatedAt',
  sortOrder = 'desc',
  filterBy = {},
  view = 'list',
  showMetadata = true,
  isReadOnly = false,
  className = ''
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Create user map for quick lookups
  const userMap = useMemo(() => {
    return new Map(users.map(user => [user.id, user]));
  }, [users]);

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;

    // Apply filters
    if (filterBy.status && filterBy.status.length > 0) {
      filtered = filtered.filter(doc => filterBy.status!.includes(doc.status));
    }

    if (filterBy.createdBy && filterBy.createdBy.length > 0) {
      filtered = filtered.filter(doc => filterBy.createdBy!.includes(doc.createdBy));
    }

    if (filterBy.search) {
      const searchLower = filterBy.search.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchLower) ||
        doc.content.sections.some(section =>
          section.title.toLowerCase().includes(searchLower) ||
          section.content.toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'wordCount':
          comparison = a.wordCount - b.wordCount;
          break;
        case 'status':
          const statusOrder = { 'draft': 0, 'review': 1, 'approved': 2, 'published': 3, 'archived': 4 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [documents, filterBy, sortBy, sortOrder]);

  // Handle document selection
  const handleDocumentSelect = useCallback((documentId: string, isSelected: boolean) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(documentId);
      } else {
        newSet.delete(documentId);
      }
      return newSet;
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((selectAll: boolean) => {
    if (selectAll) {
      setSelectedDocuments(new Set(filteredAndSortedDocuments.map(doc => doc.id)));
    } else {
      setSelectedDocuments(new Set());
    }
  }, [filteredAndSortedDocuments]);

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  // Render document item
  const renderDocumentItem = (document: Document) => {
    const creator = userMap.get(document.createdBy);
    const owner = userMap.get(document.ownerId);
    const isSelected = selectedDocuments.has(document.id);
    const isOwner = document.ownerId === currentUserId;

    if (view === 'compact') {
      return (
        <div
          key={document.id}
          className={`flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer border-l-4 ${
            isSelected ? 'bg-blue-50 border-blue-500' : 'border-transparent'
          }`}
          onClick={() => onDocumentClick?.(document.id)}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleDocumentSelect(document.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="mr-3"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 truncate">{document.title}</h3>
              <span className={getStatusBadge(document.status)}>{document.status}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{document.wordCount.toLocaleString()} words</span>
            <span>{formatDate(document.updatedAt)}</span>
          </div>
        </div>
      );
    }

    if (view === 'grid') {
      return (
        <div
          key={document.id}
          className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer ${
            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => onDocumentClick?.(document.id)}
        >
          <div className="flex items-start justify-between mb-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleDocumentSelect(document.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
            <div className="flex space-x-2">
              <span className={getStatusBadge(document.status)}>{document.status}</span>
            </div>
          </div>

          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{document.title}</h3>
          
          {document.content.sections.length > 0 && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {document.content.sections[0].content.substring(0, 100)}...
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              {creator?.avatar ? (
                <img src={creator.avatar} alt={creator.name} className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                  {creator?.name.charAt(0) || '?'}
                </div>
              )}
              <span>{creator?.name || 'Unknown'}</span>
            </div>
            <span>{document.wordCount.toLocaleString()} words</span>
          </div>

          <div className="mt-2 text-xs text-gray-400">
            Updated {formatDate(document.updatedAt)}
          </div>
        </div>
      );
    }

    // List view (default)
    return (
      <div
        key={document.id}
        className={`bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        }`}
        onClick={() => onDocumentClick?.(document.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleDocumentSelect(document.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">{document.title}</h3>
                <span className={getStatusBadge(document.status)}>{document.status}</span>
                {isOwner && <span className="text-xs text-blue-600">Owner</span>}
              </div>
              
              {showMetadata && (
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
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
                  <span>{document.wordCount.toLocaleString()} words</span>
                  <span>{document.content.sections.length} section{document.content.sections.length !== 1 ? 's' : ''}</span>
                  <span>v{document.version}</span>
                </div>
              )}
              
              {document.content.sections.length > 0 && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {document.content.sections[0].content.substring(0, 200)}...
                </p>
              )}
              
              <div className="text-xs text-gray-400">
                Created {formatDate(document.createdAt)} • Updated {formatDate(document.updatedAt)}
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isReadOnly && (
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDocumentExport?.(document.id);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Export document"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDocumentDuplicate?.(document.id);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Duplicate document"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              
              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this document?')) {
                      onDocumentDelete?.(document.id);
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete document"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const isAllSelected = selectedDocuments.size === filteredAndSortedDocuments.length && filteredAndSortedDocuments.length > 0;
  const isIndeterminate = selectedDocuments.size > 0 && selectedDocuments.size < filteredAndSortedDocuments.length;

  return (
    <div className={`document-list ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">
            Documents
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredAndSortedDocuments.length})
            </span>
          </h2>
          
          {filteredAndSortedDocuments.length > 0 && (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <span className="text-sm text-gray-600">Select all</span>
            </label>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {selectedDocuments.size > 0 && (
            <span className="text-sm text-gray-600">
              {selectedDocuments.size} selected
            </span>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Toggle filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          
          {!isReadOnly && (
            <button
              onClick={onDocumentCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              New Document
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b space-y-3">
          {/* Filter controls would go here */}
          <div className="text-sm text-gray-600">
            Filtering and sorting options can be implemented here
          </div>
        </div>
      )}

      {/* Document List */}
      <div className={`p-4 ${
        view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'
      }`}>
        {filteredAndSortedDocuments.length > 0 ? (
          filteredAndSortedDocuments.map(document => renderDocumentItem(document))
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">
              {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
            </p>
            {!isReadOnly && documents.length === 0 && (
              <button
                onClick={onDocumentCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create your first document
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList;