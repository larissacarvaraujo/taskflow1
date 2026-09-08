export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export type ColumnId = 'todo' | 'in_progress' | 'review' | 'done';

export interface User {
  id: string;
  name: string;
  username: string; // for @mention, e.g. "graciele"
  email: string;
  avatarBg: string;
  role: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // data URL or preview
  uploadedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  mentions: string[]; // usernames mentioned
}

export interface Task {
  id: string;
  title: string;
  description: string;
  columnId: ColumnId;
  priority: TaskPriority;
  assigneeId?: string; // directed user
  subtasks: Subtask[];
  attachments: Attachment[];
  comments: Comment[];
  dueDate: string; // YYYY-MM-DD
  estimatedHours: number;
  trackedSeconds: number; // in seconds
  isTracking?: boolean;
  trackingStartedAt?: number; // timestamp
  tags: string[];
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

export interface Column {
  id: ColumnId;
  title: string;
  description: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
}

export type NotificationType = 'overdue' | 'due_soon' | 'mention' | 'assigned';

export interface NotificationItem {
  id: string;
  taskId: string;
  taskTitle: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  read: boolean;
  urgency: 'high' | 'medium';
}

export type DeadlineStatus = 'overdue' | 'due_today' | 'due_tomorrow' | 'on_track' | 'done' | 'no_date';

export type ActiveView = 'kanban' | 'table' | 'dashboard';

export interface TeamChatMessage {
  id: string;
  projectId: string;
  userId: string;
  text: string;
  createdAt: string; // ISO string
}
