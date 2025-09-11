'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DocumentList from '../../components/documents/document-list';
import TemplateSelector from '../../components/templates/template-selector';
import SearchInterface from '../../components/search/search-interface';
import PresenceIndicators from '../../components/collaboration/presence-indicators';
import apiClient from '../../services/api-client';
import webSocketClient from '../../services/websocket-client';
import type { Document, User, Template, SearchResult, SearchFilters, CollaborationSession } from '../../services/api-client';

interface DashboardStats {
  totalDocuments: number;
  totalWordCount: number;
  activeCollaborations: number;
  recentActivity: number;
}

export default function DashboardPage() {
  // State management
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [collaborationSessions, setCollaborationSessions] = useState<CollaborationSession[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalDocuments: 0,
    totalWordCount: 0,
    activeCollaborations: 0,
    recentActivity: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'documents' | 'templates' | 'search'>('documents');

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load current user
      const userResult = await apiClient.getCurrentUser();
      if (userResult.success) {
        setCurrentUser(userResult.data);
        
        // Initialize WebSocket connection
        // Note: In real app, token would come from auth context
        const mockToken = 'mock-jwt-token';
        await webSocketClient.connect(mockToken, userResult.data.id);
      }

      // Load documents
      const documentsResult = await apiClient.getDocuments();
      if (documentsResult.success) {
        setDocuments(documentsResult.data);
      }

      // Load templates
      const templatesResult = await apiClient.getTemplates();
      if (templatesResult.success) {
        setTemplates(templatesResult.data);
      }

      // Load users
      const usersResult = await apiClient.getUsers();
      if (usersResult.success) {
        setUsers(usersResult.data);
      }

      // Calculate dashboard stats
      if (documentsResult.success) {
        const docs = documentsResult.data;
        setDashboardStats({
          totalDocuments: docs.length,
          totalWordCount: docs.reduce((sum, doc) => sum + doc.wordCount, 0),
          activeCollaborations: docs.filter(doc => doc.status === 'review').length,
          recentActivity: docs.filter(doc => {
            const updated = new Date(doc.updatedAt);
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return updated > dayAgo;
          }).length
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket event handlers
  useEffect(() => {
    if (!webSocketClient.isConnected()) return;

    const handleUserJoined = (session: CollaborationSession) => {
      setCollaborationSessions(prev => [...prev.filter(s => s.id !== session.id), session]);
    };

    const handleUserLeft = (data: { userId: string; documentId: string }) => {
      setCollaborationSessions(prev => prev.filter(s => 
        !(s.userId === data.userId && s.documentId === data.documentId)
      ));
    };

    webSocketClient.on('user:joined', handleUserJoined);
    webSocketClient.on('user:left', handleUserLeft);

    return () => {
      webSocketClient.off('user:joined', handleUserJoined);
      webSocketClient.off('user:left', handleUserLeft);
    };
  }, []);

  // Event handlers
  const handleDocumentClick = useCallback((documentId: string) => {
    window.location.href = `/documents/${documentId}/edit`;
  }, []);

  const handleDocumentCreate = useCallback(() => {
    window.location.href = '/documents/new';
  }, []);

  const handleDocumentDelete = useCallback(async (documentId: string) => {
    const result = await apiClient.deleteDocument(documentId);
    if (result.success) {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } else {
      alert('Failed to delete document: ' + result.error.message);
    }
  }, []);

  const handleDocumentDuplicate = useCallback(async (documentId: string) => {
    const originalDoc = documents.find(doc => doc.id === documentId);
    if (!originalDoc) return;

    const duplicateData = {
      ...originalDoc,
      title: `${originalDoc.title} (Copy)`,
      status: 'draft' as const,
    };
    delete (duplicateData as any).id;
    delete (duplicateData as any).createdAt;
    delete (duplicateData as any).updatedAt;

    const result = await apiClient.createDocument(duplicateData);
    if (result.success) {
      setDocuments(prev => [result.data, ...prev]);
    } else {
      alert('Failed to duplicate document: ' + result.error.message);
    }
  }, [documents]);

  const handleTemplateSelect = useCallback(async (template: Template) => {
    const result = await apiClient.createDocumentFromTemplate(template.id);
    if (result.success) {
      window.location.href = `/documents/${result.data.id}/edit`;
    } else {
      alert('Failed to create document from template: ' + result.error.message);
    }
  }, []);

  const handleSearch = useCallback(async (query: string, filters: SearchFilters) => {
    const result = await apiClient.search(query, filters);
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error.message);
    }
  }, []);

  const handleSearchResultClick = useCallback((result: SearchResult) => {
    window.location.href = `/documents/${result.documentId}/view`;
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">Error loading dashboard</p>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {currentUser?.name || 'User'}
              </p>
            </div>
            
            {/* Collaboration indicator */}
            {currentUser && (
              <PresenceIndicators
                documentId="dashboard"
                currentUserId={currentUser.id}
                collaborationSessions={collaborationSessions}
                users={users}
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Documents</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalDocuments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Words</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalWordCount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Collaborations</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.activeCollaborations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recent Activity</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.recentActivity}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setSelectedView('documents')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedView === 'documents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Documents
              </button>
              <button
                onClick={() => setSelectedView('templates')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedView === 'templates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setSelectedView('search')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedView === 'search'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Search
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {selectedView === 'documents' && (
              <DocumentList
                documents={documents}
                users={users}
                currentUserId={currentUser?.id || ''}
                onDocumentClick={handleDocumentClick}
                onDocumentCreate={handleDocumentCreate}
                onDocumentDelete={handleDocumentDelete}
                onDocumentDuplicate={handleDocumentDuplicate}
                view="list"
                showMetadata={true}
              />
            )}

            {selectedView === 'templates' && (
              <TemplateSelector
                templates={templates}
                users={users}
                currentUserId={currentUser?.id || ''}
                onTemplateSelect={handleTemplateSelect}
                view="grid"
              />
            )}

            {selectedView === 'search' && (
              <SearchInterface
                onSearch={handleSearch}
                users={users}
                onResultClick={handleSearchResultClick}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}