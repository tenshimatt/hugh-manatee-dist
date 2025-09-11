'use client';

import React, { useState, useCallback, useMemo } from 'react';

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

interface SectionNode extends Section {
  children: SectionNode[];
  isExpanded: boolean;
  isSelected: boolean;
}

interface SectionHierarchyProps {
  sections: Section[];
  selectedSectionId?: string;
  onSectionSelect?: (sectionId: string) => void;
  onSectionAdd?: (parentId: string | null, level: number) => void;
  onSectionDelete?: (sectionId: string) => void;
  onSectionMove?: (sectionId: string, newParentId: string | null, newOrder: number) => void;
  onSectionUpdate?: (sectionId: string, updates: Partial<Section>) => void;
  isReadOnly?: boolean;
  className?: string;
}

export const SectionHierarchy: React.FC<SectionHierarchyProps> = ({
  sections,
  selectedSectionId,
  onSectionSelect,
  onSectionAdd,
  onSectionDelete,
  onSectionMove,
  onSectionUpdate,
  isReadOnly = false,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'before' | 'after' | 'child' } | null>(null);

  // Build hierarchical tree from flat sections array
  const sectionTree = useMemo(() => {
    const sectionMap = new Map<string, SectionNode>();
    const rootSections: SectionNode[] = [];

    // Create section nodes
    sections.forEach(section => {
      sectionMap.set(section.id, {
        ...section,
        children: [],
        isExpanded: expandedSections.has(section.id),
        isSelected: section.id === selectedSectionId
      });
    });

    // Build hierarchy
    sections.forEach(section => {
      const node = sectionMap.get(section.id)!;
      if (section.parentId && sectionMap.has(section.parentId)) {
        const parent = sectionMap.get(section.parentId)!;
        parent.children.push(node);
      } else {
        rootSections.push(node);
      }
    });

    // Sort by order
    const sortByOrder = (nodes: SectionNode[]) => {
      nodes.sort((a, b) => a.order - b.order);
      nodes.forEach(node => sortByOrder(node.children));
    };
    sortByOrder(rootSections);

    return rootSections;
  }, [sections, expandedSections, selectedSectionId]);

  // Toggle section expansion
  const toggleExpansion = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      return newExpanded;
    });
  }, []);

  // Handle section selection
  const handleSectionSelect = useCallback((sectionId: string) => {
    onSectionSelect?.(sectionId);
  }, [onSectionSelect]);

  // Handle adding new section
  const handleAddSection = useCallback((parentId: string | null, level: number) => {
    if (!isReadOnly) {
      onSectionAdd?.(parentId, level);
    }
  }, [onSectionAdd, isReadOnly]);

  // Handle section deletion
  const handleDeleteSection = useCallback((sectionId: string) => {
    if (!isReadOnly && window.confirm('Are you sure you want to delete this section?')) {
      onSectionDelete?.(sectionId);
    }
  }, [onSectionDelete, isReadOnly]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, sectionId: string) => {
    if (isReadOnly) {
      e.preventDefault();
      return;
    }
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionId);
  }, [isReadOnly]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, sectionId: string, position: 'before' | 'after' | 'child') => {
    e.preventDefault();
    if (draggedSection && draggedSection !== sectionId) {
      setDropTarget({ id: sectionId, position });
    }
  }, [draggedSection]);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedSection && dropTarget && onSectionMove) {
      const draggedSectionData = sections.find(s => s.id === draggedSection);
      const targetSectionData = sections.find(s => s.id === dropTarget.id);
      
      if (draggedSectionData && targetSectionData) {
        let newParentId: string | null = null;
        let newOrder = 0;

        if (dropTarget.position === 'child') {
          newParentId = dropTarget.id;
          // Get highest order among children + 1
          const childrenOfTarget = sections.filter(s => s.parentId === dropTarget.id);
          newOrder = childrenOfTarget.length > 0 ? Math.max(...childrenOfTarget.map(s => s.order)) + 1 : 0;
        } else {
          newParentId = targetSectionData.parentId;
          if (dropTarget.position === 'before') {
            newOrder = targetSectionData.order;
          } else {
            newOrder = targetSectionData.order + 1;
          }
        }

        onSectionMove(draggedSection, newParentId, newOrder);
      }
    }

    setDraggedSection(null);
    setDropTarget(null);
  }, [draggedSection, dropTarget, sections, onSectionMove]);

  // Get level indicator
  const getLevelIndicator = (level: number): string => {
    const indicators = ['📄', '📝', '📋', '📌', '📎', '🔖', '🏷️'];
    return indicators[Math.min(level, indicators.length - 1)];
  };

  // Get level styles
  const getLevelStyles = (level: number): string => {
    const baseStyles = 'px-2 py-1 rounded text-xs font-medium';
    const levelColors = [
      'bg-blue-100 text-blue-800',    // Level 0 (H1)
      'bg-green-100 text-green-800',  // Level 1 (H2)
      'bg-yellow-100 text-yellow-800', // Level 2 (H3)
      'bg-purple-100 text-purple-800', // Level 3 (H4)
      'bg-pink-100 text-pink-800',    // Level 4 (H5)
      'bg-indigo-100 text-indigo-800', // Level 5 (H6)
      'bg-gray-100 text-gray-800'     // Level 6+ (fallback)
    ];
    return `${baseStyles} ${levelColors[Math.min(level, levelColors.length - 1)]}`;
  };

  // Render section node
  const renderSectionNode = (node: SectionNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const paddingLeft = depth * 20;
    const isDropTarget = dropTarget?.id === node.id;
    const isDraggedOver = draggedSection && draggedSection !== node.id && isDropTarget;

    return (
      <div key={node.id} className="section-node">
        {/* Drop indicator before */}
        {isDraggedOver && dropTarget?.position === 'before' && (
          <div className="h-1 bg-blue-500 rounded mx-2 my-1"></div>
        )}

        <div
          className={`flex items-center group hover:bg-gray-50 rounded-lg p-2 cursor-pointer transition-colors ${
            node.isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          } ${isDraggedOver && dropTarget?.position === 'child' ? 'bg-blue-50' : ''}`}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          onClick={() => handleSectionSelect(node.id)}
          draggable={!isReadOnly}
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={(e) => handleDragOver(e, node.id, 'child')}
          onDrop={handleDrop}
        >
          {/* Expansion toggle */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpansion(node.id);
              }}
              className="flex-none w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded transition-colors mr-2"
            >
              <span className={`transform transition-transform ${node.isExpanded ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </button>
          )}

          {!hasChildren && <div className="w-8"></div>}

          {/* Level indicator */}
          <span className="flex-none mr-2 text-lg">
            {getLevelIndicator(node.level)}
          </span>

          {/* Section info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 truncate">
                {node.title || 'Untitled Section'}
              </span>
              <span className={getLevelStyles(node.level)}>
                H{node.level + 1}
              </span>
              <span className="text-sm text-gray-500">
                {node.wordCount} words
              </span>
            </div>
          </div>

          {/* Actions */}
          {!isReadOnly && (
            <div className="flex-none opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddSection(node.id, node.level + 1);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors mr-1"
                title="Add child section"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSection(node.id);
                }}
                className="p-1 hover:bg-red-200 rounded transition-colors text-red-600"
                title="Delete section"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Drop indicator after */}
        {isDraggedOver && dropTarget?.position === 'after' && (
          <div className="h-1 bg-blue-500 rounded mx-2 my-1"></div>
        )}

        {/* Children */}
        {hasChildren && node.isExpanded && (
          <div className="children">
            {node.children.map(child => renderSectionNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalWordCount = sections.reduce((sum, section) => sum + section.wordCount, 0);

  return (
    <div className={`section-hierarchy flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-none border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">Document Outline</h2>
            <span className="text-sm text-gray-500">
              {sections.length} section{sections.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {totalWordCount.toLocaleString()} total words
            </span>
            {!isReadOnly && (
              <button
                onClick={() => handleAddSection(null, 0)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Add Section
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hierarchy Tree */}
      <div className="flex-1 overflow-y-auto">
        {sectionTree.length > 0 ? (
          <div className="p-2">
            {sectionTree.map(node => renderSectionNode(node))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            {isReadOnly ? 'No sections in this document' : 'Click "Add Section" to get started'}
          </div>
        )}
      </div>

      {/* Help Text */}
      {!isReadOnly && sections.length > 0 && (
        <div className="flex-none border-t border-gray-200 p-3 bg-gray-50">
          <div className="text-xs text-gray-600 space-y-1">
            <div>💡 <strong>Tips:</strong></div>
            <div>• Drag sections to reorder or change hierarchy</div>
            <div>• Click section titles to navigate</div>
            <div>• Use + button to add child sections</div>
            <div>• Sections support 6 heading levels (H1-H6)</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionHierarchy;