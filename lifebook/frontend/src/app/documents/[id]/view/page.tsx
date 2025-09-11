'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import DocumentEditor from '../../../../components/editor/document-editor';
import SectionHierarchy from '../../../../components/editor/section-hierarchy';
import PresenceIndicators from '../../../../components/collaboration/presence-indicators';
import ExportDialog from '../../../../components/export/export-dialog';
import apiClient from '../../../../services/api-client';
import webSocketClient from '../../../../services/websocket-client';
import type { Document, Section, User, CollaborationSession, ExportRequest } from '../../../../services/api-client';

export default function DocumentViewPage() {
  const params = useParams();
  const documentId = params.id as string;
  
  // State management
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [collaborationSessions, setCollaborationSessions] = useState<CollaborationSession[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showTableOfContents, setShowTableOfContents] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [viewMode, setViewMode] = useState<'document' | 'presentation'>('document');

  // Load document data
  useEffect(() => {
    if (!documentId) return;
    loadDocumentData();
  }, [documentId]);

  // Initialize read-only collaboration
  useEffect(() => {
    if (currentUser && document) {
      initializeReadOnlyCollaboration();
    }
    
    return () => {
      webSocketClient.leaveDocument();
    };
  }, [currentUser, document]);

  const loadDocumentData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load current user
      const userResult = await apiClient.getCurrentUser();
      if (userResult.success) {
        setCurrentUser(userResult.data);
      }

      // Load document
      const documentResult = await apiClient.getDocument(documentId);
      if (!documentResult.success) {
        throw new Error(documentResult.error.message);
      }
      setDocument(documentResult.data);

      // Load document sections
      const sectionsResult = await apiClient.getDocumentSections(documentId);
      if (sectionsResult.success) {
        setSections(sectionsResult.data);
        // Auto-select first section
        if (sectionsResult.data.length > 0) {
          setSelectedSectionId(sectionsResult.data[0].id);
        }
      }

      // Load users for collaboration
      const usersResult = await apiClient.getUsers();
      if (usersResult.success) {
        setUsers(usersResult.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeReadOnlyCollaboration = async () => {
    if (!currentUser || !document) return;

    try {
      // Connect to WebSocket if not already connected
      if (!webSocketClient.isConnected()) {
        const mockToken = 'mock-jwt-token'; // In real app, get from auth context
        await webSocketClient.connect(mockToken, currentUser.id);
      }

      // Join document in read-only mode
      await webSocketClient.joinDocument(document.id);

      // Set up event listeners for viewer presence
      setupViewerEventListeners();

    } catch (err) {
      console.error('Failed to initialize read-only collaboration:', err);
    }
  };

  const setupViewerEventListeners = () => {
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
  };

  // Navigation handlers
  const handleSectionSelect = useCallback((sectionId: string) => {
    setSelectedSectionId(sectionId);
    
    // Scroll to section
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Export functionality
  const handleExport = useCallback(async (request: ExportRequest): Promise<string> => {
    const result = await apiClient.createExport(request);
    if (result.success) {
      return result.data.exportId;
    } else {
      throw new Error(result.error.message);
    }
  }, []);

  const handleExportDownload = useCallback(async (exportId: string) => {
    const result = await apiClient.downloadExport(exportId);
    if (result.success) {
      // Create download link
      const url = URL.createObjectURL(result.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${document?.title || 'export'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('Download failed: ' + result.error.message);
    }
  }, [document]);

  // Print functionality
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Font size adjustment
  const adjustFontSize = useCallback((delta: number) => {
    setFontSize(prev => Math.max(12, Math.min(24, prev + delta)));
  }, []);

  // Render document content
  const renderDocumentContent = () => {
    if (!document) return null;

    const sortedSections = sections.sort((a, b) => a.order - b.order);

    return (
      <div className="max-w-4xl mx-auto">
        {/* Document header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {document.title}
          </h1>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              document.status === 'published' ? 'bg-green-100 text-green-800' :
              document.status === 'approved' ? 'bg-blue-100 text-blue-800' :
              document.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {document.status}
            </span>
            <span>Version {document.version}</span>
            <span>•</span>
            <span>{document.wordCount.toLocaleString()} words</span>
            <span>•</span>
            <span>Updated {new Date(document.updatedAt).toLocaleDateString()}</span>
          </div>

          {/* Document metadata */}
          {document.metadata && Object.keys(document.metadata).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Document Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {Object.entries(document.metadata).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="ml-2 text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Table of Contents */}
        {showTableOfContents && sortedSections.length > 0 && (
          <div className="mb-8 bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h2>
            <nav className="space-y-2">
              {sortedSections.map(section => (
                <button
                  key={section.id}
                  onClick={() => handleSectionSelect(section.id)}
                  className="block w-full text-left hover:text-blue-600 transition-colors"
                  style={{ paddingLeft: `${section.level * 20}px` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {section.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {section.wordCount} words
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Document sections */}
        <div className="prose prose-lg max-w-none">
          {sortedSections.length > 0 ? (
            sortedSections.map(section => (
              <div
                key={section.id}
                id={`section-${section.id}`}
                className={`mb-8 scroll-mt-8 ${
                  selectedSectionId === section.id ? 'ring-2 ring-blue-200 rounded-lg p-4' : ''
                }`}
              >
                <div className={`mb-4 ${
                  section.level === 0 ? 'text-3xl' :
                  section.level === 1 ? 'text-2xl' :
                  section.level === 2 ? 'text-xl' :
                  section.level === 3 ? 'text-lg' :
                  'text-base'
                } font-semibold text-gray-900`}>
                  {section.title}
                </div>
                
                <div 
                  className="text-gray-700 leading-relaxed"
                  style={{ fontSize: `${fontSize}px` }}
                  dangerouslySetInnerHTML={{
                    __html: section.content.replace(/\n/g, '<br />')
                  }}
                />
                
                {section.wordCount > 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    {section.wordCount} words
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No content available</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">
            {error || 'Document not found'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                  {document.title}
                </h1>
                <p className="text-sm text-gray-500">Read-only view</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Collaboration indicators */}
              {currentUser && (
                <PresenceIndicators
                  documentId={document.id}
                  currentUserId={currentUser.id}
                  collaborationSessions={collaborationSessions}
                  users={users}
                  maxVisibleUsers={3}
                />
              )}

              {/* View controls */}
              <div className="flex items-center space-x-1 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => adjustFontSize(-2)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Decrease font size"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                
                <span className="px-2 text-sm text-gray-600 min-w-[3rem] text-center">
                  {fontSize}px
                </span>
                
                <button
                  onClick={() => adjustFontSize(2)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Increase font size"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>

              <button
                onClick={() => setShowTableOfContents(!showTableOfContents)}
                className={`p-2 rounded-lg transition-colors ${
                  showTableOfContents 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Toggle table of contents"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>

              <button
                onClick={handlePrint}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Print document"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>

              <button
                onClick={() => setShowExportDialog(true)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Export
              </button>
              
              <button
                onClick={() => window.location.href = `/documents/${document.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Table of Contents */}
          {showTableOfContents && sections.length > 0 && (
            <div className="w-80 flex-none">
              <div className="sticky top-24">
                <SectionHierarchy
                  sections={sections}
                  selectedSectionId={selectedSectionId}
                  onSectionSelect={handleSectionSelect}
                  isReadOnly={true}
                  className="bg-white border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Document content */}
          <div className="flex-1">
            {renderDocumentContent()}
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          document={{
            id: document.id,
            title: document.title,
            wordCount: document.wordCount,
            status: document.status,
            sections: sections.map(section => ({
              id: section.id,
              title: section.title,
              level: section.level,
              wordCount: section.wordCount
            }))
          }}
          onExport={handleExport}
          onDownload={handleExportDownload}
        />
      )}
    </div>
  );
}