'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import DocumentEditor from '../../../../components/editor/document-editor';
import SectionHierarchy from '../../../../components/editor/section-hierarchy';
import PresenceIndicators from '../../../../components/collaboration/presence-indicators';
import UserCursors, { useCursorPosition } from '../../../../components/collaboration/user-cursors';
import ExportDialog from '../../../../components/export/export-dialog';
import apiClient from '../../../../services/api-client';
import webSocketClient from '../../../../services/websocket-client';
import type { Document, Section, User, CollaborationSession, ExportRequest } from '../../../../services/api-client';

export default function DocumentEditPage() {
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Refs
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Custom hooks
  const { position, selection } = useCursorPosition(
    document?.content?.sections?.[0]?.content || '',
    editorContainerRef,
    (pos, sel) => {
      // Update cursor position in real-time collaboration
      webSocketClient.updateCursor(pos, sel, selectedSectionId || undefined);
    }
  );

  // Load document data
  useEffect(() => {
    if (!documentId) return;
    loadDocumentData();
  }, [documentId]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (currentUser && document) {
      initializeCollaboration();
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

  const initializeCollaboration = async () => {
    if (!currentUser || !document) return;

    try {
      // Connect to WebSocket if not already connected
      if (!webSocketClient.isConnected()) {
        const mockToken = 'mock-jwt-token'; // In real app, get from auth context
        await webSocketClient.connect(mockToken, currentUser.id);
      }

      // Join document collaboration
      await webSocketClient.joinDocument(document.id);

      // Start activity tracking for presence
      webSocketClient.startActivityTracking();

      // Set up event listeners
      setupCollaborationEventListeners();

    } catch (err) {
      console.error('Failed to initialize collaboration:', err);
    }
  };

  const setupCollaborationEventListeners = () => {
    const handleUserJoined = (session: CollaborationSession) => {
      setCollaborationSessions(prev => [...prev.filter(s => s.id !== session.id), session]);
    };

    const handleUserLeft = (data: { userId: string; documentId: string }) => {
      setCollaborationSessions(prev => prev.filter(s => 
        !(s.userId === data.userId && s.documentId === data.documentId)
      ));
    };

    const handleCursorUpdate = (data: any) => {
      setCollaborationSessions(prev => prev.map(session =>
        session.userId === data.userId 
          ? { ...session, cursor: data }
          : session
      ));
    };

    const handleContentUpdate = (data: any) => {
      // Apply operational transform and update document
      // In production, use proper OT library like ShareJS or Yjs
      console.log('Content update received:', data);
    };

    webSocketClient.on('user:joined', handleUserJoined);
    webSocketClient.on('user:left', handleUserLeft);
    webSocketClient.on('cursor:update', handleCursorUpdate);
    webSocketClient.on('content:update', handleContentUpdate);

    return () => {
      webSocketClient.off('user:joined', handleUserJoined);
      webSocketClient.off('user:left', handleUserLeft);
      webSocketClient.off('cursor:update', handleCursorUpdate);
      webSocketClient.off('content:update', handleContentUpdate);
    };
  };

  // Document save handlers
  const handleDocumentSave = useCallback(async (updatedDocument: Document) => {
    if (!document) return;

    setIsSaving(true);
    try {
      const result = await apiClient.updateDocument(document.id, updatedDocument);
      if (result.success) {
        setDocument(result.data);
        
        // Send content update to other collaborators
        webSocketClient.sendContentUpdate({
          type: 'replace',
          position: 0,
          content: JSON.stringify(result.data.content)
        });
      } else {
        alert('Failed to save document: ' + result.error.message);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [document]);

  // Auto-save functionality
  const handleContentChange = useCallback((content: string) => {
    if (!document) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new auto-save timeout
    autoSaveTimeoutRef.current = setTimeout(() => {
      const updatedDocument = {
        ...document,
        content: {
          ...document.content,
          sections: [{
            ...document.content.sections[0],
            content,
            wordCount: content.split(' ').filter(word => word.length > 0).length
          }]
        },
        wordCount: content.split(' ').filter(word => word.length > 0).length,
        updatedAt: new Date().toISOString()
      };
      
      handleDocumentSave(updatedDocument);
    }, 2000); // 2 second auto-save delay
  }, [document, handleDocumentSave]);

  // Section management
  const handleSectionSelect = useCallback((sectionId: string) => {
    setSelectedSectionId(sectionId);
  }, []);

  const handleSectionAdd = useCallback(async (parentId: string | null, level: number) => {
    if (!document) return;

    const newSection: Partial<Section> = {
      documentId: document.id,
      parentId,
      title: 'New Section',
      content: '',
      level,
      order: sections.filter(s => s.parentId === parentId).length,
      wordCount: 0,
      metadata: {}
    };

    const result = await apiClient.createSection(document.id, newSection);
    if (result.success) {
      setSections(prev => [...prev, result.data]);
    }
  }, [document, sections]);

  const handleSectionDelete = useCallback(async (sectionId: string) => {
    if (!document) return;

    const result = await apiClient.deleteSection(document.id, sectionId);
    if (result.success) {
      setSections(prev => prev.filter(s => s.id !== sectionId));
    }
  }, [document]);

  const handleSectionMove = useCallback(async (sectionId: string, newParentId: string | null, newOrder: number) => {
    if (!document) return;

    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const updates = {
      parentId: newParentId,
      order: newOrder
    };

    const result = await apiClient.updateSection(document.id, sectionId, updates);
    if (result.success) {
      setSections(prev => prev.map(s => s.id === sectionId ? result.data : s));
    }
  }, [document, sections]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (document) {
          handleDocumentSave(document);
        }
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setShowExportDialog(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [document, handleDocumentSave]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-none bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
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
              <h1 className="text-xl font-semibold text-gray-900">{document.title}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  document.status === 'published' ? 'bg-green-100 text-green-800' :
                  document.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  document.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {document.status}
                </span>
                <span>v{document.version}</span>
                <span>•</span>
                <span>{document.wordCount.toLocaleString()} words</span>
                {isSaving && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">Saving...</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Collaboration indicators */}
            {currentUser && (
              <PresenceIndicators
                documentId={document.id}
                currentUserId={currentUser.id}
                collaborationSessions={collaborationSessions}
                users={users}
              />
            )}

            {/* Action buttons */}
            <button
              onClick={() => setShowExportDialog(true)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Export
            </button>
            
            <button
              onClick={() => window.location.href = `/documents/${document.id}/view`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Section hierarchy */}
        <div className={`flex-none bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-0' : 'w-80'
        }`}>
          {!sidebarCollapsed && (
            <SectionHierarchy
              sections={sections}
              selectedSectionId={selectedSectionId}
              onSectionSelect={handleSectionSelect}
              onSectionAdd={handleSectionAdd}
              onSectionDelete={handleSectionDelete}
              onSectionMove={handleSectionMove}
              className="h-full"
            />
          )}
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col relative">
          <div ref={editorContainerRef} className="flex-1 relative">
            <DocumentEditor
              documentId={document.id}
              initialDocument={document}
              onSave={handleDocumentSave}
              onContentChange={handleContentChange}
              className="h-full"
            />
            
            {/* User cursors overlay */}
            {currentUser && (
              <UserCursors
                collaborationSessions={collaborationSessions}
                currentUserId={currentUser.id}
                documentContent={document.content.sections[0]?.content || ''}
                containerRef={editorContainerRef}
                showUserNames={true}
                showSelections={true}
              />
            )}
          </div>
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute top-4 left-2 z-10 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
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