'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Types based on data model
interface CollaborationSession {
  id: string;
  documentId: string;
  userId: string;
  socketId: string;
  cursor: {
    position: number;
    selection: { start: number; end: number } | null;
    sectionId: string | null;
  };
  presence: {
    color: string;
    name: string;
    avatar?: string;
    status: 'active' | 'idle' | 'away';
  };
  lastSeen: string;
  isActive: boolean;
  permissions: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer' | 'guest';
}

interface PresenceIndicatorsProps {
  documentId: string;
  currentUserId: string;
  collaborationSessions: CollaborationSession[];
  users: User[];
  onUserClick?: (userId: string) => void;
  onFollowUser?: (userId: string) => void;
  maxVisibleUsers?: number;
  className?: string;
}

export const PresenceIndicators: React.FC<PresenceIndicatorsProps> = ({
  documentId,
  currentUserId,
  collaborationSessions,
  users,
  onUserClick,
  onFollowUser,
  maxVisibleUsers = 6,
  className = ''
}) => {
  const [followingUserId, setFollowingUserId] = useState<string | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Filter active sessions for current document, excluding current user
  const activeSessions = useMemo(() => {
    return collaborationSessions.filter(session => 
      session.documentId === documentId && 
      session.isActive && 
      session.userId !== currentUserId
    );
  }, [collaborationSessions, documentId, currentUserId]);

  // Get user data for each session
  const activeCollaborators = useMemo(() => {
    return activeSessions.map(session => {
      const user = users.find(u => u.id === session.userId);
      return {
        session,
        user: user || {
          id: session.userId,
          name: session.presence.name || 'Unknown User',
          email: '',
          role: 'viewer' as const
        }
      };
    }).sort((a, b) => {
      // Sort by activity level
      const getActivityScore = (session: CollaborationSession) => {
        const timeSinceLastSeen = Date.now() - new Date(session.lastSeen).getTime();
        if (session.presence.status === 'active') return 3;
        if (session.presence.status === 'idle') return 2;
        if (timeSinceLastSeen < 5 * 60 * 1000) return 1; // 5 minutes
        return 0;
      };
      return getActivityScore(b.session) - getActivityScore(a.session);
    });
  }, [activeSessions, users]);

  // Handle following a user
  const handleFollowUser = useCallback((userId: string) => {
    if (followingUserId === userId) {
      setFollowingUserId(null);
    } else {
      setFollowingUserId(userId);
      onFollowUser?.(userId);
    }
  }, [followingUserId, onFollowUser]);

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'away': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  // Get role badge
  const getRoleBadge = (role: string): { text: string; color: string } => {
    switch (role) {
      case 'admin': return { text: 'Admin', color: 'bg-red-100 text-red-800' };
      case 'editor': return { text: 'Editor', color: 'bg-blue-100 text-blue-800' };
      case 'viewer': return { text: 'Viewer', color: 'bg-gray-100 text-gray-600' };
      case 'guest': return { text: 'Guest', color: 'bg-yellow-100 text-yellow-800' };
      default: return { text: role, color: 'bg-gray-100 text-gray-600' };
    }
  };

  // Render user avatar
  const renderUserAvatar = (
    collaborator: typeof activeCollaborators[0], 
    size: 'sm' | 'md' | 'lg' = 'md',
    showTooltip = false
  ) => {
    const { session, user } = collaborator;
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10'
    };
    const textSizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    };

    const isFollowing = followingUserId === user.id;
    
    return (
      <div className="relative group">
        <button
          onClick={() => {
            onUserClick?.(user.id);
            handleFollowUser(user.id);
          }}
          className={`${sizeClasses[size]} rounded-full border-2 transition-all duration-200 relative overflow-hidden ${
            isFollowing 
              ? 'border-blue-500 ring-2 ring-blue-200 scale-110' 
              : 'border-white hover:border-gray-300'
          }`}
          style={{ 
            backgroundColor: session.presence.color || '#6B7280',
            boxShadow: isFollowing ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : undefined
          }}
          title={showTooltip ? `${user.name} (${session.presence.status})` : undefined}
        >
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className={`${textSizeClasses[size]} font-medium text-white`}>
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
          
          {/* Status indicator */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(session.presence.status)} rounded-full border-2 border-white`}></div>
          
          {/* Following indicator */}
          {isFollowing && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          )}
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
              <div className="font-medium">{user.name}</div>
              <div className="text-gray-300">{session.presence.status}</div>
              <div className="text-gray-400">{getRoleBadge(user.role).text}</div>
              {session.cursor.sectionId && (
                <div className="text-gray-400">Section: {session.cursor.sectionId.slice(0, 8)}...</div>
              )}
              {isFollowing && <div className="text-blue-300">Following</div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Calculate display users
  const visibleCollaborators = showAllUsers ? activeCollaborators : activeCollaborators.slice(0, maxVisibleUsers);
  const hiddenCount = Math.max(0, activeCollaborators.length - maxVisibleUsers);

  if (activeCollaborators.length === 0) {
    return (
      <div className={`presence-indicators flex items-center ${className}`}>
        <div className="text-sm text-gray-500">
          You're the only one here
        </div>
      </div>
    );
  }

  return (
    <div className={`presence-indicators flex items-center space-x-3 ${className}`}>
      {/* Active collaborators */}
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {visibleCollaborators.map((collaborator) => (
            <div key={collaborator.session.id}>
              {renderUserAvatar(collaborator, 'md', true)}
            </div>
          ))}
          
          {/* Show more button */}
          {hiddenCount > 0 && !showAllUsers && (
            <button
              onClick={() => setShowAllUsers(true)}
              className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white text-gray-600 text-xs font-medium hover:bg-gray-300 transition-colors"
              title={`+${hiddenCount} more`}
            >
              +{hiddenCount}
            </button>
          )}
        </div>
      </div>

      {/* Collaboration info */}
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-gray-600">
            {activeCollaborators.length} online
          </span>
        </div>

        {followingUserId && (
          <div className="flex items-center space-x-1 text-blue-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Following {activeCollaborators.find(c => c.user.id === followingUserId)?.user.name}</span>
            <button
              onClick={() => setFollowingUserId(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Collaboration details panel (when expanded) */}
      {showAllUsers && activeCollaborators.length > maxVisibleUsers && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20 min-w-72">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Active Collaborators</h3>
            <button
              onClick={() => setShowAllUsers(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-2">
            {activeCollaborators.map((collaborator) => {
              const roleBadge = getRoleBadge(collaborator.user.role);
              return (
                <div key={collaborator.session.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                  {renderUserAvatar(collaborator, 'sm')}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {collaborator.user.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded ${roleBadge.color}`}>
                        {roleBadge.text}
                      </span>
                      <span>{collaborator.session.presence.status}</span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {followingUserId !== collaborator.user.id ? (
                      <button
                        onClick={() => handleFollowUser(collaborator.user.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                      >
                        Follow
                      </button>
                    ) : (
                      <span className="text-xs text-blue-600 px-2 py-1">Following</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PresenceIndicators;