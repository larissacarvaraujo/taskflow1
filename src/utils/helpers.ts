import { DeadlineStatus, ColumnId, Task, NotificationItem, User } from '../types';

export function getDeadlineStatus(dueDate?: string, columnId?: ColumnId): {
  status: DeadlineStatus;
  label: string;
  badgeClass: string;
  daysDiff: number;
} {
  if (columnId === 'done') {
    return {
      status: 'done',
      label: 'Concluído',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700',
      daysDiff: 0,
    };
  }

  if (!dueDate) {
    return {
      status: 'no_date',
      label: 'Sem prazo',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      daysDiff: 999,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dueDate.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      status: 'overdue',
      label: `Atrasada (${absDays}d atrás)`,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700',
      daysDiff: diffDays,
    };
  } else if (diffDays === 0) {
    return {
      status: 'due_today',
      label: 'Prazo: Hoje!',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700',
      daysDiff: 0,
    };
  } else if (diffDays === 1) {
    return {
      status: 'due_tomorrow',
      label: 'Prazo: Amanhã',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700',
      daysDiff: 1,
    };
  } else {
    return {
      status: 'on_track',
      label: `${diffDays} dias restantes`,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
      daysDiff: diffDays,
    };
  }
}

export function formatSecondsToRunrun(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatSecondsDetailed(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function extractMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9_.-]+)/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1).toLowerCase());
}

export function generateMentionNotifications(
  tasks: Task[],
  currentUserId?: string,
  users: User[] = []
): NotificationItem[] {
  const notifications: NotificationItem[] = [];
  const currentUser = users.find((u) => u.id === currentUserId);
  const currentUsername = currentUser?.username.toLowerCase();

  for (const task of tasks) {
    for (const comment of task.comments || []) {
      const mentions = comment.mentions?.length ? comment.mentions : extractMentions(comment.text);
      
      // If current user is mentioned, or if no specific user logged in, include all mentions
      const isMentioned = currentUsername ? mentions.includes(currentUsername) : mentions.length > 0;

      if (isMentioned) {
        const author = users.find((u) => u.id === comment.userId);
        notifications.push({
          id: `notif-mention-${comment.id}`,
          taskId: task.id,
          taskTitle: task.title,
          type: 'mention',
          message: `${author ? author.name : 'Alguém'} mencionou ${
            currentUsername ? 'você' : mentions.map((m) => `@${m}`).join(', ')
          }: "${comment.text.length > 70 ? comment.text.slice(0, 70) + '...' : comment.text}"`,
          createdAt: comment.createdAt,
          read: false,
          urgency: 'high',
        });
      }
    }

    // If task is assigned to current user
    if (currentUserId && task.assigneeId === currentUserId && task.columnId !== 'done') {
      notifications.push({
        id: `notif-assigned-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        type: 'assigned',
        message: `Você é responsável direto por "${task.title}".`,
        createdAt: task.createdAt,
        read: false,
        urgency: 'medium',
      });
    }
  }

  return notifications;
}

export function generateDeadlineNotifications(tasks: Task[]): NotificationItem[] {
  const notifications: NotificationItem[] = [];

  for (const task of tasks) {
    if (task.columnId === 'done') continue;
    const deadlineInfo = getDeadlineStatus(task.dueDate, task.columnId);

    if (deadlineInfo.status === 'overdue') {
      notifications.push({
        id: `notif-overdue-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        type: 'overdue',
        message: `A tarefa "${task.title}" está atrasada (${Math.abs(deadlineInfo.daysDiff)} dias). É necessária atenção imediata!`,
        createdAt: new Date().toISOString(),
        read: false,
        urgency: 'high',
      });
    } else if (deadlineInfo.status === 'due_today') {
      notifications.push({
        id: `notif-today-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        type: 'due_soon',
        message: `A tarefa "${task.title}" vence hoje! Priorize a entrega.`,
        createdAt: new Date().toISOString(),
        read: false,
        urgency: 'high',
      });
    } else if (deadlineInfo.status === 'due_tomorrow') {
      notifications.push({
        id: `notif-tomorrow-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        type: 'due_soon',
        message: `A tarefa "${task.title}" vence amanhã. Fique atento ao prazo!`,
        createdAt: new Date().toISOString(),
        read: false,
        urgency: 'medium',
      });
    }
  }

  return notifications;
}

export function exportTasksToCsv(
  tasks: Task[],
  users: User[],
  projectName: string
): { success: boolean; count: number } {
  if (tasks.length === 0) {
    return { success: false, count: 0 };
  }

  const columnLabels: Record<ColumnId, string> = {
    todo: 'A Fazer',
    in_progress: 'Em Andamento',
    review: 'Em Revisão',
    done: 'Concluído',
  };

  const priorityLabels: Record<string, string> = {
    urgente: 'Urgente',
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa',
  };

  const headers = [
    'ID da Tarefa',
    'Projeto',
    'Título da Tarefa',
    'Status (Coluna)',
    'Prioridade',
    'Responsável',
    'E-mail do Responsável',
    'Usuário (@)',
    'Cargo do Responsável',
    'Prazo de Entrega',
    'Situação do Prazo',
    'Horas Estimadas (h)',
    'Tempo Rastreado (Formatado)',
    'Tempo Rastreado (Horas Decimais)',
    'Total de Subtarefas',
    'Subtarefas Concluídas',
    'Progresso (%)',
    'Etiquetas / Tags',
    'Descrição',
    'Qtd. Comentários',
    'Criada Em',
    'Última Atualização',
  ];

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = tasks.map((task) => {
    const assignee = users.find((u) => u.id === task.assigneeId);
    const deadlineInfo = getDeadlineStatus(task.dueDate, task.columnId);
    const totalSubtasks = task.subtasks?.length || 0;
    const completedSubtasks =
      task.subtasks?.filter((s) => s.completed).length || 0;
    const progressPercent =
      totalSubtasks > 0
        ? Math.round((completedSubtasks / totalSubtasks) * 100)
        : task.columnId === 'done'
        ? 100
        : 0;

    const trackedSeconds = task.trackedSeconds || 0;
    const trackedHoursDecimal = (trackedSeconds / 3600).toFixed(2);
    const formattedTracking = formatSecondsToRunrun(trackedSeconds);
    const tagsString = (task.tags || []).join('; ');
    const commentsCount = task.comments?.length || 0;

    return [
      escapeCsv(task.id),
      escapeCsv(projectName),
      escapeCsv(task.title),
      escapeCsv(columnLabels[task.columnId] || task.columnId),
      escapeCsv(priorityLabels[task.priority] || task.priority),
      escapeCsv(assignee ? assignee.name : 'Não atribuído'),
      escapeCsv(assignee ? assignee.email : ''),
      escapeCsv(assignee ? `@${assignee.username}` : ''),
      escapeCsv(assignee ? assignee.role : ''),
      escapeCsv(task.dueDate || 'Sem prazo'),
      escapeCsv(deadlineInfo.label),
      escapeCsv(task.estimatedHours || 0),
      escapeCsv(formattedTracking),
      escapeCsv(trackedHoursDecimal),
      escapeCsv(totalSubtasks),
      escapeCsv(completedSubtasks),
      escapeCsv(`${progressPercent}%`),
      escapeCsv(tagsString),
      escapeCsv(task.description || ''),
      escapeCsv(commentsCount),
      escapeCsv(
        task.createdAt
          ? new Date(task.createdAt).toLocaleString('pt-BR')
          : ''
      ),
      escapeCsv(
        task.updatedAt
          ? new Date(task.updatedAt).toLocaleString('pt-BR')
          : ''
      ),
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel and external tools render accented characters properly
  const csvContent =
    '\uFEFF' +
    [headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','), ...rows].join(
      '\r\n'
    );

  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const sanitizedProjectName = projectName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');

  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `relatorio-tarefas-${sanitizedProjectName}-${dateStr}.csv`
  );
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, count: tasks.length };
}
