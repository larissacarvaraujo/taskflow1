import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { RunrunTableView } from './components/RunrunTableView';
import { DashboardView } from './components/DashboardView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { PdfImportModal } from './components/PdfImportModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { NewTaskModal } from './components/NewTaskModal';
import { AuthModal } from './components/AuthModal';
import { AddUserModal } from './components/AddUserModal';
import { TeamManagementModal } from './components/TeamManagementModal';
import { InviteAcceptModal } from './components/InviteAcceptModal';
import { TeamChatSidebar } from './components/TeamChatSidebar';
import { NotificationPermissionBanner } from './components/NotificationPermissionBanner';
import { TagFilterSidebar, getTagPalette } from './components/TagFilterSidebar';
import { Task, User, Project, Column, ColumnId, NotificationItem, TeamChatMessage, ActiveView } from './types';
import { resolveInvite, StoredInvite } from './services/inviteService';
import {
  INITIAL_TASKS,
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_COLUMNS,
} from './data/initialData';
import {
  generateDeadlineNotifications,
  generateMentionNotifications,
  getDeadlineStatus,
  exportTasksToCsv,
} from './utils/helpers';
import {
  getSystemNotificationPermission,
  requestSystemNotificationPermission,
  sendSystemNotification,
  hasBeenNotified,
  markAsNotified,
  NotificationPermissionStatus,
} from './services/systemNotificationService';
import { CheckCircle2, Undo2, AlertTriangle, X, Mail, Filter, Tag, SlidersHorizontal, ChevronRight } from 'lucide-react';
import {
  subscribeToTasks,
  saveTaskToCloud,
  deleteTaskFromCloud,
  subscribeToUsers,
  saveUserToCloud,
  deleteUserFromCloud,
  subscribeToColumns,
  saveColumnToCloud,
  subscribeToMessages,
  saveMessageToCloud,
  seedInitialCloudDataIfEmpty,
} from './firebase';

const STORAGE_KEY_TASKS = 'taskflow_tasks_v2';
const STORAGE_KEY_PROJECTS = 'taskflow_projects_v2';
const STORAGE_KEY_THEME = 'taskflow_theme_v1';
const STORAGE_KEY_USERS = 'taskflow_users_v2';
const STORAGE_KEY_CURRENT_USER = 'taskflow_current_user_v2';
const STORAGE_KEY_TEAM_MESSAGES = 'taskflow_team_messages_v2';

export default function App() {
  // Theme state (Dark mode high contrast)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (e) {
      console.error('Error saving theme to localStorage:', e);
    }

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Persistence state for Projects
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed: Project[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remove retired projects "Transformação Digital" and "Lançamento Mobile"
          const filtered = parsed.filter(
            (p) =>
              !p.name.toLowerCase().includes('transformação digital') &&
              !p.name.toLowerCase().includes('transformacao digital') &&
              !p.name.toLowerCase().includes('lançamento') &&
              !p.name.toLowerCase().includes('lancamento')
          );
          if (filtered.length > 0) return filtered;
        }
      }
      return INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(
    () => projects[0]?.id || 'proj-1'
  );

  // Keep currentProjectId in sync if the active project was removed
  useEffect(() => {
    if (!projects.some((p) => p.id === currentProjectId) && projects.length > 0) {
      setCurrentProjectId(projects[0].id);
    }
  }, [projects, currentProjectId]);

  // Users state with persistence and ID sanitization
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set<string>();
          return parsed.map((u, idx) => {
            let id = (u && typeof u.id === 'string' && u.id.trim()) ? u.id.trim() : `usr-saved-${idx}-${Date.now()}`;
            if (seen.has(id)) {
              id = `${id}-${idx}`;
            }
            seen.add(id);
            return {
              ...u,
              id,
              username: u.username || `user_${idx}`,
            };
          });
        }
      }
    } catch (e) {
      console.error('Error loading users from localStorage:', e);
    }
    return INITIAL_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users to localStorage:', e);
    }
  }, [users]);

  // Current logged in user (Email login)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      }
      // Default to the first user (e.g. Graciele Silva)
      return INITIAL_USERS[0] || null;
    } catch {
      return INITIAL_USERS[0] || null;
    }
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (e) {
      console.error('Error saving currentUser to localStorage:', e);
    }
  }, [currentUser]);

  const [columns, setColumns] = useState<Column[]>(() => {
    try {
      const saved = localStorage.getItem('taskflow_columns_v2');
      if (saved) {
        const parsed: Column[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading columns from localStorage:', e);
    }
    return INITIAL_COLUMNS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('taskflow_columns_v2', JSON.stringify(columns));
    } catch (e) {
      console.error('Error saving columns to localStorage:', e);
    }
  }, [columns]);

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) {
        const parsed: Task[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((t) => (t.projectId === 'proj-2' ? { ...t, projectId: 'proj-1' } : t));
        }
      }
      return INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  // UI state
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagFilterMode, setTagFilterMode] = useState<'any' | 'all'>('any');
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('taskflow_tag_sidebar_open');
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
    } catch {
      return true;
    }
  });

  // Real-time Firebase Cloud Synchronization
  useEffect(() => {
    // Seed initial collections to cloud if currently empty
    seedInitialCloudDataIfEmpty(INITIAL_TASKS, INITIAL_USERS, INITIAL_COLUMNS, INITIAL_PROJECTS);

    // 1. Real-time tasks subscription
    const unsubTasks = subscribeToTasks(
      (cloudTasks) => {
        if (cloudTasks && cloudTasks.length > 0) {
          setTasks(cloudTasks);
        }
        setIsCloudConnected(true);
      },
      (err) => {
        console.warn('Tasks sync warning:', err);
      }
    );

    // 2. Real-time users subscription
    const unsubUsers = subscribeToUsers(
      (cloudUsers) => {
        if (cloudUsers && cloudUsers.length > 0) {
          setUsers(cloudUsers);
        }
      },
      (err) => {
        console.warn('Users sync warning:', err);
      }
    );

    // 3. Real-time columns subscription
    const unsubCols = subscribeToColumns(
      (cloudCols) => {
        if (cloudCols && cloudCols.length > 0) {
          setColumns(cloudCols);
        }
      },
      (err) => {
        console.warn('Columns sync warning:', err);
      }
    );

    // 4. Real-time messages subscription
    const unsubMsgs = subscribeToMessages(
      (cloudMsgs) => {
        if (cloudMsgs && cloudMsgs.length > 0) {
          setTeamMessages(cloudMsgs);
        }
      },
      (err) => {
        console.warn('Messages sync warning:', err);
      }
    );

    return () => {
      unsubTasks();
      unsubUsers();
      unsubCols();
      unsubMsgs();
    };
  }, []);

  // Modals & Drawers
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(
    null
  );
  const [isPdfImportOpen, setIsPdfImportOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskInitialColumn, setNewTaskInitialColumn] = useState<ColumnId>('todo');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isTeamChatOpen, setIsTeamChatOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isTeamManagementOpen, setIsTeamManagementOpen] = useState(false);

  // Team Chat Messages with persistence per project
  const [teamMessages, setTeamMessages] = useState<TeamChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEAM_MESSAGES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading team messages from localStorage:', e);
    }
    return [
      {
        id: 'msg-seed-1',
        projectId: 'proj-1',
        userId: 'usr-1',
        text: 'Olá equipe! Vamos alinhar as prioridades de hoje no quadro.',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'msg-seed-2',
        projectId: 'proj-1',
        userId: 'usr-2',
        text: 'Combinado @graciele! Começando a tarefa de onboarding.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEAM_MESSAGES, JSON.stringify(teamMessages));
    } catch (e) {
      console.error('Error saving team messages to localStorage:', e);
    }
  }, [teamMessages]);

  // Messages filtered for current project
  const projectTeamMessages = useMemo(() => {
    return teamMessages.filter((m) => m.projectId === currentProjectId);
  }, [teamMessages, currentProjectId]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !currentUser) return;
    const newMsg: TeamChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId: currentProjectId,
      userId: currentUser.id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setTeamMessages((prev) => [...prev, newMsg]);
    saveMessageToCloud(newMsg);
  };

  const handleDeleteMessage = (messageId: string) => {
    setTeamMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Pending collaborator invitation detected in URL (?invite=... or ?token=...)
  const [pendingInvite, setPendingInvite] = useState<StoredInvite | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const inviteId = params.get('invite');
      const token = params.get('token');

      if (inviteId || token) {
        resolveInvite(inviteId, token).then((invite) => {
          if (invite) {
            setPendingInvite(invite);
          }
        });
      }
    } catch (err) {
      console.error('Error resolving invite from URL:', err);
    }
  }, []);

  const handleAcceptInvite = () => {
    if (!pendingInvite) return;

    // 1. Ensure user exists in team users list
    let existingUser = users.find(
      (u) => u.email.toLowerCase() === pendingInvite.email.toLowerCase()
    );
    let userToSet: User;

    if (existingUser) {
      userToSet = existingUser;
    } else {
      const newUser: User = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: pendingInvite.name,
        email: pendingInvite.email,
        role: pendingInvite.role || 'Colaborador(a)',
        username:
          pendingInvite.username ||
          pendingInvite.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        avatarBg: pendingInvite.avatarBg || 'bg-indigo-600 text-white',
      };
      setUsers((prev) => [...prev, newUser]);
      userToSet = newUser;
    }

    // 2. Set as current logged in user
    setCurrentUser(userToSet);

    // 3. Set project
    if (pendingInvite.projectId) {
      const hasProject = projects.some((p) => p.id === pendingInvite.projectId);
      if (hasProject) {
        setCurrentProjectId(pendingInvite.projectId);
      } else if (pendingInvite.projectName) {
        const newProj: Project = {
          id: pendingInvite.projectId,
          name: pendingInvite.projectName,
          description: `Projeto compartilhado por ${pendingInvite.inviterName}`,
          category: 'Projetos Compartilhados',
        };
        setProjects((prev) => [...prev, newProj]);
        setCurrentProjectId(newProj.id);
      }
    }

    // 4. Merge tasks if passed in invite
    if (pendingInvite.projectTasks && pendingInvite.projectTasks.length > 0) {
      setTasks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const toAdd = pendingInvite.projectTasks!.filter(
          (t) => !existingIds.has(t.id)
        );
        return [...prev, ...toAdd];
      });
    }

    // 5. Clean URL query parameters
    try {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('invite');
      cleanUrl.searchParams.delete('token');
      window.history.replaceState({}, document.title, cleanUrl.pathname);
    } catch (e) {
      console.error('Error cleaning URL params:', e);
    }

    // 6. Close modal & show welcome notification
    setPendingInvite(null);
    setToastMessage(
      `🎉 Bem-vindo(a) ao projeto "${pendingInvite.projectName}", ${userToSet.name}! Você está conectado(a) e pronto(a) para colaborar.`
    );
  };

  const handleDeclineInvite = () => {
    try {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('invite');
      cleanUrl.searchParams.delete('token');
      window.history.replaceState({}, document.title, cleanUrl.pathname);
    } catch (e) {
      console.error('Error cleaning URL params:', e);
    }
    setPendingInvite(null);
  };

  // Undo delete notification banner
  const [deletedTaskUndo, setDeletedTaskUndo] = useState<{
    task: Task;
    timerId: NodeJS.Timeout;
  } | null>(null);

  // Active tracking task ID (Runrun.it style timer)
  const [activeTrackingTaskId, setActiveTrackingTaskId] = useState<string | null>(
    () => {
      const running = tasks.find((t) => t.isTracking);
      return running ? running.id : null;
    }
  );

  // Save tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving tasks to localStorage:', e);
    }
  }, [tasks]);

  // Save projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Error saving projects to localStorage:', e);
    }
  }, [projects]);

  // Runrun.it Live Timer ticker
  useEffect(() => {
    if (!activeTrackingTaskId) return;

    const interval = setInterval(() => {
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          if (t.id === activeTrackingTaskId) {
            return {
              ...t,
              trackedSeconds: (t.trackedSeconds || 0) + 1,
            };
          }
          return t;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTrackingTaskId]);

  // Sound alert using Web Audio API
  const playAlertSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio alert unavailable:', e);
    }
  };

  // Browser-native Notification API Permission state
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionStatus>(() => getSystemNotificationPermission());

  const [isPermissionBannerDismissed, setIsPermissionBannerDismissed] =
    useState<boolean>(() => {
      try {
        return sessionStorage.getItem('taskflow_banner_dismissed') === 'true';
      } catch {
        return false;
      }
    });

  const handleRequestNotificationPermission = async () => {
    const status = await requestSystemNotificationPermission();
    setNotificationPermission(status);
    if (status === 'granted') {
      playAlertSound();
      setToastMessage(
        'Notificações no sistema operacional ativadas com sucesso! Você receberá alertas mesmo fora da aba.'
      );
      sendSystemNotification({
        title: 'TaskFlow - Alertas do Sistema Ativados',
        body: 'Você agora receberá alertas nativos na área de trabalho quando o prazo de uma tarefa for alcançado.',
      });
    } else if (status === 'denied') {
      setToastMessage(
        'Notificações bloqueadas pelo navegador. Permita o envio nas permissões do site para receber alertas fora da aba.'
      );
    }
  };

  const handleDismissPermissionBanner = () => {
    setIsPermissionBannerDismissed(true);
    try {
      sessionStorage.setItem('taskflow_banner_dismissed', 'true');
    } catch {
      // Ignore
    }
  };

  const handleTestSystemNotification = async () => {
    let currentPermission = notificationPermission;
    if (currentPermission !== 'granted') {
      currentPermission = await requestSystemNotificationPermission();
      setNotificationPermission(currentPermission);
    }

    if (currentPermission === 'granted') {
      playAlertSound();
      const sent = sendSystemNotification({
        title: '⏰ TaskFlow - Teste de Alerta do Sistema',
        body: 'As notificações nativas na área de trabalho estão funcionando! Você receberá avisos como este mesmo minimizado.',
        onClick: () => {
          setToastMessage('Você clicou na notificação do sistema TaskFlow!');
        },
      });

      if (sent) {
        setToastMessage(
          'Alerta de teste enviado para o seu sistema operacional! Se estiver em outra aba ou minimizado, verifique o pop-up nativo.'
        );
      } else {
        setToastMessage('Falha ao disparar a notificação no navegador.');
      }
    } else {
      setToastMessage(
        'Permita as notificações no navegador para poder testar alertas na área de trabalho.'
      );
    }
  };

  // Toggle timer on a task (Runrun.it feature)
  const handleToggleTimer = (task: Task) => {
    const isCurrentlyRunning = activeTrackingTaskId === task.id;

    if (isCurrentlyRunning) {
      // Pause
      setActiveTrackingTaskId(null);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, isTracking: false } : t))
      );
    } else {
      // Play on this task, pause all others
      setActiveTrackingTaskId(task.id);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) {
            return {
              ...t,
              isTracking: true,
              trackingStartedAt: Date.now(),
              // If task was in 'todo', move it automatically to 'in_progress' like Runrun.it!
              columnId: t.columnId === 'todo' ? 'in_progress' : t.columnId,
            };
          }
          return { ...t, isTracking: false };
        })
      );
    }
  };

  // Move task between columns (Kanban drag-and-drop or dropdown)
  const handleMoveTask = (taskId: string, targetColumnId: ColumnId) => {
    let updatedTaskObj: Task | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          // If moved to 'done', pause timer
          const shouldPause = targetColumnId === 'done' && t.isTracking;
          if (shouldPause && activeTrackingTaskId === taskId) {
            setActiveTrackingTaskId(null);
          }
          const updated: Task = {
            ...t,
            columnId: targetColumnId,
            isTracking: shouldPause ? false : t.isTracking,
            updatedAt: new Date().toISOString(),
          };
          updatedTaskObj = updated;
          return updated;
        }
        return t;
      })
    );
    if (updatedTaskObj) {
      saveTaskToCloud(updatedTaskObj);
    }
  };

  // Update task details
  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    if (selectedTaskForDetail?.id === updatedTask.id) {
      setSelectedTaskForDetail(updatedTask);
    }
    saveTaskToCloud(updatedTask);
  };

  // Delete task with Undo option
  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    if (!taskToDelete) return;

    if (activeTrackingTaskId === taskId) {
      setActiveTrackingTaskId(null);
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail(null);
    }

    deleteTaskFromCloud(taskId);

    // Set undo timer for 6 seconds
    if (deletedTaskUndo) clearTimeout(deletedTaskUndo.timerId);
    const timer = setTimeout(() => {
      setDeletedTaskUndo(null);
    }, 6000);

    setDeletedTaskUndo({
      task: taskToDelete,
      timerId: timer,
    });
  };

  const handleUndoDelete = () => {
    if (!deletedTaskUndo) return;
    clearTimeout(deletedTaskUndo.timerId);
    setTasks((prev) => [deletedTaskUndo.task, ...prev]);
    saveTaskToCloud(deletedTaskUndo.task);
    setDeletedTaskUndo(null);
  };

  // Remove user / team member
  const handleRemoveUser = (userId: string) => {
    const userToRemove = users.find((u) => u.id === userId);
    if (!userToRemove) return;

    // 1. Remove from users list
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteUserFromCloud(userId);

    // 2. Unassign tasks assigned to this user
    setTasks((prev) =>
      prev.map((t) => {
        if (t.assigneeId === userId) {
          const updated = { ...t, assigneeId: undefined };
          saveTaskToCloud(updated);
          return updated;
        }
        return t;
      })
    );

    // 3. Fallback currentUser if deleted
    if (currentUser?.id === userId) {
      const remaining = users.filter((u) => u.id !== userId);
      setCurrentUser(remaining.length > 0 ? remaining[0] : null);
    }

    // 4. Clear filter if filtered by this user
    if (selectedUserId === userId) {
      setSelectedUserId(null);
    }

    setToastMessage(`Membro "${userToRemove.name}" foi removido da equipe.`);
    playAlertSound();
  };

  // Update column title
  const handleUpdateColumnTitle = (columnId: ColumnId, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    let updatedColObj: Column | null = null;
    setColumns((prev) =>
      prev.map((c) => {
        if (c.id === columnId) {
          const updated = { ...c, title: trimmed };
          updatedColObj = updated;
          return updated;
        }
        return c;
      })
    );
    if (updatedColObj) {
      saveColumnToCloud(updatedColObj);
    }
    setToastMessage(`Coluna renomeada para "${trimmed}".`);
  };

  // Clear all tasks from a column
  const handleClearColumnTasks = (columnId: ColumnId) => {
    const tasksToDelete = tasks.filter(
      (t) => t.projectId === currentProjectId && t.columnId === columnId
    );
    if (tasksToDelete.length === 0) return;

    setTasks((prev) =>
      prev.filter(
        (t) => !(t.projectId === currentProjectId && t.columnId === columnId)
      )
    );
    tasksToDelete.forEach((t) => deleteTaskFromCloud(t.id));
    setToastMessage(`${tasksToDelete.length} ${tasksToDelete.length === 1 ? 'tarefa apagada' : 'tarefas apagadas'} da coluna.`);
    playAlertSound();
  };

  // Quick add task
  const handleQuickAddTask = (columnId: ColumnId) => {
    setNewTaskInitialColumn(columnId);
    setIsNewTaskOpen(true);
  };

  // Add new task
  const handleAddTask = (newTaskData: Partial<Task>) => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId: currentProjectId,
      title: newTaskData.title || 'Nova Tarefa',
      description: newTaskData.description || '',
      columnId: newTaskData.columnId || 'todo',
      priority: newTaskData.priority || 'media',
      assigneeId: newTaskData.assigneeId,
      dueDate:
        newTaskData.dueDate ||
        new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      estimatedHours: newTaskData.estimatedHours || 4,
      trackedSeconds: 0,
      isTracking: false,
      tags: newTaskData.tags || ['Demanda'],
      subtasks: newTaskData.subtasks || [],
      attachments: newTaskData.attachments || [],
      comments: newTaskData.comments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    saveTaskToCloud(newTask);
  };

  // Import tasks from PDF
  const handleImportPdfTasks = (importedTasks: Partial<Task>[]) => {
    const created: Task[] = importedTasks.map((it, idx) => ({
      id: `task-pdf-${Date.now()}-${idx}`,
      projectId: currentProjectId,
      title: it.title || 'Tarefa Importada',
      description: it.description || '',
      columnId: it.columnId || 'todo',
      priority: it.priority || 'media',
      assigneeId: it.assigneeId,
      dueDate:
        it.dueDate ||
        new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      estimatedHours: it.estimatedHours || 4,
      trackedSeconds: 0,
      isTracking: false,
      tags: it.tags || ['PDF Importado'],
      subtasks: it.subtasks || [],
      attachments: it.attachments || [],
      comments: it.comments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setTasks((prev) => [...created, ...prev]);
    created.forEach((t) => saveTaskToCloud(t));
    playAlertSound();
  };

  // Current project
  const currentProject =
    projects.find((p) => p.id === currentProjectId) ||
    projects[0] || {
      id: 'proj-1',
      name: 'Gestão de Demandas',
      description: '',
      category: 'Geral',
    };

  const handleCreateProject = (name: string) => {
    if (!name.trim()) return;
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      description: '',
      category: 'Geral',
    };
    setProjects((prev) => [...prev, newProj]);
    setCurrentProjectId(newProj.id);
    setToastMessage(`Projeto criado: "${newProj.name}"`);
    playAlertSound();
  };

  // Unique tags across all tasks of current project
  const allProjectTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => {
      if (t.projectId === currentProjectId && Array.isArray(t.tags)) {
        t.tags.forEach((tag) => {
          const trimmed = tag.trim();
          if (trimmed) tagSet.add(trimmed);
        });
      }
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [tasks, currentProjectId]);

  // Counts of tasks per tag in current project
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.projectId === currentProjectId && Array.isArray(t.tags)) {
        t.tags.forEach((tag) => {
          const trimmed = tag.trim();
          if (trimmed) {
            counts[trimmed] = (counts[trimmed] || 0) + 1;
          }
        });
      }
    });
    return counts;
  }, [tasks, currentProjectId]);

  const currentProjectTasksCount = useMemo(() => {
    return tasks.filter((t) => t.projectId === currentProjectId).length;
  }, [tasks, currentProjectId]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSelectAllTags = () => {
    setSelectedTags(allProjectTags);
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  // Reset selected tags when changing projects
  useEffect(() => {
    setSelectedTags([]);
  }, [currentProjectId]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.projectId !== currentProjectId) return false;
      if (selectedUserId && task.assigneeId !== selectedUserId) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter)
        return false;
      
      // Multiple Tags Filter
      if (selectedTags.length > 0) {
        if (!task.tags || task.tags.length === 0) return false;
        if (tagFilterMode === 'all') {
          const hasAll = selectedTags.every((st) => task.tags.includes(st));
          if (!hasAll) return false;
        } else {
          const hasAny = selectedTags.some((st) => task.tags.includes(st));
          if (!hasAny) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description.toLowerCase().includes(q);
        const matchTag = task.tags.some((tag) => tag.toLowerCase().includes(q));
        const matchSub = task.subtasks.some((st) =>
          st.title.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchDesc && !matchTag && !matchSub) return false;
      }
      return true;
    });
  }, [tasks, currentProjectId, selectedUserId, priorityFilter, selectedTags, tagFilterMode, searchQuery]);

  // User Auth & Team Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setToastMessage(`Login realizado com sucesso! Conectado como ${user.name} (${user.email})`);
    playAlertSound();
  };

  const handleRegisterAndLogin = (userData: Omit<User, 'id'> | User): User => {
    const newUser: User = {
      ...userData,
      id: ('id' in userData && userData.id)
        ? userData.id
        : `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setUsers((prev) => {
      const exists = prev.some((u) => u.email.toLowerCase() === newUser.email.toLowerCase());
      if (exists) return prev;
      return [...prev, newUser];
    });
    saveUserToCloud(newUser);
    setCurrentUser(newUser);
    setToastMessage(`Nova conta criada e conectada: ${newUser.name} (@${newUser.username})`);
    playAlertSound();
    return newUser;
  };

  const handleAddUser = (userData: Omit<User, 'id'> | User): User => {
    const newUser: User = {
      ...userData,
      id: ('id' in userData && userData.id)
        ? userData.id
        : `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setUsers((prev) => [...prev, newUser]);
    saveUserToCloud(newUser);
    setToastMessage(`Membro adicionado com sucesso: ${newUser.name} (@${newUser.username})`);
    playAlertSound();
    return newUser;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToastMessage('Você se desconectou. Você pode entrar novamente com seu e-mail a qualquer momento.');
  };

  const handleMentionUser = (mentionedUser: User, taskTitle: string, commentText: string) => {
    playAlertSound();
    setToastMessage(`Notificação de menção enviada para ${mentionedUser.name} (${mentionedUser.email})`);
  };

  const handleExportCsv = () => {
    if (filteredTasks.length === 0) {
      setToastMessage('Nenhuma tarefa encontrada com os filtros atuais para exportar.');
      return;
    }

    const result = exportTasksToCsv(filteredTasks, users, currentProject.name);
    if (result.success) {
      setToastMessage(
        `Relatório CSV exportado com sucesso (${result.count} ${
          result.count === 1 ? 'tarefa' : 'tarefas'
        })!`
      );
      playAlertSound();
    }
  };

  // Notifications calculation (Deadlines + Mentions & Assignments for Current User)
  const notifications = useMemo(() => {
    const projectTasks = tasks.filter((t) => t.projectId === currentProjectId);
    const deadlineNotifs = generateDeadlineNotifications(projectTasks);
    const mentionNotifs = generateMentionNotifications(
      projectTasks,
      currentUser?.id,
      users
    );
    return [...deadlineNotifs, ...mentionNotifs];
  }, [tasks, currentProjectId, currentUser, users]);

  const overdueCount = useMemo(() => {
    return tasks.filter((t) => {
      if (t.projectId !== currentProjectId || t.columnId === 'done') return false;
      return getDeadlineStatus(t.dueDate, t.columnId).status === 'overdue';
    }).length;
  }, [tasks, currentProjectId]);

  const dueSoonCount = useMemo(() => {
    return tasks.filter((t) => {
      if (t.projectId !== currentProjectId || t.columnId === 'done') return false;
      const st = getDeadlineStatus(t.dueDate, t.columnId).status;
      return st === 'due_today' || st === 'due_tomorrow';
    }).length;
  }, [tasks, currentProjectId]);

  const activeTrackingTask = useMemo(() => {
    return tasks.find((t) => t.id === activeTrackingTaskId) || null;
  }, [tasks, activeTrackingTaskId]);

  // Background deadline checker: sends system-level alerts even if tab is in the background
  useEffect(() => {
    const checkDeadlinesAndSendAlerts = () => {
      if (notificationPermission !== 'granted') return;

      for (const task of tasks) {
        if (task.columnId === 'done' || !task.dueDate) continue;

        const deadlineInfo = getDeadlineStatus(task.dueDate, task.columnId);
        if (
          deadlineInfo.status === 'overdue' ||
          deadlineInfo.status === 'due_today'
        ) {
          const dedupeKey = `system-notif-${task.id}-${task.dueDate}-${deadlineInfo.status}`;
          if (!hasBeenNotified(dedupeKey)) {
            markAsNotified(dedupeKey);
            playAlertSound();

            const isOverdue = deadlineInfo.status === 'overdue';
            sendSystemNotification({
              title: isOverdue
                ? `⚠️ Tarefa Atrasada: ${task.title}`
                : `⏰ Prazo Vencendo Hoje: ${task.title}`,
              body: isOverdue
                ? `A tarefa "${task.title}" está atrasada (${Math.abs(
                    deadlineInfo.daysDiff
                  )} dia(s)). Clique para resolver.`
                : `A tarefa "${task.title}" precisa ser entregue hoje. Clique para abrir os detalhes.`,
              taskId: task.id,
              onClick: () => {
                setSelectedTaskForDetail(task);
              },
            });
          }
        }
      }
    };

    // Run check immediately
    checkDeadlinesAndSendAlerts();

    // Check periodically every 30 seconds for deadlines reached while tab is backgrounded
    const interval = setInterval(checkDeadlinesAndSendAlerts, 30000);
    return () => clearInterval(interval);
  }, [tasks, notificationPermission]);

  // Tab visibility: update browser document title dynamically when tab is inactive
  useEffect(() => {
    const updateTitleOnVisibilityChange = () => {
      const urgentCount = overdueCount + dueSoonCount;
      if (document.hidden && urgentCount > 0) {
        document.title = `(${urgentCount} Prazo${
          urgentCount > 1 ? 's' : ''
        } Crítico) TaskFlow`;
      } else {
        document.title = 'TaskFlow - Gestão Ágil Trello & Runrun.it';
      }
    };

    document.addEventListener('visibilitychange', updateTitleOnVisibilityChange);
    updateTitleOnVisibilityChange();

    return () => {
      document.removeEventListener(
        'visibilitychange',
        updateTitleOnVisibilityChange
      );
    };
  }, [overdueCount, dueSoonCount]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-black flex flex-col font-sans antialiased text-slate-900 dark:text-neutral-100 transition-colors duration-200">
      {/* Top Header */}
      <Header
        currentProject={currentProject}
        projects={projects}
        onSelectProject={(proj) => setCurrentProjectId(proj.id)}
        onCreateProject={handleCreateProject}
        activeView={activeView}
        setActiveView={setActiveView}
        users={users}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenAddUserModal={() => setIsAddUserModalOpen(true)}
        onOpenTeamModal={() => setIsTeamManagementOpen(true)}
        onLogout={handleLogout}
        onExportCsv={handleExportCsv}
        selectedUserId={selectedUserId}
        onSelectUserId={setSelectedUserId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        activeTrackingTask={activeTrackingTask}
        onToggleTimer={handleToggleTimer}
        unreadNotificationsCount={notifications.length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenPdfImport={() => setIsPdfImportOpen(true)}
        onOpenNewTask={() => {
          setNewTaskInitialColumn('todo');
          setIsNewTaskOpen(true);
        }}
        overdueCount={overdueCount}
        dueSoonCount={dueSoonCount}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenTeamChat={() => setIsTeamChatOpen(true)}
        teamChatMessagesCount={projectTeamMessages.length}
        isCloudConnected={isCloudConnected}
      />

      {/* Browser Notification Permission Prompt Banner */}
      <NotificationPermissionBanner
        permission={notificationPermission}
        onRequestPermission={handleRequestNotificationPermission}
        onDismiss={handleDismissPermissionBanner}
        isDismissed={isPermissionBannerDismissed}
      />

      {/* Main Board / Table / Dashboard View */}
      <main className="flex-1 pb-12">
        {activeView === 'dashboard' ? (
          <DashboardView
            tasks={tasks.filter((t) => t.projectId === currentProjectId)}
            users={users}
            projectName={currentProject.name}
            activeTrackingTaskId={activeTrackingTaskId}
            onToggleTimer={handleToggleTimer}
            onOpenDetails={(task) => setSelectedTaskForDetail(task)}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleMoveTask}
            onOpenNewTask={() => {
              setNewTaskInitialColumn('todo');
              setIsNewTaskOpen(true);
            }}
            onExportCsv={handleExportCsv}
          />
        ) : (
          <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
            {/* View Subheader with Tag Filter Toggle & Quick Badges */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Toggle Filter Sidebar Button */}
                <button
                  id="toggle-tag-filter-sidebar-btn"
                  type="button"
                  onClick={() => setIsFilterSidebarOpen((prev) => !prev)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer shadow-2xs ${
                    isFilterSidebarOpen || selectedTags.length > 0
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title={isFilterSidebarOpen ? 'Ocultar barra de filtros' : 'Abrir barra lateral de filtros por etiquetas'}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filtro por Etiquetas</span>
                  {selectedTags.length > 0 ? (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {selectedTags.length}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({allProjectTags.length})
                    </span>
                  )}
                </button>

                {/* Active Tag Chips */}
                {selectedTags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedTags.map((tag) => {
                      const palette = getTagPalette(tag);
                      return (
                        <span
                          key={tag}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${palette.activeBg} ${palette.border} ${palette.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${palette.dot}`} />
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className="hover:opacity-75 p-0.5 cursor-pointer"
                            title={`Remover filtro de ${tag}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      );
                    })}

                    <button
                      id="clear-all-tags-chips-btn"
                      type="button"
                      onClick={handleClearTags}
                      className="text-[11px] font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 underline cursor-pointer ml-1"
                    >
                      Limpar filtros ({selectedTags.length})
                    </button>
                  </div>
                )}
              </div>

              {/* View Right Info: Task count & Mode badge */}
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                {selectedTags.length > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                    Modo: {tagFilterMode === 'all' ? 'Todas (E)' : 'Qualquer (OU)'}
                  </span>
                )}
                <span>
                  Exibindo <strong className="text-slate-900 dark:text-white font-bold">{filteredTasks.length}</strong> de <strong className="text-slate-900 dark:text-white font-bold">{currentProjectTasksCount}</strong> tarefas
                </span>
              </div>
            </div>

            {/* Layout: Sidebar + Kanban/Table */}
            <div className="flex items-start gap-5 relative">
              {/* Filter Sidebar */}
              <TagFilterSidebar
                allTags={allProjectTags}
                selectedTags={selectedTags}
                onToggleTag={handleToggleTag}
                onSelectAllTags={handleSelectAllTags}
                onClearTags={handleClearTags}
                tagFilterMode={tagFilterMode}
                onChangeTagFilterMode={setTagFilterMode}
                tagCounts={tagCounts}
                totalProjectTasks={currentProjectTasksCount}
                filteredTasksCount={filteredTasks.length}
                isOpen={isFilterSidebarOpen}
                onClose={() => setIsFilterSidebarOpen(false)}
                onToggleOpen={() => setIsFilterSidebarOpen((prev) => !prev)}
              />

              {/* Collapsed Sidebar Quick Tab (Desktop) */}
              {!isFilterSidebarOpen && (
                <button
                  id="open-tag-sidebar-dock-btn"
                  type="button"
                  onClick={() => setIsFilterSidebarOpen(true)}
                  className="hidden lg:flex flex-col items-center gap-2 py-4 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 group shrink-0"
                  title="Expandir barra lateral de filtros por etiquetas"
                >
                  <Filter className="w-4 h-4 group-hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider [writing-mode:vertical-lr] rotate-180">
                    Etiquetas {selectedTags.length > 0 ? `(${selectedTags.length})` : ''}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}

              {/* View Content */}
              <div className="flex-1 min-w-0">
                {activeView === 'kanban' ? (
                  <KanbanBoard
                    columns={columns}
                    tasks={filteredTasks}
                    users={users}
                    activeTrackingTaskId={activeTrackingTaskId}
                    onToggleTimer={handleToggleTimer}
                    onOpenDetails={(task) => setSelectedTaskForDetail(task)}
                    onDeleteTask={handleDeleteTask}
                    onUpdateTask={handleUpdateTask}
                    onMoveTask={handleMoveTask}
                    onQuickAddTask={handleQuickAddTask}
                    onUpdateColumnTitle={handleUpdateColumnTitle}
                    onClearColumnTasks={handleClearColumnTasks}
                  />
                ) : (
                  <RunrunTableView
                    tasks={filteredTasks}
                    users={users}
                    activeTrackingTaskId={activeTrackingTaskId}
                    onToggleTimer={handleToggleTimer}
                    onOpenDetails={(task) => setSelectedTaskForDetail(task)}
                    onDeleteTask={handleDeleteTask}
                    onUpdateTask={handleUpdateTask}
                    onStatusChange={handleMoveTask}
                    onExportCsv={handleExportCsv}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Undo Delete Banner */}
      {deletedTaskUndo && (
        <div className="fixed bottom-5 right-5 z-40 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 dark:border-slate-700 flex items-center gap-3 animate-fade-in text-xs">
          <span>Tarefa "{deletedTaskUndo.task.title}" apagada.</span>
          <button
            id="undo-delete-btn"
            type="button"
            onClick={handleUndoDelete}
            className="flex items-center gap-1 font-bold text-indigo-400 dark:text-indigo-300 hover:text-indigo-300 dark:hover:text-indigo-200 transition cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Desfazer</span>
          </button>
        </div>
      )}

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div
          id="app-toast-feedback"
          className="fixed bottom-5 left-5 z-50 bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/50 dark:border-slate-200/50 flex items-center gap-3 animate-fade-in text-xs max-w-md backdrop-blur-md"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 dark:text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="flex-1 font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white dark:hover:text-slate-900 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          users={users}
          currentUser={currentUser}
          isTracking={activeTrackingTaskId === selectedTaskForDetail.id}
          onToggleTimer={handleToggleTimer}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onClose={() => setSelectedTaskForDetail(null)}
          onOpenAddUser={() => setIsAddUserModalOpen(true)}
          onMentionUser={handleMentionUser}
        />
      )}

      {/* PDF Import Modal */}
      {isPdfImportOpen && (
        <PdfImportModal
          currentProjectId={currentProjectId}
          users={users}
          onImportTasks={handleImportPdfTasks}
          onClose={() => setIsPdfImportOpen(false)}
        />
      )}

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <NewTaskModal
          initialColumnId={newTaskInitialColumn}
          projectId={currentProjectId}
          users={users}
          onAddTask={handleAddTask}
          onClose={() => setIsNewTaskOpen(false)}
          onOpenAddUser={() => setIsAddUserModalOpen(true)}
        />
      )}

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onSelectTask={(taskId) => {
          const found = tasks.find((t) => t.id === taskId);
          if (found) setSelectedTaskForDetail(found);
        }}
        onClearNotifications={() => {
          // Cleared notification view
          setIsNotificationsOpen(false);
        }}
        onTestSoundAlert={playAlertSound}
        notificationPermission={notificationPermission}
        onRequestNotificationPermission={handleRequestNotificationPermission}
        onTestSystemNotification={handleTestSystemNotification}
      />

      {/* Team Chat Sidebar */}
      <TeamChatSidebar
        isOpen={isTeamChatOpen}
        onClose={() => setIsTeamChatOpen(false)}
        projectId={currentProjectId}
        projectName={currentProject.name}
        messages={projectTeamMessages}
        onSendMessage={handleSendMessage}
        onDeleteMessage={handleDeleteMessage}
        currentUser={currentUser}
        users={users}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Email Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          currentUser={currentUser}
          users={users}
          existingUsers={users}
          onClose={() => setIsAuthModalOpen(false)}
          onLogin={handleLogin}
          onRegisterAndLogin={handleRegisterAndLogin}
        />
      )}

      {/* Add / Invite Real Person to Team Modal */}
      {isAddUserModalOpen && (
        <AddUserModal
          isOpen={isAddUserModalOpen}
          existingUsers={users}
          currentProject={currentProject}
          currentUser={currentUser}
          projectTasks={tasks.filter((t) => t.projectId === currentProjectId)}
          onClose={() => setIsAddUserModalOpen(false)}
          onAddUser={handleAddUser}
          onLoginAsNewUser={handleLogin}
          onRemoveUser={handleRemoveUser}
        />
      )}

      {/* Team Management Modal */}
      {isTeamManagementOpen && (
        <TeamManagementModal
          isOpen={isTeamManagementOpen}
          onClose={() => setIsTeamManagementOpen(false)}
          users={users}
          currentUser={currentUser}
          tasks={tasks.filter((t) => t.projectId === currentProjectId)}
          onRemoveUser={handleRemoveUser}
          onSwitchUser={(user) => {
            setCurrentUser(user);
            setToastMessage(`Conectado como ${user.name}`);
          }}
          onOpenAddUser={() => {
            setIsTeamManagementOpen(false);
            setIsAddUserModalOpen(true);
          }}
        />
      )}

      {/* Collaborator Invite Acceptance Modal */}
      {pendingInvite && (
        <InviteAcceptModal
          invite={pendingInvite}
          isOpen={!!pendingInvite}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
        />
      )}
    </div>
  );
}
