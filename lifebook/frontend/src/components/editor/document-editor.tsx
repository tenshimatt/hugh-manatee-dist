'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Types based on data model
interface Section {
  id: string;
  documentId: string;
  parentId: string | null;
  title: string;
  content: string;
  level: number;
  order: number;
  wordCount: number;
  metadata: Record<string, any>;
}

interface Document {
  id: string;
  title: string;
  content: {
    sections: Section[];
    metadata: Record<string, any>;
  };
  wordCount: number;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  ownerId: string;
}

interface DocumentEditorProps {
  documentId?: string;
  initialDocument?: Document;
  onSave?: (document: Document) => void;
  onContentChange?: (content: string) => void;
  isReadOnly?: boolean;
  className?: string;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  documentId,
  initialDocument,
  onSave,
  onContentChange,
  isReadOnly = false,
  className = ''
}) => {
  const [document, setDocument] = useState<Document | null>(initialDocument || null);
  const [isLoading, setIsLoading] = useState(!initialDocument && !!documentId);
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate word count
  const calculateWordCount = useCallback((text: string): number => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  }, []);

  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    const newWordCount = calculateWordCount(newContent);
    setWordCount(newWordCount);
    setHasUnsavedChanges(true);

    // Trigger callback
    onContentChange?.(newContent);

    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSave(newContent);
    }, 2000);
  }, [onContentChange, calculateWordCount]);

  // Handle save
  const handleSave = useCallback(async (contentToSave?: string) => {
    if (!document) return;

    const updatedDocument: Document = {
      ...document,
      content: {
        ...document.content,
        sections: [{
          id: `section-${Date.now()}`,
          documentId: document.id,
          parentId: null,
          title: 'Main Content',
          content: contentToSave || content,
          level: 0,
          order: 0,
          wordCount: calculateWordCount(contentToSave || content),
          metadata: {}
        }]
      },
      wordCount: calculateWordCount(contentToSave || content),
      updatedAt: new Date().toISOString()
    };

    setDocument(updatedDocument);
    setLastSaved(new Date());
    setHasUnsavedChanges(false);

    // Trigger callback
    onSave?.(updatedDocument);

    // Clear auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  }, [document, content, onSave, calculateWordCount]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isReadOnly) return;

    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }

    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      insertMarkdown('**', '**');
    }

    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      insertMarkdown('*', '*');
    }
  }, [isReadOnly, handleSave]);

  // Insert markdown formatting
  const insertMarkdown = useCallback((prefix: string, suffix: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);

    const newContent = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`;
    handleContentChange(newContent);

    // Restore cursor position
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          end + prefix.length
        );
      }
    }, 0);
  }, [content, handleContentChange]);

  // Load document on mount
  useEffect(() => {
    if (documentId && !initialDocument) {
      setIsLoading(true);
      // In a real implementation, this would fetch from API
      // For now, create a mock document
      const mockDocument: Document = {
        id: documentId,
        title: 'New Document',
        content: { sections: [], metadata: {} },
        wordCount: 0,
        status: 'draft',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user',
        ownerId: 'current-user'
      };
      setDocument(mockDocument);
      setIsLoading(false);
    }
  }, [documentId, initialDocument]);

  // Initialize content from document
  useEffect(() => {
    if (document && document.content.sections.length > 0) {
      const mainSection = document.content.sections[0];
      setContent(mainSection?.content || '');
      setWordCount(mainSection?.wordCount || 0);
    }
  }, [document]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading document...</span>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Document not found</div>
      </div>
    );
  }

  return (
    <div className={`document-editor flex flex-col h-full ${className}`}>
      {/* Editor Header */}
      <div className="flex-none border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={document.title}
              onChange={(e) => {
                const updatedDoc = { ...document, title: e.target.value };
                setDocument(updatedDoc);
                setHasUnsavedChanges(true);
              }}
              className="text-xl font-semibold border-none outline-none bg-transparent"
              placeholder="Document Title"
              disabled={isReadOnly}
            />
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              document.status === 'published' ? 'bg-green-100 text-green-800' :
              document.status === 'approved' ? 'bg-blue-100 text-blue-800' :
              document.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {document.status}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{wordCount.toLocaleString()} words</span>
            {hasUnsavedChanges ? (
              <span className="text-orange-600">Unsaved changes</span>
            ) : lastSaved ? (
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            ) : null}
            {!isReadOnly && (
              <button
                onClick={() => handleSave()}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                disabled={!hasUnsavedChanges}
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {!isReadOnly && (
        <div className="flex-none border-b border-gray-200 p-2 bg-gray-50">
          <div className="flex space-x-2">
            <button
              onClick={() => insertMarkdown('**', '**')}
              className="p-2 rounded hover:bg-gray-200 transition-colors"
              title="Bold (Ctrl+B)"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => insertMarkdown('*', '*')}
              className="p-2 rounded hover:bg-gray-200 transition-colors italic"
              title="Italic (Ctrl+I)"
            >
              I
            </button>
            <button
              onClick={() => insertMarkdown('# ', '')}
              className="p-2 rounded hover:bg-gray-200 transition-colors"
              title="Heading"
            >
              H1
            </button>
            <button
              onClick={() => insertMarkdown('- ', '')}
              className="p-2 rounded hover:bg-gray-200 transition-colors"
              title="List"
            >
              • List
            </button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 relative">
        <textarea
          ref={editorRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isReadOnly ? '' : 'Start writing your document...'}
          readOnly={isReadOnly}
          className="w-full h-full p-4 border-none outline-none resize-none font-mono text-sm leading-relaxed"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex-none border-t border-gray-200 p-2 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Version {document.version}</span>
            <span>Created {new Date(document.createdAt).toLocaleDateString()}</span>
            <span>Modified {new Date(document.updatedAt).toLocaleDateString()}</span>
          </div>
          {!isReadOnly && (
            <div className="flex items-center space-x-2">
              <span>Ctrl+S to save</span>
              <span>•</span>
              <span>Ctrl+B for bold</span>
              <span>•</span>
              <span>Ctrl+I for italic</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;