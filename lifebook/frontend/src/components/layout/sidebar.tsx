'use client';

import React, { useState, useCallback, useMemo } from 'react';

// Types
interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: number;
  isActive?: boolean;
  children?: NavigationItem[];
  onClick?: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer' | 'guest';
}

interface RecentDocument {
  id: string;
  title: string;
  updatedAt: string;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
}

interface SidebarProps {
  currentUser: User;
  currentPath: string;
  recentDocuments?: RecentDocument[];
  onNavigate?: (path: string) => void;
  onDocumentClick?: (documentId: string) => void;
  onCollapse?: (collapsed: boolean) => void;
  isCollapsed?: boolean;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentPath,
  recentDocuments = [],
  onNavigate,
  onDocumentClick,
  onCollapse,
  isCollapsed = false,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));

  // Main navigation items
  const mainNavigation = useMemo<NavigationItem[]>(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      isActive: currentPath === '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z" />
        </svg>
      )
    },
    {
      id: 'documents',
      label: 'My Documents',
      href: '/documents',
      isActive: currentPath.startsWith('/documents'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'templates',
      label: 'Templates',
      href: '/templates',
      isActive: currentPath.startsWith('/templates'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      id: 'search',
      label: 'Search',
      href: '/search',
      isActive: currentPath.startsWith('/search'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      id: 'collaboration',
      label: 'Shared With Me',
      href: '/shared',
      isActive: currentPath.startsWith('/shared'),
      badge: 3, // Mock badge count
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    }
  ], [currentPath]);

  // Secondary navigation items
  const secondaryNavigation = useMemo<NavigationItem[]>(() => [
    {
      id: 'exports',
      label: 'Export History',
      href: '/exports',
      isActive: currentPath.startsWith('/exports'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      isActive: currentPath.startsWith('/settings'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ], [currentPath]);

  // Handle section toggle
  const toggleSection = useCallback((sectionId: string) => {
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

  // Handle navigation click
  const handleNavigationClick = useCallback((item: NavigationItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      onNavigate?.(item.href);
    }
  }, [onNavigate]);

  // Handle document click
  const handleDocumentClick = useCallback((documentId: string) => {
    onDocumentClick?.(documentId);
  }, [onDocumentClick]);

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-600';
      case 'review': return 'bg-yellow-100 text-yellow-600';
      case 'approved': return 'bg-blue-100 text-blue-600';
      case 'published': return 'bg-green-100 text-green-600';
      case 'archived': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Render navigation item
  const renderNavigationItem = (item: NavigationItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.has(item.id);

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleSection(item.id);
            } else {
              handleNavigationClick(item);
            }
          }}
          className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
            item.isActive
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          } ${depth > 0 ? 'ml-4' : ''}`}
          title={isCollapsed ? item.label : undefined}
        >
          {/* Icon */}
          <div className="flex-none">
            {item.icon}
          </div>

          {/* Label and Badge */}
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left ml-3">{item.label}</span>
              
              {item.badge !== undefined && (
                <span className="flex-none ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              
              {hasChildren && (
                <svg
                  className={`flex-none w-4 h-4 ml-2 transform transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </>
          )}
        </button>

        {/* Children */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="ml-4 space-y-1 mt-1">
            {item.children!.map(child => renderNavigationItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">TechSpec Pro</div>
              <div className="text-xs text-gray-500">v2.1.0</div>
            </div>
          </div>
        )}
        
        <button
          onClick={() => onCollapse?.(!isCollapsed)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-4 h-4 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {currentUser.name}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {currentUser.role}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          {/* Main Navigation */}
          <div className="mb-6">
            {!isCollapsed && (
              <div className="px-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Main
                </h3>
              </div>
            )}
            {mainNavigation.map(item => renderNavigationItem(item))}
          </div>

          {/* Secondary Navigation */}
          <div className="mb-6">
            {!isCollapsed && (
              <div className="px-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tools
                </h3>
              </div>
            )}
            {secondaryNavigation.map(item => renderNavigationItem(item))}
          </div>

          {/* Recent Documents */}
          {!isCollapsed && recentDocuments.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Recent
                </h3>
                <button
                  onClick={() => toggleSection('recent')}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className={`w-3 h-3 transform transition-transform ${
                      expandedSections.has('recent') ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {expandedSections.has('recent') && (
                <div className="space-y-1">
                  {recentDocuments.slice(0, 5).map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => handleDocumentClick(doc.id)}
                      className="w-full flex items-center px-2 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors group"
                    >
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-medium truncate group-hover:text-gray-900">
                          {doc.title}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                          <span className="text-gray-400">
                            {formatDate(doc.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          {!isCollapsed && (
            <div className="mb-6">
              <div className="px-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Quick Actions
                </h3>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => onNavigate?.('/documents/new')}
                  className="w-full flex items-center px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Document
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="text-xs text-gray-500 space-y-1">
            <div>150,000 word limit</div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-blue-600 h-1 rounded-full" style={{ width: '35%' }}></div>
            </div>
            <div>52,500 words used</div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-1 bg-gray-200 rounded-full">
              <div className="w-3 h-1 bg-blue-600 rounded-full"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;