import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Play,
  Pause,
  Users,
  Calendar,
  Filter,
  Search,
  ExternalLink,
  Trash2,
  Plus,
  Download,
  CheckSquare,
  AlertCircle,
  Sparkles,
  Flame,
  ArrowUpRight,
  ListTodo,
  Hourglass,
  Percent,
} from 'lucide-react';
import { Task, User, ColumnId, TaskPriority } from '../types';
import { getDeadlineStatus, formatSecondsToRunrun } from '../utils/helpers';

interface DashboardViewProps {
  tasks: Task[];
  users: User[];
  projectName: string;
  activeTrackingTaskId: string | null;
  onToggleTimer: (task: Task) => void;
  onOpenDetails: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: ColumnId) => void;
  onOpenNewTask: () => void;
  onExportCsv?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  users,
  projectName,
  activeTrackingTaskId,
  onToggleTimer,
  onOpenDetails,
  onDeleteTask,
  onStatusChange,
  onOpenNewTask,
  onExportCsv,
}) => {
  // Local filters inside dashboard
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
  const [timePeriod, setTimePeriod] = useState<'all' | 'week' | 'month'>('all');

  // Overall Statistics Calculations
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const todoTasks = tasks.filter((t) => t.columnId === 'todo');
    const inProgressTasks = tasks.filter((t) => t.columnId === 'in_progress');
    const reviewTasks = tasks.filter((t) => t.columnId === 'review');
    const doneTasks = tasks.filter((t) => t.columnId === 'done');

    const completionRate =
      totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

    // Subtasks calculations
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    tasks.forEach((t) => {
      totalSubtasks += t.subtasks?.length || 0;
      completedSubtasks += t.subtasks?.filter((s) => s.completed).length || 0;
    });
    const subtaskRate =
      totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    // Time tracking calculations
    const totalTrackedSeconds = tasks.reduce(
      (acc, t) => acc + (t.trackedSeconds || 0),
      0
    );
    const totalEstimatedHours = tasks.reduce(
      (acc, t) => acc + (t.estimatedHours || 0),
      0
    );
    const trackedHoursDecimal = totalTrackedSeconds / 3600;

    // Deadlines calculations
    let overdueCount = 0;
    let dueTodayCount = 0;
    let dueTomorrowCount = 0;
    let onTrackCount = 0;

    tasks.forEach((t) => {
      if (t.columnId !== 'done') {
        const d = getDeadlineStatus(t.dueDate, t.columnId);
        if (d.status === 'overdue') overdueCount++;
        else if (d.status === 'due_today') dueTodayCount++;
        else if (d.status === 'due_tomorrow') dueTomorrowCount++;
        else if (d.status === 'on_track') onTrackCount++;
      }
    });

    // Priority counts
    const priorityCounts: Record<TaskPriority, number> = {
      urgente: 0,
      alta: 0,
      media: 0,
      baixa: 0,
    };
    tasks.forEach((t) => {
      if (priorityCounts[t.priority] !== undefined) {
        priorityCounts[t.priority]++;
      }
    });

    // Team workload
    const memberStats = users.map((u) => {
      const userTasks = tasks.filter((t) => t.assigneeId === u.id);
      const userDone = userTasks.filter((t) => t.columnId === 'done');
      const userInProgress = userTasks.filter((t) => t.columnId === 'in_progress');
      const userSeconds = userTasks.reduce(
        (acc, t) => acc + (t.trackedSeconds || 0),
        0
      );
      const userEstHours = userTasks.reduce(
        (acc, t) => acc + (t.estimatedHours || 0),
        0
      );

      return {
        user: u,
        totalTasks: userTasks.length,
        doneTasks: userDone.length,
        inProgressTasks: userInProgress.length,
        completionRate:
          userTasks.length > 0
            ? Math.round((userDone.length / userTasks.length) * 100)
            : 0,
        trackedSeconds: userSeconds,
        estimatedHours: userEstHours,
      };
    });

    // Top tasks by tracked time
    const topTrackedTasks = [...tasks]
      .sort((a, b) => (b.trackedSeconds || 0) - (a.trackedSeconds || 0))
      .slice(0, 5);

    // Active currently tracking task
    const activeTask = tasks.find((t) => t.id === activeTrackingTaskId) || null;

    return {
      totalTasks,
      todoTasks: todoTasks.length,
      inProgressTasks: inProgressTasks.length,
      reviewTasks: reviewTasks.length,
      doneTasks: doneTasks.length,
      completionRate,
      totalSubtasks,
      completedSubtasks,
      subtaskRate,
      totalTrackedSeconds,
      totalEstimatedHours,
      trackedHoursDecimal,
      overdueCount,
      dueTodayCount,
      dueTomorrowCount,
      onTrackCount,
      priorityCounts,
      memberStats,
      topTrackedTasks,
      activeTask,
    };
  }, [tasks, users, activeTrackingTaskId]);

  // Filtered tasks for the tracking table
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        const matchesTags = (task.tags || []).some((tag) =>
          tag.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && task.columnId !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // Member filter
      if (memberFilter !== 'all') {
        if (memberFilter === 'unassigned') {
          if (task.assigneeId) return false;
        } else if (task.assigneeId !== memberFilter) {
          return false;
        }
      }

      // Deadline filter
      if (deadlineFilter !== 'all') {
        const d = getDeadlineStatus(task.dueDate, task.columnId);
        if (deadlineFilter === 'overdue' && d.status !== 'overdue') return false;
        if (deadlineFilter === 'due_today' && d.status !== 'due_today') return false;
        if (deadlineFilter === 'on_track' && d.status !== 'on_track') return false;
        if (deadlineFilter === 'done' && task.columnId !== 'done') return false;
      }

      return true;
    });
  }, [tasks, searchFilter, statusFilter, priorityFilter, memberFilter, deadlineFilter]);

  const columnNames: Record<ColumnId, string> = {
    todo: 'A Fazer',
    in_progress: 'Em Andamento',
    review: 'Em Revisão',
    done: 'Concluído',
  };

  const priorityMeta: Record<
    TaskPriority,
    { label: string; badge: string; dot: string; bar: string }
  > = {
    urgente: {
      label: 'Urgente',
      badge:
        'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
      bar: 'bg-rose-500',
    },
    alta: {
      label: 'Alta',
      badge:
        'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
      bar: 'bg-amber-500',
    },
    media: {
      label: 'Média',
      badge:
        'bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      dot: 'bg-sky-500',
      bar: 'bg-sky-500',
    },
    baixa: {
      label: 'Baixa',
      badge:
        'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-400',
      bar: 'bg-slate-400',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Context Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Dashboard de Rastreamento
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Acompanhamento visual de progresso, prioridades, status e entregas do projeto{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {projectName}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onExportCsv && (
            <button
              id="dashboard-export-csv-btn"
              type="button"
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Exportar Relatório</span>
            </button>
          )}

          <button
            id="dashboard-create-task-btn"
            type="button"
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Active Focus Highlight Banner */}
      {stats.activeTask && (
        <div
          id="dashboard-active-tracker-banner"
          className="bg-indigo-600/10 dark:bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Em Execução Agora
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-600 text-white">
                  Foco Atual
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {stats.activeTask.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenDetails(stats.activeTask!)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer flex items-center gap-1"
            >
              <span>Ver Detalhes</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="dashboard-stop-active-timer-btn"
              type="button"
              onClick={() => onToggleTimer(stats.activeTask!)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <Pause className="w-3.5 h-3.5 text-slate-500" />
              <span>Concluir Foco</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Progresso & Conclusão */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Taxa de Conclusão</span>
            <span className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.completionRate}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({stats.doneTasks}/{stats.totalTasks} tarefas)
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3" />
              Subtarefas: {stats.completedSubtasks}/{stats.totalSubtasks}
            </span>
            <span className="font-mono font-medium">{stats.subtaskRate}%</span>
          </div>
        </div>

        {/* Card 2: Tarefas em Execução */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Tarefas em Execução</span>
            <span className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.inProgressTasks + stats.reviewTasks}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ativas ({stats.inProgressTasks} andamento, {stats.reviewTasks} revisão)
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  stats.totalTasks > 0
                    ? Math.round(((stats.inProgressTasks + stats.reviewTasks) / stats.totalTasks) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>
              {stats.totalTasks > 0
                ? `${Math.round(((stats.inProgressTasks + stats.reviewTasks) / stats.totalTasks) * 100)}% do projeto em ação`
                : 'Sem tarefas'}
            </span>
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {stats.todoTasks} na fila (A Fazer)
            </span>
          </div>
        </div>

        {/* Card 3: Saúde dos Prazos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Saúde dos Prazos</span>
            <span
              className={`p-1 rounded-md ${
                stats.overdueCount > 0
                  ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {stats.overdueCount > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold font-mono ${
                stats.overdueCount > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {stats.overdueCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {stats.overdueCount === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] pt-1">
            <button
              type="button"
              onClick={() => setDeadlineFilter(deadlineFilter === 'overdue' ? 'all' : 'overdue')}
              className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                deadlineFilter === 'overdue'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
              }`}
            >
              {stats.overdueCount} atrasada{stats.overdueCount !== 1 ? 's' : ''}
            </button>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {stats.dueTodayCount} vencem hoje
            </span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-400 dark:text-slate-500">
            {stats.onTrackCount} tarefas dentro do prazo
          </div>
        </div>

        {/* Card 4: Carga e Execução Ativa */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Em Andamento / Revisão</span>
            <span className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
              <Hourglass className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.inProgressTasks + stats.reviewTasks}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ativas ({stats.inProgressTasks} exec / {stats.reviewTasks} rev)
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>{users.length} membros alocados no projeto</span>
          </div>
          <div className="mt-2.5 text-[11px] text-slate-400 dark:text-slate-500">
            {stats.todoTasks} tarefas aguardando no backlog
          </div>
        </div>
      </div>

      {/* Visual Analytics & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Funil de Status & Prioridades (2 spans on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Pipeline Multi-segment visual */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Funil de Rastreamento por Status</span>
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Clique para filtrar
              </span>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex shadow-2xs">
              {stats.totalTasks > 0 ? (
                <>
                  <div
                    title={`A Fazer: ${stats.todoTasks}`}
                    style={{ width: `${(stats.todoTasks / stats.totalTasks) * 100}%` }}
                    className="bg-slate-400 dark:bg-slate-600 transition-all duration-300"
                  />
                  <div
                    title={`Em Andamento: ${stats.inProgressTasks}`}
                    style={{ width: `${(stats.inProgressTasks / stats.totalTasks) * 100}%` }}
                    className="bg-blue-500 transition-all duration-300"
                  />
                  <div
                    title={`Em Revisão: ${stats.reviewTasks}`}
                    style={{ width: `${(stats.reviewTasks / stats.totalTasks) * 100}%` }}
                    className="bg-amber-500 transition-all duration-300"
                  />
                  <div
                    title={`Concluído: ${stats.doneTasks}`}
                    style={{ width: `${(stats.doneTasks / stats.totalTasks) * 100}%` }}
                    className="bg-emerald-500 transition-all duration-300"
                  />
                </>
              ) : (
                <div className="w-full bg-slate-200 dark:bg-slate-800" />
              )}
            </div>

            {/* Interactive Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'todo' ? 'all' : 'todo')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  statusFilter === 'todo'
                    ? 'border-slate-500 bg-slate-50 dark:bg-slate-800/80 ring-2 ring-slate-400/40'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                  <span>A Fazer</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {stats.todoTasks}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {stats.totalTasks > 0
                      ? Math.round((stats.todoTasks / stats.totalTasks) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')
                }
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  statusFilter === 'in_progress'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/40'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900/60 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Em Andamento</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {stats.inProgressTasks}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {stats.totalTasks > 0
                      ? Math.round((stats.inProgressTasks / stats.totalTasks) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'review' ? 'all' : 'review')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  statusFilter === 'review'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-500/40'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-900/60 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Em Revisão</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {stats.reviewTasks}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {stats.totalTasks > 0
                      ? Math.round((stats.reviewTasks / stats.totalTasks) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'done' ? 'all' : 'done')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  statusFilter === 'done'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/40'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-900/60 bg-slate-50/50 dark:bg-slate-950/40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Concluído</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {stats.doneTasks}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {stats.totalTasks > 0
                      ? Math.round((stats.doneTasks / stats.totalTasks) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Top Tasks by Priority & Status */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Tarefas Prioritárias & Ações Imediatas</span>
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Em foco no projeto
              </span>
            </div>

            <div className="space-y-3">
              {stats.topTrackedTasks.map((task) => {
                const assignee = users.find((u) => u.id === task.assigneeId);
                const deadlineInfo = getDeadlineStatus(task.dueDate, task.columnId);
                const completedSubs = task.subtasks.filter((s) => s.completed).length;
                const totalSubs = task.subtasks.length;

                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer"
                    onClick={() => onOpenDetails(task)}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {task.title}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold shrink-0 ${
                            priorityMeta[task.priority]?.badge
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {deadlineInfo.label && (
                          <span
                            className={`text-[11px] font-medium flex items-center gap-1 ${
                              deadlineInfo.status === 'overdue' && task.columnId !== 'done'
                                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>{deadlineInfo.label}</span>
                          </span>
                        )}

                        {assignee && (
                          <span
                            title={assignee.name}
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs ${assignee.avatarBg}`}
                          >
                            {assignee.name.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subtasks or tag info */}
                    {totalSubs > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                            style={{ width: `${Math.round((completedSubs / totalSubs) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {completedSubs}/{totalSubs} subtarefas
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Matriz de Prioridade & Workload da Equipe */}
        <div className="space-y-6">
          {/* Priority Distribution Matrix */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Distribuição por Prioridade</span>
            </h3>

            <div className="space-y-3">
              {(['urgente', 'alta', 'media', 'baixa'] as TaskPriority[]).map((pri) => {
                const count = stats.priorityCounts[pri] || 0;
                const pct =
                  stats.totalTasks > 0 ? Math.round((count / stats.totalTasks) * 100) : 0;
                const meta = priorityMeta[pri];
                const isSelected = priorityFilter === pri;

                return (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => setPriorityFilter(isSelected ? 'all' : pri)}
                    className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                        : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={`h-full rounded-full ${meta.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white min-w-[20px] text-right">
                        {count}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 min-w-[30px] text-right">
                        {pct}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Team Workload & Member Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Carga de Trabalho da Equipe</span>
              </h3>
              <span className="text-xs text-slate-400">{users.length} membros</span>
            </div>

            <div className="space-y-3">
              {stats.memberStats.map((item) => {
                const isSelected = memberFilter === item.user.id;
                return (
                  <button
                    key={item.user.id}
                    type="button"
                    onClick={() => setMemberFilter(isSelected ? 'all' : item.user.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                        : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs ${item.user.avatarBg}`}
                        >
                          {item.user.name.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {item.user.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            @{item.user.username}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                          {item.totalTasks} tarefas
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {item.doneTasks} concluídas
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${item.completionRate}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.completionRate}% concluído
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Live Interactive Task Tracking Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Rastreamento Detalhado de Tarefas</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'tarefa' : 'tarefas'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhe o status em tempo real, cronômetro Runrun.it e subtarefas.
              </p>
            </div>

            {/* Clear Filters Button if any applied */}
            {(statusFilter !== 'all' ||
              priorityFilter !== 'all' ||
              memberFilter !== 'all' ||
              deadlineFilter !== 'all' ||
              searchFilter.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setMemberFilter('all');
                  setDeadlineFilter('all');
                  setSearchFilter('');
                }}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Pesquisar tarefas no rastreador..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Status: Todos</option>
              <option value="todo">A Fazer</option>
              <option value="in_progress">Em Andamento</option>
              <option value="review">Em Revisão</option>
              <option value="done">Concluído</option>
            </select>

            {/* Priority Select */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Prioridade: Todas</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>

            {/* Member Select */}
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Responsável: Todos</option>
              <option value="unassigned">Sem responsável</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            {/* Deadline Health Select */}
            <select
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Prazo: Todos</option>
              <option value="overdue">Atrasadas</option>
              <option value="due_today">Vencem Hoje</option>
              <option value="on_track">No Prazo</option>
            </select>
          </div>
        </div>

        {/* Tracker Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Tarefa</th>
                <th className="py-3 px-4 w-36">Status</th>
                <th className="py-3 px-4 w-28">Prioridade</th>
                <th className="py-3 px-4 w-40">Responsável</th>
                <th className="py-3 px-4 w-36">Subtarefas</th>
                <th className="py-3 px-4 w-40">Prazo</th>
                <th className="py-3 px-4 w-36">Etiquetas</th>
                <th className="py-3 px-4 w-20 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-xs">Nenhuma tarefa encontrada com os filtros selecionados.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('all');
                          setPriorityFilter('all');
                          setMemberFilter('all');
                          setDeadlineFilter('all');
                          setSearchFilter('');
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline mt-1 cursor-pointer"
                      >
                        Resetar filtros de busca
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const assignee = users.find((u) => u.id === task.assigneeId);
                  const deadlineInfo = getDeadlineStatus(task.dueDate, task.columnId);
                  const isTracking = activeTrackingTaskId === task.id;
                  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
                  const totalSubtasks = task.subtasks?.length || 0;
                  const subtaskPct =
                    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
                  const trackedHrs = (task.trackedSeconds || 0) / 3600;
                  const isOverBudget = trackedHrs > task.estimatedHours && task.estimatedHours > 0;

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isTracking ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Title & Tags */}
                      <td className="py-3 px-4">
                        <div
                          className="cursor-pointer group"
                          onClick={() => onOpenDetails(task)}
                        >
                          <div className="flex items-center gap-1.5">
                            {isTracking && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0" />
                            )}
                            <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {task.title}
                            </p>
                          </div>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {task.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={task.columnId}
                          onChange={(e) => onStatusChange(task.id, e.target.value as ColumnId)}
                          className={`text-[11px] font-semibold py-1 px-2 rounded-lg border focus:outline-hidden cursor-pointer ${
                            task.columnId === 'done'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                              : task.columnId === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800'
                              : task.columnId === 'review'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <option value="todo">A Fazer</option>
                          <option value="in_progress">Em Andamento</option>
                          <option value="review">Em Revisão</option>
                          <option value="done">Concluído</option>
                        </select>
                      </td>

                      {/* Priority Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md uppercase font-semibold border inline-flex items-center gap-1 ${
                            priorityMeta[task.priority]?.badge
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityMeta[task.priority]?.dot}`} />
                          {task.priority}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-4">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${assignee.avatarBg}`}
                            >
                              {assignee.name.charAt(0)}
                            </span>
                            <div className="min-w-0">
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                                {assignee.name}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            Não atribuído
                          </span>
                        )}
                      </td>

                      {/* Subtasks Progress */}
                      <td className="py-3 px-4">
                        {totalSubtasks > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>{completedSubtasks}/{totalSubtasks}</span>
                              <span className="font-mono">{subtaskPct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  subtaskPct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                                }`}
                                style={{ width: `${subtaskPct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Deadline & SLA */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${deadlineInfo.badgeClass}`}
                        >
                          <Calendar className="w-2.5 h-2.5 shrink-0" />
                          <span>{deadlineInfo.label}</span>
                        </span>
                      </td>

                      {/* Tags / Labels */}
                      <td className="py-3 px-4">
                        {task.tags && task.tags.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            {task.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenDetails(task)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                            title="Ver detalhes da tarefa"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                            title="Apagar tarefa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
