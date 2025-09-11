'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// Types based on data model
interface CursorPosition {
  position: number;
  selection: { start: number; end: number } | null;
  sectionId: string | null;
}

interface UserPresence {
  color: string;
  name: string;
  avatar?: string;
  status: 'active' | 'idle' | 'away';
}

interface CollaborationSession {
  id: string;
  documentId: string;
  userId: string;
  socketId: string;
  cursor: CursorPosition;
  presence: UserPresence;
  lastSeen: string;
  isActive: boolean;
  permissions: string[];
}

interface UserCursorsProps {
  collaborationSessions: CollaborationSession[];
  currentUserId: string;
  documentContent: string;
  containerRef?: React.RefObject<HTMLElement>;
  onCursorClick?: (userId: string, position: number) => void;
  showUserNames?: boolean;
  showSelections?: boolean;
  fadeInactive?: boolean;
  className?: string;
}

interface CursorElement {
  userId: string;
  position: number;
  selection: { start: number; end: number } | null;
  presence: UserPresence;
  isVisible: boolean;
  coordinates?: { x: number; y: number };
}

export const UserCursors: React.FC<UserCursorsProps> = ({
  collaborationSessions,
  currentUserId,
  documentContent,
  containerRef,
  onCursorClick,
  showUserNames = true,
  showSelections = true,
  fadeInactive = true,
  className = ''
}) => {
  const [cursors, setCursors] = useState<CursorElement[]>([]);
  const [hoveredCursor, setHoveredCursor] = useState<string | null>(null);
  const cursorsContainerRef = useRef<HTMLDivElement>(null);

  // Filter active sessions excluding current user
  const activeSessions = useMemo(() => {
    return collaborationSessions.filter(session =>
      session.isActive && 
      session.userId !== currentUserId &&
      session.cursor.position >= 0
    );
  }, [collaborationSessions, currentUserId]);

  // Calculate cursor positions based on text content
  const calculateCursorPosition = useCallback((position: number, container: HTMLElement): { x: number; y: number } | null => {
    if (!container || position < 0 || position > documentContent.length) {
      return null;
    }

    // Create a temporary range to measure text position
    const range = document.createRange();
    const textNodes: Text[] = [];
    
    // Find all text nodes in the container
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    // Find the text node and offset for the given position
    let currentPos = 0;
    for (const textNode of textNodes) {
      const nodeLength = textNode.textContent?.length || 0;
      if (currentPos + nodeLength >= position) {
        const offset = position - currentPos;
        try {
          range.setStart(textNode, Math.min(offset, nodeLength));
          range.setEnd(textNode, Math.min(offset, nodeLength));
          const rect = range.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          return {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top
          };
        } catch (e) {
          // Fallback for edge cases
          return null;
        }
      }
      currentPos += nodeLength;
    }

    return null;
  }, [documentContent]);

  // Update cursor positions
  useEffect(() => {
    if (!containerRef?.current) return;

    const updateCursors = () => {
      const container = containerRef.current;
      if (!container) return;

      const newCursors: CursorElement[] = activeSessions.map(session => {
        const coordinates = calculateCursorPosition(session.cursor.position, container);
        
        return {
          userId: session.userId,
          position: session.cursor.position,
          selection: session.cursor.selection,
          presence: session.presence,
          isVisible: !!coordinates,
          coordinates
        };
      });

      setCursors(newCursors);
    };

    updateCursors();

    // Update on scroll/resize
    const handleUpdate = () => updateCursors();
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);
    
    // Update periodically for dynamic content
    const interval = setInterval(updateCursors, 1000);

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      clearInterval(interval);
    };
  }, [activeSessions, containerRef, calculateCursorPosition]);

  // Get cursor activity status
  const getCursorOpacity = useCallback((presence: UserPresence, lastSeen: string): number => {
    if (!fadeInactive) return 1;
    
    const timeSinceLastSeen = Date.now() - new Date(lastSeen).getTime();
    
    if (presence.status === 'active') return 1;
    if (presence.status === 'idle' && timeSinceLastSeen < 2 * 60 * 1000) return 0.7; // 2 minutes
    if (timeSinceLastSeen < 5 * 60 * 1000) return 0.4; // 5 minutes
    
    return 0.2;
  }, [fadeInactive]);

  // Render cursor line
  const renderCursor = (cursor: CursorElement) => {
    if (!cursor.isVisible || !cursor.coordinates) return null;

    const session = activeSessions.find(s => s.userId === cursor.userId);
    if (!session) return null;

    const opacity = getCursorOpacity(cursor.presence, session.lastSeen);
    const isHovered = hoveredCursor === cursor.userId;

    return (
      <div
        key={cursor.userId}
        className="absolute pointer-events-none z-10"
        style={{
          left: cursor.coordinates.x,
          top: cursor.coordinates.y,
          opacity
        }}
      >
        {/* Cursor line */}
        <div
          className="w-0.5 h-5 animate-pulse"
          style={{
            backgroundColor: cursor.presence.color,
            boxShadow: isHovered ? `0 0 8px ${cursor.presence.color}` : undefined
          }}
        />
        
        {/* Cursor label */}
        {showUserNames && (
          <div
            className={`absolute -top-6 -left-2 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap transition-all duration-200 cursor-pointer pointer-events-auto ${
              isHovered ? 'scale-110 shadow-lg' : 'hover:scale-105'
            }`}
            style={{ 
              backgroundColor: cursor.presence.color,
              transform: `translateY(${isHovered ? '-2px' : '0px'})`
            }}
            onMouseEnter={() => setHoveredCursor(cursor.userId)}
            onMouseLeave={() => setHoveredCursor(null)}
            onClick={() => onCursorClick?.(cursor.userId, cursor.position)}
          >
            {cursor.presence.avatar ? (
              <div className="flex items-center space-x-1">
                <img
                  src={cursor.presence.avatar}
                  alt={cursor.presence.name}
                  className="w-4 h-4 rounded-full"
                />
                <span>{cursor.presence.name}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 rounded-full bg-white bg-opacity-30 flex items-center justify-center text-xs">
                  {cursor.presence.name.charAt(0).toUpperCase()}
                </div>
                <span>{cursor.presence.name}</span>
              </div>
            )}
            
            {/* Status indicator */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white ${
              cursor.presence.status === 'active' ? 'bg-green-400' :
              cursor.presence.status === 'idle' ? 'bg-yellow-400' :
              'bg-gray-400'
            }`} />
          </div>
        )}
      </div>
    );
  };

  // Render text selection
  const renderSelection = (cursor: CursorElement) => {
    if (!cursor.isVisible || !cursor.selection || !showSelections || !cursor.coordinates) return null;
    if (!containerRef?.current) return null;

    const container = containerRef.current;
    const startCoords = calculateCursorPosition(cursor.selection.start, container);
    const endCoords = calculateCursorPosition(cursor.selection.end, container);
    
    if (!startCoords || !endCoords) return null;

    const session = activeSessions.find(s => s.userId === cursor.userId);
    if (!session) return null;

    const opacity = getCursorOpacity(cursor.presence, session.lastSeen) * 0.3;

    // Simple implementation for single-line selections
    // In a real implementation, this would handle multi-line selections
    const width = Math.abs(endCoords.x - startCoords.x);
    const height = 20; // Approximate line height

    return (
      <div
        key={`selection-${cursor.userId}`}
        className="absolute pointer-events-none z-5 rounded"
        style={{
          left: Math.min(startCoords.x, endCoords.x),
          top: startCoords.y,
          width: width,
          height: height,
          backgroundColor: cursor.presence.color,
          opacity
        }}
      />
    );
  };

  return (
    <div
      ref={cursorsContainerRef}
      className={`user-cursors absolute inset-0 pointer-events-none ${className}`}
    >
      {/* Render selections first (behind cursors) */}
      {cursors.map(cursor => renderSelection(cursor))}
      
      {/* Render cursors */}
      {cursors.map(cursor => renderCursor(cursor))}
      
      {/* Cursor activity summary */}
      {cursors.length > 0 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-auto">
          {cursors.filter(c => c.isVisible).length} active cursor{cursors.filter(c => c.isVisible).length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

// Hook for managing cursor position updates
export const useCursorPosition = (
  documentContent: string,
  containerRef: React.RefObject<HTMLElement>,
  onPositionChange?: (position: number, selection: { start: number; end: number } | null) => void
) => {
  const [position, setPosition] = useState(0);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) return;

      // Calculate text position within the document content
      const startPos = getTextPosition(range.startContainer, range.startOffset, container);
      const endPos = getTextPosition(range.endContainer, range.endOffset, container);

      const newPosition = startPos;
      const newSelection = startPos !== endPos ? { start: startPos, end: endPos } : null;

      setPosition(newPosition);
      setSelection(newSelection);
      onPositionChange?.(newPosition, newSelection);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    container.addEventListener('click', handleSelectionChange);
    container.addEventListener('keyup', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      container.removeEventListener('click', handleSelectionChange);
      container.removeEventListener('keyup', handleSelectionChange);
    };
  }, [containerRef, onPositionChange]);

  return { position, selection };
};

// Helper function to calculate text position
const getTextPosition = (node: Node, offset: number, container: HTMLElement): number => {
  let position = 0;
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  let currentNode;
  while (currentNode = walker.nextNode()) {
    if (currentNode === node) {
      return position + offset;
    }
    position += currentNode.textContent?.length || 0;
  }

  return position;
};

export default UserCursors;