import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Trash2,
  MessageSquare,
  AtSign,
  LogIn,
  Users,
  Search,
} from 'lucide-react';
import { TeamChatMessage, User } from '../types';

interface TeamChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  messages: TeamChatMessage[];
  onSendMessage: (text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  currentUser: User | null;
  users: User[];
  onOpenAuthModal: () => void;
}

export const TeamChatSidebar: React.FC<TeamChatSidebarProps> = ({
  isOpen,
  onClose,
  projectId: _projectId,
  projectName,
  messages,
  onSendMessage,
  onDeleteMessage,
  currentUser,
  users,
  onOpenAuthModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter messages by keyword or sender
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase().trim();
    return messages.filter((msg) => {
      const textMatch = msg.text.toLowerCase().includes(q);
      const sender = users.find((u) => u.id === msg.userId);
      const authorMatch = sender
        ? sender.name.toLowerCase().includes(q) || sender.username.toLowerCase().includes(q)
        : false;
      return textMatch || authorMatch;
    });
  }, [messages, searchQuery, users]);

  // Auto-scroll on new messages (only when not searching)
  useEffect(() => {
    if (isOpen && !searchQuery.trim()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setShowMentionMenu(false);
  };

  const handleInsertMention = (username: string) => {
    setInputText((prev) => {
      const trimmed = prev.trimEnd();
      return trimmed ? `${trimmed} @${username} ` : `@${username} `;
    });
    setShowMentionMenu(false);
    inputRef.current?.focus();
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      if (isToday) {
        return `${hours}:${minutes}`;
      }
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month} ${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Subtle backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <aside
        id="team-chat-sidebar"
        className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-xl animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                  Chat de Equipe
                </h2>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({messages.length})
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                {projectName}
              </p>
            </div>
          </div>

          <button
            id="close-chat-sidebar-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fechar chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              id="team-chat-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mensagens por palavra-chave..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition"
            />
            {searchQuery && (
              <button
                id="clear-chat-search-btn"
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchQuery.trim() && (
            <div className="flex items-center justify-between mt-1 px-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span>
                {filteredMessages.length === 1
                  ? '1 mensagem encontrada'
                  : `${filteredMessages.length} mensagens encontradas`}
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                Limpar filtro
              </button>
            </div>
          )}
        </div>

        {/* Team Members Ribbon */}
        <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
            {users.map((user, idx) => (
              <button
                key={`ribbon-user-${user.id || user.username || idx}`}
                type="button"
                onClick={() => handleInsertMention(user.username)}
                title={`Mencionar @${user.username} (${user.name})`}
                className="shrink-0 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 pl-1 pr-1.5 py-0.5 rounded-full text-[10px] text-slate-600 dark:text-slate-300 hover:border-indigo-400 transition cursor-pointer"
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${user.avatarBg}`}
                >
                  {user.name.charAt(0)}
                </span>
                <span className="truncate max-w-[60px]">{user.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2.5">
                <MessageSquare className="w-5 h-5 stroke-1" />
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Nenhuma mensagem neste projeto
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[220px]">
                Converse com os membros da equipe sobre tarefas e alinhamentos rápidos.
              </p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-2.5">
                <Search className="w-5 h-5 stroke-1" />
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Nenhuma mensagem encontrada
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[220px]">
                Nenhum resultado para "{searchQuery}". Tente outros termos ou palavras-chave.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-md transition cursor-pointer"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const sender = users.find((u) => u.id === msg.userId);
              const isMe = currentUser?.id === msg.userId;

              return (
                <div
                  key={msg.id}
                  id={`chat-msg-${msg.id}`}
                  className={`group flex items-start gap-2 text-xs ${
                    isMe ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* Sender Avatar */}
                  <div
                    title={sender ? `${sender.name} (@${sender.username})` : 'Membro'}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 ${
                      sender?.avatarBg || 'bg-slate-400'
                    }`}
                  >
                    {sender ? sender.name.charAt(0).toUpperCase() : '?'}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-xs relative ${
                      isMe
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`text-[10px] font-semibold truncate ${
                          isMe
                            ? 'text-slate-300 dark:text-slate-600'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isMe ? 'Você' : sender ? sender.name.split(' ')[0] : 'Membro'}
                      </span>
                      <span
                        className={`text-[9px] ${
                          isMe
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-400'
                        }`}
                      >
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {msg.text.split(' ').map((word, wIdx) => {
                        if (word.startsWith('@')) {
                          return (
                            <span
                              key={wIdx}
                              className={`font-semibold underline underline-offset-2 mr-0.5 ${
                                isMe
                                  ? 'text-indigo-300 dark:text-indigo-600'
                                  : 'text-indigo-600 dark:text-indigo-400'
                              }`}
                            >
                              {word}{' '}
                            </span>
                          );
                        }

                        // Highlight keyword match if searching
                        if (
                          searchQuery.trim() &&
                          word.toLowerCase().includes(searchQuery.toLowerCase().trim())
                        ) {
                          const q = searchQuery.toLowerCase().trim();
                          const lower = word.toLowerCase();
                          const matchStart = lower.indexOf(q);
                          const before = word.slice(0, matchStart);
                          const match = word.slice(matchStart, matchStart + q.length);
                          const after = word.slice(matchStart + q.length);

                          return (
                            <span key={wIdx}>
                              {before}
                              <mark className="bg-amber-200 dark:bg-amber-400/30 text-amber-950 dark:text-amber-100 rounded-xs px-0.5 font-medium">
                                {match}
                              </mark>
                              {after}{' '}
                            </span>
                          );
                        }

                        return word + ' ';
                      })}
                    </p>

                    {/* Delete button (hover) */}
                    {(isMe || !currentUser) && (
                      <button
                        type="button"
                        onClick={() => onDeleteMessage(msg.id)}
                        className={`absolute -top-1.5 ${
                          isMe ? '-left-6' : '-right-6'
                        } opacity-0 group-hover:opacity-100 p-1 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer`}
                        title="Apagar mensagem"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer / Input Bar */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {!currentUser ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Entre para enviar mensagens com seu perfil.
              </span>
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Entrar</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="relative flex flex-col gap-1.5">
              {/* Mentions dropdown toggle menu */}
              {showMentionMenu && (
                <div className="absolute bottom-full mb-1 left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1 z-10 max-h-40 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase">
                    Mencionar membro:
                  </div>
                  {users.map((u, idx) => (
                    <button
                      key={`mention-user-${u.id || u.username || idx}`}
                      type="button"
                      onClick={() => handleInsertMention(u.username)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${u.avatarBg}`}
                      >
                        {u.name.charAt(0)}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {u.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        @{u.username}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowMentionMenu((prev) => !prev)}
                  title="Mencionar membro (@)"
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <AtSign className="w-3.5 h-3.5" />
                </button>

                <input
                  ref={inputRef}
                  id="team-chat-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Mensagem rápida para a equipe..."
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                />

                <button
                  id="send-chat-msg-btn"
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-30 hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition cursor-pointer"
                  title="Enviar mensagem"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </aside>
    </>
  );
};
