'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  StoredConversation,
  groupConversationsByDate,
  togglePinConversation,
  renameStoredConversation,
  deleteStoredConversation,
  archiveStoredConversation,
  restoreStoredConversation,
} from '@/lib/bot/storage';
import { PublicBotUser } from '@/lib/bot/types';
import { QuantumBotIcon } from './QuantumBotIcon';

interface SidebarProps {
  conversations: StoredConversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: (initialTab?: 'engine' | 'personalization' | 'account' | 'privacy') => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  onSignOut?: () => void;
  authUser?: PublicBotUser | null;
  displayName?: string;
  isAuthenticated?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onOpenSettings,
  onOpenAuthModal,
  onSignOut,
  authUser,
  displayName,
  isAuthenticated = false,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const activeList = useMemo(
    () => conversations.filter((c) => !c.archived),
    [conversations]
  );

  const archivedList = useMemo(
    () => conversations.filter((c) => c.archived),
    [conversations]
  );

  const baseList = viewMode === 'archived' ? archivedList : activeList;

  // Filter conversations based on search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return baseList;
    const q = searchQuery.toLowerCase();
    return baseList.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => (m.content || '').toLowerCase().includes(q))
    );
  }, [baseList, searchQuery]);

  // Separate pinned vs date grouped for active view
  const pinnedConversations = useMemo(
    () => (viewMode === 'active' ? filtered.filter((c) => c.pinned) : []),
    [filtered, viewMode]
  );

  const dateGroups = useMemo(
    () =>
      viewMode === 'active'
        ? groupConversationsByDate(filtered.filter((c) => !c.pinned))
        : [],
    [filtered, viewMode]
  );

  const handleStartRename = (conv: StoredConversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      renameStoredConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const shownName = (displayName || authUser?.name || '').trim();
  const initials = shownName
    ? shownName
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'QB';

  const content = (
    <div className="flex flex-col h-full bg-[#060A14] text-gray-300 border-r border-gray-800/80 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-gray-800/60">
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          title="Back to Quantum AI Website"
        >
          <QuantumBotIcon size={26} showGlow />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-white tracking-tight font-mono text-sm">
                QuantumBot
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                QUANTUM AI
              </span>
            </div>
          )}
        </Link>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={() => {
            setViewMode('active');
            onNewChat();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-200 hover:text-white text-xs font-semibold font-mono tracking-wide transition-all shadow-[0_0_12px_rgba(0,240,255,0.1)]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {!isCollapsed && <span>New Conversation</span>}
        </button>
      </div>

      {/* Search + Active / Archived Switcher (visible when not collapsed) */}
      {!isCollapsed && (
        <div className="px-3 pb-2 space-y-2">
          <div className="relative flex items-center">
            <svg
              className="absolute left-2.5 w-3.5 h-3.5 text-gray-500 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              aria-label="Search conversations"
              className="w-full bg-[#090E1D] text-xs text-white placeholder-gray-500 pl-8 pr-3 py-1.5 rounded-lg border border-gray-800/80 focus:border-cyan-500/40 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-[#090E1D] border border-gray-800/70 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setViewMode('active')}
              className={`py-1 rounded-md transition-colors ${
                viewMode === 'active'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Chats ({activeList.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('archived')}
              className={`py-1 rounded-md transition-colors ${
                viewMode === 'archived'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Archived ({archivedList.length})
            </button>
          </div>
        </div>
      )}

      {/* Conversation List Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2 text-xs">
        {!isCollapsed && viewMode === 'archived' ? (
          <div className="space-y-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-gray-500 text-xs">
                {searchQuery.trim() ? 'No matching archived chats.' : 'No archived conversations.'}
              </div>
            ) : (
              filtered.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-gray-800/60 bg-[#090E1D]/60 ${
                    conv.id === activeConversationId ? 'border-cyan-500/40 text-cyan-200' : 'text-gray-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectConversation(conv.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="truncate text-left text-xs flex-1 hover:text-white"
                    title={conv.title}
                  >
                    {conv.title}
                  </button>
                  <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => restoreStoredConversation(conv.id)}
                      className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60 border border-cyan-500/30"
                      title="Restore conversation"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStoredConversation(conv.id)}
                      className="px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 border border-rose-800/40"
                      title="Delete forever"
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedConversations.length > 0 && !isCollapsed && (
              <div>
                <div className="px-2.5 py-1 text-[10.5px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
                  </svg>
                  Pinned
                </div>
                <div className="space-y-0.5 mt-1">
                  {pinnedConversations.map((conv) => (
                    <ConversationRow
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeConversationId}
                      isEditing={editingId === conv.id}
                      editTitle={editTitle}
                      onSelect={() => {
                        onSelectConversation(conv.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      onStartRename={() => handleStartRename(conv)}
                      onSaveRename={() => handleSaveRename(conv.id)}
                      onCancelRename={() => setEditingId(null)}
                      onChangeTitle={setEditTitle}
                      onTogglePin={() => togglePinConversation(conv.id)}
                      onArchive={() => archiveStoredConversation(conv.id)}
                      onDelete={() => deleteStoredConversation(conv.id)}
                      isMenuOpen={menuOpenId === conv.id}
                      onToggleMenu={() => setMenuOpenId(menuOpenId === conv.id ? null : conv.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Chronological Groups */}
            {!isCollapsed ? (
              dateGroups.map((group) => (
                <div key={group.label}>
                  <div className="px-2.5 py-1 text-[10.5px] font-mono uppercase tracking-wider text-gray-500">
                    {group.label}
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {group.conversations.map((conv) => (
                      <ConversationRow
                        key={conv.id}
                        conversation={conv}
                        isActive={conv.id === activeConversationId}
                        isEditing={editingId === conv.id}
                        editTitle={editTitle}
                        onSelect={() => {
                          onSelectConversation(conv.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        onStartRename={() => handleStartRename(conv)}
                        onSaveRename={() => handleSaveRename(conv.id)}
                        onCancelRename={() => setEditingId(null)}
                        onChangeTitle={setEditTitle}
                        onTogglePin={() => togglePinConversation(conv.id)}
                        onArchive={() => archiveStoredConversation(conv.id)}
                        onDelete={() => deleteStoredConversation(conv.id)}
                        isMenuOpen={menuOpenId === conv.id}
                        onToggleMenu={() => setMenuOpenId(menuOpenId === conv.id ? null : conv.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              /* Collapsed Icons */
              <div className="flex flex-col items-center space-y-2">
                {activeList.slice(0, 10).map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => onSelectConversation(conv.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      conv.id === activeConversationId
                        ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/40'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                    }`}
                    title={conv.title}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 && !isCollapsed && (
              <div className="px-3 py-6 text-center text-gray-500 text-xs">
                {searchQuery.trim() ? 'No matching conversations.' : 'No conversations yet.'}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Account & Controls */}
      <div className="p-3 border-t border-gray-800/60 bg-[#070b16] space-y-1.5">
        {!isCollapsed && (
          <div className="px-2 py-2 rounded-xl bg-[#0a1020] border border-gray-800/80 mb-1">
            {isAuthenticated && authUser ? (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenSettings('personalization')}
                  className="flex items-center gap-2 min-w-0 text-left hover:opacity-90"
                  title="Edit personalization & account"
                >
                  <span className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">
                      {shownName || authUser.email}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate font-mono">
                      {authUser.email}
                    </div>
                  </div>
                </button>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="px-2 py-1 text-[10px] font-mono text-gray-300 hover:text-white bg-gray-800/70 hover:bg-gray-700/80 rounded-md shrink-0"
                    title="Sign Out"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-gray-200 truncate">
                    {shownName ? `${shownName} (Guest)` : 'Guest Session'}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    Sign in to save across devices
                  </div>
                </div>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={() => onOpenAuthModal('login')}
                    className="px-2.5 py-1 text-[10px] font-mono font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-md shrink-0"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => onOpenSettings('engine')}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors text-xs font-mono"
        >
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!isCollapsed && <span>Settings &amp; Personalization</span>}
        </button>

        <Link
          href="/"
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50 transition-colors text-xs font-mono"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {!isCollapsed && <span>Return to Website</span>}
        </Link>
      </div>
    </div>
  );

  // Desktop vs Mobile Drawer
  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 h-dvh ${
          isCollapsed ? 'w-16' : 'w-72'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Individual Conversation Item Row with Pin, Rename, Archive & Delete options
 */
function ConversationRow({
  conversation,
  isActive,
  isEditing,
  editTitle,
  onSelect,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onChangeTitle,
  onTogglePin,
  onArchive,
  onDelete,
  isMenuOpen,
  onToggleMenu,
}: {
  conversation: StoredConversation;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onStartRename: () => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onChangeTitle: (val: string) => void;
  onTogglePin: () => void;
  onArchive: () => void;
  onDelete: () => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}) {
  if (isEditing) {
    return (
      <div className="px-2 py-1 bg-gray-900 rounded-lg flex items-center gap-1 border border-cyan-500/50">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveRename();
            if (e.key === 'Escape') onCancelRename();
          }}
          className="flex-1 bg-transparent text-xs text-white outline-none"
        />
        <button
          type="button"
          onClick={onSaveRename}
          className="p-1 text-cyan-400 hover:text-white"
        >
          ✓
        </button>
        <button
          type="button"
          onClick={onCancelRename}
          className="p-1 text-gray-500 hover:text-white"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-[#0f172a] text-cyan-300 border-l-2 border-cyan-400 font-medium'
          : 'text-gray-400 hover:bg-gray-900/60 hover:text-gray-200'
      }`}
      onClick={onSelect}
    >
      <span className="truncate max-w-[185px] text-xs" title={conversation.title}>
        {conversation.title}
      </span>

      {/* Options Menu Trigger */}
      <div
        className={`transition-opacity ${
          isMenuOpen ? 'opacity-100' : 'opacity-75 sm:opacity-0 sm:group-hover:opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onToggleMenu}
          className="p-1 text-gray-500 hover:text-white rounded"
          title="Conversation options"
          aria-label={`Options for ${conversation.title}`}
        >
          •••
        </button>

        {isMenuOpen && (
          <div className="absolute right-2 top-8 w-36 rounded-lg bg-[#0a101f] border border-gray-800 shadow-xl z-30 py-1 divide-y divide-gray-800/40 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => {
                onTogglePin();
                onToggleMenu();
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 text-gray-300"
            >
              {conversation.pinned ? 'Unpin' : 'Pin to top'}
            </button>
            <button
              type="button"
              onClick={() => {
                onStartRename();
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 text-gray-300"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => {
                onArchive();
                onToggleMenu();
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 text-amber-300"
            >
              Archive
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete();
                onToggleMenu();
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-rose-950/40 text-rose-400"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
