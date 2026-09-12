import React, { useState } from 'react';
import {
  Clock,
  Bell,
  FileUp,
  Plus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  LogIn,
  LogOut,
  UserPlus,
  User as UserIcon,
  ChevronDown,
  Download,
  MessageSquare,
  Mail,
  Users,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { User, Task, Project, ActiveView } from '../types';

interface HeaderProps {
  currentProject: Project;
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject?: (name: string) => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  users: User[];
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onOpenAddUserModal: () => void;
  onOpenTeamModal?: () => void;
  onLogout: () => void;
  onExportCsv: () => void;
  selectedUserId: string | null;
  onSelectUserId: (userId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  activeTrackingTask: Task | null;
  onToggleTimer: (task: Task) => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenPdfImport: () => void;
  onOpenNewTask: () => void;
  overdueCount: number;
  dueSoonCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenTeamChat: () => void;
  teamChatMessagesCount: number;
  isCloudConnected?: boolean;
  onRetryConnection?: () => void;
  isReconnecting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  projects,
  onSelectProject,
  onCreateProject,
  activeView,
  setActiveView,
  users,
  currentUser,
  onOpenAuthModal,
  onOpenAddUserModal,
  onOpenTeamModal,
  onLogout,
  onExportCsv,
  selectedUserId,
  onSelectUserId,
  searchQuery,
  setSearchQuery,
  priorityFilter,
  setPriorityFilter,
  activeTrackingTask,
  onToggleTimer,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenPdfImport,
  onOpenNewTask,
  overdueCount,
  dueSoonCount,
  theme,
  onToggleTheme,
  onOpenTeamChat,
  teamChatMessagesCount,
  isCloudConnected = true,
  onRetryConnection,
  isReconnecting = false,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-black/95 backdrop-blur-md border-b border-slate-200/70 dark:border-neutral-800/80 transition-colors duration-200">
      {/* Top Brand & Actions Bar */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Project Selector */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Kanban className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                TaskFlow
              </h1>
              {isCreatingProject ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newProjectTitle.trim() && onCreateProject) {
                      onCreateProject(newProjectTitle.trim());
                      setNewProjectTitle('');
                      setIsCreatingProject(false);
                    }
                  }}
                  className="flex items-center gap-1 mt-0.5"
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nome do projeto..."
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="text-xs px-2 py-0.5 rounded border border-indigo-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-hidden w-36 shadow-2xs"
                  />
                  <button
                    type="submit"
                    className="text-[10px] px-1.5 py-0.5 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition cursor-pointer"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingProject(false);
                      setNewProjectTitle('');
                    }}
                    className="text-[10px] px-1 py-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1">
                  <select
                    id="project-selector"
                    value={currentProject.id}
                    onChange={(e) => {
                      const p = projects.find((proj) => proj.id === e.target.value);
                      if (p) onSelectProject(p);
                    }}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent border-0 p-0 pr-2 focus:ring-0 cursor-pointer font-medium transition"
                  >
                    {projects.map((p, idx) => (
                      <option key={`proj-opt-${p.id || idx}`} value={p.id} className="dark:bg-slate-900 dark:text-slate-100">
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {onCreateProject && (
                    <button
                      id="create-project-quick-btn"
                      type="button"
                      onClick={() => setIsCreatingProject(true)}
                      title="Criar novo projeto"
                      className="p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Cloud Real-Time Sync Indicator */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors shadow-2xs ${
                isCloudConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80'
              }`}
              title={
                isCloudConnected
                  ? 'Conectado à nuvem Firebase Firestore. Sincronizado em tempo real entre todos os dispositivos.'
                  : 'Sincronizando com a nuvem...'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <Cloud className="w-3.5 h-3.5 shrink-0" />
              <span>{isCloudConnected ? 'Salvo em Nuvem' : 'Sincronizando...'}</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* View Switcher: Dashboard vs Kanban vs Table */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg text-xs">
              <button
                id="view-dashboard-btn"
                type="button"
                onClick={() => setActiveView('dashboard')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Dashboard</span>
              </button>
              <button
                id="view-kanban-btn"
                type="button"
                onClick={() => setActiveView('kanban')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  activeView === 'kanban'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Quadro</span>
              </button>
              <button
                id="view-table-btn"
                type="button"
                onClick={() => setActiveView('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  activeView === 'table'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Planilha</span>
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            {/* Import PDF Button */}
            <button
              id="import-pdf-modal-btn"
              type="button"
              onClick={onOpenPdfImport}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
              title="Importar tarefas via PDF"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Importar</span>
            </button>

            {/* Export CSV Button */}
            <button
              id="export-csv-header-btn"
              type="button"
              onClick={onExportCsv}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
              title="Exportar tarefas para CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            {/* Team Chat Button */}
            <button
              id="team-chat-drawer-btn"
              type="button"
              onClick={onOpenTeamChat}
              className="relative p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer flex items-center gap-1"
              title="Chat de Equipe"
              aria-label="Chat de Equipe"
            >
              <MessageSquare className="w-4 h-4" />
              {teamChatMessagesCount > 0 && (
                <span
                  id="chat-messages-badge"
                  className="text-[10px] font-medium text-slate-500 dark:text-slate-400"
                >
                  {teamChatMessagesCount}
                </span>
              )}
            </button>

            {/* Persistent Firebase Cloud Sync Indicator */}
            {isCloudConnected ? (
              <div
                id="header-cloud-sync-status"
                className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 transition"
                title="Sincronização com Firebase em tempo real ativa"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Sincronizado</span>
              </div>
            ) : (
              <button
                id="header-cloud-offline-alert-btn"
                type="button"
                onClick={onRetryConnection}
                disabled={isReconnecting}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900 transition cursor-pointer shadow-2xs group"
                title="Sincronização com Firebase interrompida. As alterações estão sendo salvas localmente neste navegador. Clique para tentar reconectar."
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <CloudOff className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>
                  <span className="font-bold">Offline</span>
                  <span className="hidden sm:inline font-normal text-amber-800 dark:text-amber-300 ml-1">(Salvo local)</span>
                </span>
                <RefreshCw
                  className={`w-3 h-3 ml-0.5 text-amber-700 dark:text-amber-400 ${
                    isReconnecting ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'
                  }`}
                />
              </button>
            )}

            {/* Notification Bell Button */}
            <button
              id="notifications-drawer-btn"
              type="button"
              onClick={onOpenNotifications}
              className="relative p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
              title="Notificações"
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span
                  id="notifications-badge"
                  className={`absolute 0.5 top-0.5 right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white ${
                    overdueCount > 0 ? 'bg-rose-500' : 'bg-indigo-600'
                  }`}
                >
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              aria-label={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* User Account / Profile */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  title={`Conectado: ${currentUser.name}`}
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                  ) : (
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${currentUser.avatarBg}`}
                    >
                      {currentUser.name.charAt(0)}
                    </span>
                  )}
                  <span className="hidden sm:inline font-medium text-xs max-w-[80px] truncate">{currentUser.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showUserDropdown && (
                  <div
                    className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-2.5 z-50 text-xs space-y-1 animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2.5 pb-2.5 mb-1 border-b border-slate-100 dark:border-slate-800">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-indigo-500/30"
                        />
                      ) : (
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${currentUser.avatarBg}`}
                        >
                          {currentUser.name.charAt(0)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {currentUser.name}
                          </p>
                          {(currentUser.provider === 'google' || currentUser.email.toLowerCase().endsWith('@gmail.com')) && (
                            <span className="px-1.5 py-0.2 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[9px] font-bold rounded-full border border-red-200 dark:border-red-900 shrink-0">
                              Gmail
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    {/* Firebase Cloud Sync Status Info */}
                    <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                        {isCloudConnected ? (
                          <Cloud className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <CloudOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <span>Sincronização:</span>
                      </span>
                      {isCloudConnected ? (
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded">
                          Nuvem Ativa
                        </span>
                      ) : (
                        <button
                          id="dropdown-retry-connection-btn"
                          type="button"
                          onClick={() => {
                            setShowUserDropdown(false);
                            onRetryConnection?.();
                          }}
                          className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded hover:bg-amber-200 dark:hover:bg-amber-900 transition cursor-pointer"
                          title="Clique para testar e reconectar com o Firebase"
                        >
                          Salvo Local (Reconectar)
                        </button>
                      )}
                    </div>

                    <button
                      id="user-menu-switch-account-btn"
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenAuthModal();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Trocar Conta / Login com Gmail</span>
                    </button>

                    {onOpenTeamModal && (
                      <button
                        id="user-menu-manage-team-btn"
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenTeamModal();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Equipe do Projeto ({users.length})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenAddUserModal();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                      <span>Convidar Membro</span>
                    </button>

                    <button
                      id="header-logout-btn"
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair da Conta (Desconectar)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="login-header-btn"
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}

            {/* Convidar Colaborador Button */}
            <button
              id="invite-collaborator-header-btn"
              type="button"
              onClick={onOpenAddUserModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-neutral-900 hover:bg-indigo-100 dark:hover:bg-neutral-800 border border-indigo-200 dark:border-neutral-800 shadow-2xs transition cursor-pointer"
              title="Convidar colaborador por e-mail para o projeto"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Convidar</span>
            </button>

            {/* New Task Button */}
            <button
              id="create-new-task-btn"
              type="button"
              onClick={onOpenNewTask}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition cursor-pointer ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>

        {/* Minimalist Filter & Search Toolbar */}
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Left: Search & Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-tasks-input"
                type="text"
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-2.5 py-1 bg-slate-50/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:outline-hidden focus:border-slate-400 dark:focus:border-slate-600 w-36 sm:w-44 transition"
              />
            </div>

            <select
              id="priority-filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-1 px-2 bg-slate-50/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all" className="dark:bg-slate-900 dark:text-slate-100">Prioridade: Todas</option>
              <option value="urgente" className="dark:bg-slate-900 dark:text-slate-100">Urgente</option>
              <option value="alta" className="dark:bg-slate-900 dark:text-slate-100">Alta</option>
              <option value="media" className="dark:bg-slate-900 dark:text-slate-100">Média</option>
              <option value="baixa" className="dark:bg-slate-900 dark:text-slate-100">Baixa</option>
            </select>

            {/* Overdue / Due soon subtle indicator */}
            {overdueCount > 0 && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer shrink-0"
                title="Clique para abrir a central de alertas"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>{overdueCount} atrasada{overdueCount > 1 ? 's' : ''}</span>
              </button>
            )}
            {dueSoonCount > 0 && overdueCount === 0 && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer shrink-0"
                title="Clique para abrir a central de alertas"
              >
                <Clock className="w-3 h-3" />
                <span>{dueSoonCount} prazo hoje</span>
              </button>
            )}
          </div>

          {/* Right: Team Members Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mr-0.5">
              Membros:
            </span>

            <button
              id="filter-all-users-btn"
              type="button"
              onClick={() => onSelectUserId(null)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                selectedUserId === null
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos
            </button>

            <div className="flex items-center -space-x-1.5 hover:space-x-1 transition-all">
              {users.map((u, idx) => {
                const isSelected = selectedUserId === u.id;
                const userKey = u.id ? `header-user-${u.id}` : (u.username ? `header-user-${u.username}` : `header-user-${idx}`);
                return (
                  <button
                    key={userKey}
                    id={`filter-user-${u.username || u.id || idx}`}
                    type="button"
                    onClick={() =>
                      onSelectUserId(isSelected ? null : u.id)
                    }
                    title={`${u.name} (@${u.username})`}
                    className={`relative rounded-full transition-transform cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 scale-110 z-10'
                        : 'hover:scale-105 hover:z-10'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950 shadow-2xs ${u.avatarBg}`}
                    >
                      {u.name.charAt(0)}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              id="header-add-user-btn"
              type="button"
              onClick={onOpenAddUserModal}
              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Adicionar / Convidar membro à equipe"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>

            {onOpenTeamModal && (
              <button
                id="header-open-team-modal-btn"
                type="button"
                onClick={onOpenTeamModal}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition cursor-pointer ml-0.5"
                title="Ver e gerenciar membros da equipe"
              >
                <Users className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Gerenciar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
